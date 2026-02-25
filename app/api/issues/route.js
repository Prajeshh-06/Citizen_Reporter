
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { validate, IssueCreateSchema } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';
import { locateWard } from '@/lib/locator';
import { analyzePriority } from '@/lib/aiPriorityEngine';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const cursor = searchParams.get('cursor');
    const wardSlug = searchParams.get('ward');

    const query = {};

    if (cursor && /^[0-9a-fA-F]{24}$/.test(cursor)) {
      query._id = { $lt: new ObjectId(cursor) };
    }

    if (wardSlug) {
      const escaped = wardSlug.replace(/-/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.wardName = new RegExp(`^${escaped}$`, 'i');
    }

    const items = await db.collection('issues')
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    const nextCursor = items.length ? String(items[items.length - 1]._id) : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = await verifyToken(request);
  if (authError) return authError;

  const validationError = await validate(IssueCreateSchema)(request);
  if (validationError) return validationError;

  try {
    const { db } = await connectToDatabase();

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentIssue = await db.collection('issues').findOne({
      userId: request.user.id,
      createdAt: { $gte: twoMinutesAgo }
    });

    if (recentIssue) {
      return NextResponse.json({ error: 'Please wait a couple of minutes before reporting another issue to prevent spam.' }, { status: 429 });
    }

    const { title, description, category, lat, lng, photo, priority } = request.parsedBody;

    let wardInfo = null;
    if (typeof lat === 'number' && typeof lng === 'number') {
      wardInfo = locateWard(lat, lng);
      if (!wardInfo) {
        return NextResponse.json({ error: 'Location outside service area' }, { status: 400 });
      }
    }

    let imageData = null;
    if (photo && photo.startsWith('data:image/')) {
      try {
        const base64Data = photo.split(',')[1];
        imageData = Buffer.from(base64Data, 'base64').toString('base64');
      } catch {
        return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
      }
    }

    const aiResult = analyzePriority(title, description, category);

    const now = new Date();
    const doc = {
      title,
      description,
      category,
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
      photo: imageData,
      wardNumber: wardInfo?.wardNumber ?? null,
      wardName: wardInfo?.wardName ?? null,
      upvotes: 0,
      upvotedBy: [],
      priorityScore: aiResult.priorityScore,
      priorityLabel: aiResult.priorityLabel,
      priority: priority || aiResult.priorityLabel.toLowerCase(),
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
    return NextResponse.json({ id: result.insertedId, ...doc, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}
