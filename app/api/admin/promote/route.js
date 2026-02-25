

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { validate, PromoteSchema } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';
import { requireRole } from '@/lib/roles';

export async function POST(request) {
    const authError = await verifyToken(request);
    if (authError) return authError;

    const roleError = requireRole(['admin'])(request);
    if (roleError) return roleError;

    const validationError = await validate(PromoteSchema)(request);
    if (validationError) return validationError;

    const { email, role, wardNumber } = request.parsedBody;

    const resolvedWard = role === 'municipality' ? (wardNumber ?? null) : null;

    try {
        const { db } = await connectToDatabase();

        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateResult = await db.collection('users').findOneAndUpdate(
            { email },
            {
                $set: {
                    role,
                    wardNumber: resolvedWard,
                    updatedAt: new Date(),
                },
            },
            { returnDocument: 'after' }
        );

        const updatedUser = updateResult?.value ?? updateResult;
        if (!updatedUser) {
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        const { passwordHash, ...safeUser } = updatedUser;

        return NextResponse.json({
            message: 'Role updated successfully. User must log out and log back in to refresh their role.',
            user: safeUser,
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
