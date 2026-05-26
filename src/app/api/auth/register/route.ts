import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const { full_name, email, password, gender, age, address } = await request.json();

        if (!email || !password || !full_name || !gender || !age || !address) {
            return NextResponse.json(
                { error: 'Vui lòng điền đầy đủ thông tin' },
                { status: 400 }
            );
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Định dạng email không hợp lệ' },
                { status: 400 }
            );
        }

        // Password validation
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 8 ký tự' },
                { status: 400 }
            );
        }
        if (!/[A-Z]/.test(password)) {
            return NextResponse.json(
                { error: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa' },
                { status: 400 }
            );
        }
        if (!/[a-z]/.test(password)) {
            return NextResponse.json(
                { error: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết thường' },
                { status: 400 }
            );
        }
        if (!/[0-9]/.test(password)) {
            return NextResponse.json(
                { error: 'Mật khẩu phải chứa ít nhất 1 chữ số' },
                { status: 400 }
            );
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            return NextResponse.json(
                { error: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' },
                { status: 400 }
            );
        }

        // Age validation
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            return NextResponse.json(
                { error: 'Tuổi phải là số từ 1 đến 120' },
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

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await prisma.user.create({
            data: {
                full_name,
                email,
                password: hashedPassword,
                role: 'user',
                gender,
                age: ageNum,
                address,
                verification_token: verificationToken,
                is_verified: false
            },
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (mailError) {
            console.error('Failed to send verification email:', mailError);
            // We still return success but maybe mention it? 
            // For now, let's assume it works or just log it.
        }

        return NextResponse.json({
            message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
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
