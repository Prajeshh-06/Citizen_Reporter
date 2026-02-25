
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { validate, CommentSchema } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

async function updateByEitherId(collection, id, update, options) {
  if (ObjectId.isValid(id)) {
    const r1 = await collection.findOneAndUpdate({ _id: new ObjectId(id) }, update, options);
    const doc1 = r1?.value ?? r1;
    if (doc1) return doc1;
  }
  const r2 = await collection.findOneAndUpdate({ _id: id }, update, options);
  return (r2?.value ?? r2) || null;
}

export async function POST(request, { params }) {
  const authError = await verifyToken(request);
  if (authError) return authError;

  const validationError = await validate(CommentSchema)(request);
  if (validationError) return validationError;

  const { id } = await params;
  const { text } = request.parsedBody;

  const comment = {
    userId: request.user.id,
    user: request.user.name,
    text,
    timestamp: new Date(),
  };

  try {
    const { db } = await connectToDatabase();
    const doc = await updateByEitherId(
      db.collection('issues'),
      id,
      { $push: { comments: comment }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!doc) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
