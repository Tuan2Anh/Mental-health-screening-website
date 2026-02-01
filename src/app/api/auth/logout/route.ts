import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const cookieSerialized = serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0, // Expire immediately
        path: '/',
    });

    return NextResponse.json(
        { message: 'Đăng xuất thành công' },
        {
            headers: { 'Set-Cookie': cookieSerialized },
        }
    );
}
