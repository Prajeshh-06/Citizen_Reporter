
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { requireRole } from '@/lib/roles';

export async function GET(request) {
  const authError = await verifyToken(request);
  if (authError) return authError;

  const roleError = requireRole(['admin'])(request);
  if (roleError) return roleError;

  try {
    const { db } = await connectToDatabase();

    const [stats] = await db.collection('issues').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const allStats = await db.collection('issues').aggregate([
      {
        $facet: {
          total: [{ $count: 'n' }],
          open: [{ $match: { status: 'open' } }, { $count: 'n' }],
          in_progress: [{ $match: { status: 'in_progress' } }, { $count: 'n' }],
          resolved: [{ $match: { status: 'resolved' } }, { $count: 'n' }],
          priorityLow: [{ $match: { priorityLabel: 'Low' } }, { $count: 'n' }],
          priorityMedium: [{ $match: { priorityLabel: 'Medium' } }, { $count: 'n' }],
          priorityHigh: [{ $match: { priorityLabel: 'High' } }, { $count: 'n' }],
          priorityCritical: [{ $match: { priorityLabel: 'Critical' } }, { $count: 'n' }],
        },
      },
    ]).toArray();

    const s = allStats[0];
    return NextResponse.json({
      total: s.total[0]?.n ?? 0,
      open: s.open[0]?.n ?? 0,
      in_progress: s.in_progress[0]?.n ?? 0,
      resolved: s.resolved[0]?.n ?? 0,
      priority: {
        Low: s.priorityLow[0]?.n ?? 0,
        Medium: s.priorityMedium[0]?.n ?? 0,
        High: s.priorityHigh[0]?.n ?? 0,
        Critical: s.priorityCritical[0]?.n ?? 0,
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
