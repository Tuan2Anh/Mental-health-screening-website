import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Vui lòng nhập email và mật khẩu' },
                { status: 400 }
            );
        }

        // Check user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Email hoặc mật khẩu không chính xác' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Email hoặc mật khẩu không chính xác' },
                { status: 401 }
            );
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role, name: user.full_name },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set Cookie
        const cookieSerialized = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400, // 1 day
            path: '/',
        });

        return NextResponse.json(
            {
                message: 'Đăng nhập thành công',
                user: { id: user.user_id, email: user.email, name: user.full_name, role: user.role }
            },
            {
                headers: { 'Set-Cookie': cookieSerialized },
            }
        );

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Lỗi hệ thống' },
            { status: 500 }
        );
    }
}
