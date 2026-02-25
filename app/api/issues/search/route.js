
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const wardNumber = searchParams.get('wardNumber');
    const status = searchParams.get('status');

    const query = {};
    if (wardNumber !== undefined && wardNumber !== null) query.wardNumber = Number(wardNumber);
    if (status) query.status = status;

    const items = await db.collection('issues')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error searching issues:', error);
    return NextResponse.json({ error: 'Failed to search issues' }, { status: 500 });
  }
}
