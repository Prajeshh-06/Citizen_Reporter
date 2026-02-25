

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password required'),
});

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

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

    const result = LoginSchema.safeParse(body);
    if (!result.success) {
        const details = result.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
        }));
        return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
    }

    const { email, password } = result.data;

    try {
        const { db } = await connectToDatabase();
        const users = db.collection('users');

        const user = await users.findOne({ email: email.toLowerCase() });

        const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
        const hashToCompare = user ? user.passwordHash : dummyHash;
        const passwordMatch = await bcrypt.compare(password, hashToCompare);

        if (!user || !passwordMatch) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const payload = {
            id: String(user._id),
            email: user.email,
            name: user.name,
            role: user.role,
            wardNumber: user.wardNumber ?? null,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return NextResponse.json({ token, user: payload });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
