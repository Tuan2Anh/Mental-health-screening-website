import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function GET() {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
        return NextResponse.json({ user: null });
    }

    try {
        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        // Fetch fresh data from DB
        const user = await prisma.user.findUnique({
            where: { user_id: Number(decoded.userId) },
            select: {
                user_id: true,
                full_name: true,
                email: true,
                role: true,
                avatar: true,
                specialty: true,
                gender: true,
                age: true,
                address: true,
                created_at: true,
                _count: {
                    select: {
                        testResults: true,
                        appointmentsAsUser: true,
                        appointmentsAsExpert: true
                    }
                }
            }
        });
        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json({ user: null });
    }
}

export async function PUT(req: Request) {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const { fullName, avatar, gender, age, address } = await req.json();

        const updatedUser = await prisma.user.update({
            where: { user_id: Number(decoded.userId) },
            data: {
                full_name: fullName,
                avatar: avatar,
                gender,
                age: age ? parseInt(age.toString()) : null,
                address
            }
        });

        return NextResponse.json({ 
            message: 'Cập nhật thành công',
            user: {
                user_id: updatedUser.user_id,
                full_name: updatedUser.full_name,
                avatar: updatedUser.avatar,
                email: updatedUser.email,
                role: updatedUser.role,
                gender: updatedUser.gender,
                age: updatedUser.age,
                address: updatedUser.address
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 });
    }
}
