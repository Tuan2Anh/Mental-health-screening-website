import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { full_name, email, password } = await request.json();

        if (!email || !password || !full_name) {
            return NextResponse.json(
                { error: 'Vui lòng điền đầy đủ thông tin' },
                { status: 400 }
            );
        }

        // Check existing user
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email này đã được sử dụng' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                full_name,
                email,
                password: hashedPassword,
                role: 'user', // Default role
            },
        });

        return NextResponse.json({
            message: 'Đăng ký thành công',
            user: { id: user.user_id, email: user.email, name: user.full_name }
        });

    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Lỗi hệ thống, vui lòng thử lại sau' },
            { status: 500 }
        );
    }
}
