import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function GET() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const userId = decoded.userId;

        const notifications = await prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        // Also let's calculate unread count from messages as "chat notifications" 
        // We'll bundle normal notifications and a unreadMessage count.
        const unreadMessagesCount = await prisma.message.count({
            where: {
                receiver_id: userId,
                is_read: false
            }
        });

        return NextResponse.json({
            notifications,
            unreadMessagesCount
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
