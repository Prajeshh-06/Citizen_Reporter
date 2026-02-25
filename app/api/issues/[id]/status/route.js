
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { validate, StatusSchema } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';
import { requireRole, requireWardMatch } from '@/lib/roles';

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

  const roleError = requireRole(['admin', 'municipality'])(request);
  if (roleError) return roleError;

  const validationError = await validate(StatusSchema)(request);
  if (validationError) return validationError;

  const { id } = await params;

  if (!request.parsedBody) {
    return NextResponse.json({ error: 'Request body missing' }, { status: 400 });
  }

  const { status, statusChangeReason } = request.parsedBody;

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

    const wardError = requireWardMatch(request, issue.wardNumber);
    if (wardError) return wardError;

    const set = { updatedAt: new Date(), assignedTo: request.user.email };
    if (status) set.status = status;

    const update = {
      $set: set,
      $push: {
        history: {
          status,
          assignedTo: request.user.email,
          reason: statusChangeReason,
          timestamp: new Date(),
        },
      },
    };

    const doc = await updateByEitherId(
      db.collection('issues'),
      id,
      update,
      { returnDocument: 'after' }
    );

    if (!doc) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
