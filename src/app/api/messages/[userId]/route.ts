import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const myUserId = decoded.userId;
        const otherUserId = parseInt(params.userId);

        if (isNaN(otherUserId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { sender_id: myUserId, receiver_id: otherUserId },
                    { sender_id: otherUserId, receiver_id: myUserId },
                ]
            },
            orderBy: { created_at: 'asc' }
        });

        // Mark messages as read if receiver is me
        await prisma.message.updateMany({
            where: { receiver_id: myUserId, sender_id: otherUserId, is_read: false },
            data: { is_read: true }
        });

        const otherUser = await prisma.user.findUnique({
            where: { user_id: otherUserId },
            select: { full_name: true, email: true, avatar: true, specialty: true }
        });

        return NextResponse.json({ messages, otherUser });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
