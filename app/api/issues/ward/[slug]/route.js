
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { slug } = await params;

    const rawWardName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const escaped = rawWardName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = { wardName: new RegExp(`^${escaped}$`, 'i') };

    const issues = await db.collection('issues')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const stats = issues.reduce((acc, issue) => {
      const status = issue.status || 'open';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      wardName: rawWardName,
      issues,
      stats,
      total: issues.length,
    });
  } catch (error) {
    console.error('Error fetching ward issues:', error);
    return NextResponse.json({ error: 'Failed to fetch ward issues' }, { status: 500 });
  }
}
