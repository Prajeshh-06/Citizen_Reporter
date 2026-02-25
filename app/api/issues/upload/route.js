
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { locateWard } from '@/lib/locator';
import exif from 'exif-parser';

function parseDMS(dms, ref) {
  if (typeof dms === 'string') {
    const match = dms.match(/(\d+)[^\d]+(\d+)[^\d]+([\d.]+)/);
    if (match) {
      const decimal =
        parseFloat(match[1]) + parseFloat(match[2]) / 60 + parseFloat(match[3]) / 3600;
      return ref === 'S' || ref === 'W' ? -decimal : decimal;
    }
  } else if (Array.isArray(dms)) {
    const decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
    return ref === 'S' || ref === 'W' ? -decimal : decimal;
  }
  return null;
}

export async function POST(request) {
  const authError = await verifyToken(request);
  if (authError) return authError;

  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();

    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const latIn = formData.get('lat');
    const lngIn = formData.get('lng');
    const photoFile = formData.get('photo');

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'title, description, and category are required' },
        { status: 400 }
      );
    }

    let lat = null;
    let lng = null;
    let imageData = null;

    if (photoFile) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      imageData = buffer.toString('base64');

      try {
        const parsed = exif.create(buffer).parse();
        if (
          parsed.tags.GPSLatitude &&
          parsed.tags.GPSLongitude &&
          parsed.tags.GPSLatitudeRef &&
          parsed.tags.GPSLongitudeRef
        ) {
          lat = parseDMS(parsed.tags.GPSLatitude, parsed.tags.GPSLatitudeRef);
          lng = parseDMS(parsed.tags.GPSLongitude, parsed.tags.GPSLongitudeRef);
        }
      } catch {
        console.warn('EXIF GPS parse failed or no GPS tags');
      }
    }

    if (lat === null || lng === null) {
      const fl = Number(latIn);
      const fg = Number(lngIn);
      if (Number.isFinite(fl) && Number.isFinite(fg)) {
        lat = fl;
        lng = fg;
      }
    }

    if (lat === null || lng === null) {
      return NextResponse.json(
        { error: 'Valid lat/lng coordinates required (via EXIF or form fields)' },
        { status: 400 }
      );
    }

    const wardInfo = locateWard(lat, lng);
    if (!wardInfo) {
      return NextResponse.json({ error: 'Location outside supported area' }, { status: 400 });
    }

    const now = new Date();
    const doc = {
      title,
      description,
      category,
      lat,
      lng,
      photo: imageData,
      wardNumber: wardInfo.wardNumber ?? null,
      wardName: wardInfo.wardName ?? null,
      upvotes: 0,
      upvotedBy: [],
      priority: 'medium',
      status: 'open',
      assignedTo: null,
      history: [{ status: 'open', timestamp: now }],
      comments: [],
      flags: [],
      feedback: null,
      userId: request.user.id,
      reporterEmail: request.user.email,
      reporterName: request.user.name,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('issues').insertOne(doc);
    return NextResponse.json({ id: result.insertedId, ...doc }, { status: 201 });
  } catch (error) {
    console.error('Error uploading issue:', error);
    return NextResponse.json({ error: 'Failed to upload issue' }, { status: 500 });
  }
}
