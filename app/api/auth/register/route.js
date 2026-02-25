

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2).max(100),
});

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

export async function POST(request) {
    if (!JWT_SECRET) {
        console.error('JWT_SECRET not configured');
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
        const details = result.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
        }));
        return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
    }

    const { email, password, name } = result.data;

    try {
        const { db } = await connectToDatabase();
        const users = db.collection('users');

        const existing = await users.findOne({ email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const now = new Date();
        const doc = {
            email: email.toLowerCase(),
            passwordHash,
            name,
            role: 'citizen',
            wardNumber: null,
            createdAt: now,
            updatedAt: now,
        };

        const insertResult = await users.insertOne(doc);
        const userId = String(insertResult.insertedId);

        const payload = {
            id: userId,
            email: doc.email,
            name: doc.name,
            role: doc.role,
            wardNumber: doc.wardNumber,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return NextResponse.json(
            {
                token,
                user: payload,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
