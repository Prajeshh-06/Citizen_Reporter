
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function POST(request, { params }) {
  const authError = await verifyToken(request);
  if (authError) return authError;

  const { id } = await params;
  const userId = request.user.id;

  try {
    const { db } = await connectToDatabase();

    let issue = null;
    if (ObjectId.isValid(id)) {
      issue = await db.collection('issues').findOne({ _id: new ObjectId(id) });
    }
    if (!issue) {
      issue = await db.collection('issues').findOne({ _id: id });
    }
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const upvotedBy = Array.isArray(issue.upvotedBy) ? issue.upvotedBy : [];
    const alreadyVoted = upvotedBy.some(uid => String(uid) === String(userId));

    const update = alreadyVoted
      ? { $pull: { upvotedBy: userId }, $set: { updatedAt: new Date() } }
      : { $addToSet: { upvotedBy: userId }, $set: { updatedAt: new Date() } };

    const result = await db.collection('issues').findOneAndUpdate(
      { _id: issue._id },
      update,
      { returnDocument: 'after' }
    );

    const updatedDoc = result?.value ?? result;
    if (!updatedDoc) {
      return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
    }

    const finalUpvotedBy = Array.isArray(updatedDoc.upvotedBy) ? updatedDoc.upvotedBy : [];
    const actualCount = finalUpvotedBy.length;

    if (updatedDoc.upvotes !== actualCount) {
      await db.collection('issues').updateOne(
        { _id: issue._id },
        { $set: { upvotes: actualCount } }
      );
      updatedDoc.upvotes = actualCount;
    }

    return NextResponse.json({ ...updatedDoc, upvotes: actualCount });
  } catch (error) {
    console.error('Error upvoting issue:', error);
    return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 });
  }
}
