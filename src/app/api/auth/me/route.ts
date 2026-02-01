import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function GET() {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
        return NextResponse.json({ user: null });
    }

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET);
        return NextResponse.json({ user: decoded });
    } catch (error) {
        return NextResponse.json({ user: null });
    }
}
