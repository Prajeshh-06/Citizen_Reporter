
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const { db } = await connectToDatabase();

    let doc = null;
    if (ObjectId.isValid(id)) {
      doc = await db.collection('issues').findOne({ _id: new ObjectId(id) });
    }
    if (!doc) {
      doc = await db.collection('issues').findOne({ _id: id });
    }

    if (!doc) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}
