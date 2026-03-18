import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const myUserId = decoded.userId;

        const { receiverId, content } = await request.json();

        if (!receiverId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const message = await prisma.message.create({
            data: {
                sender_id: myUserId,
                receiver_id: parseInt(receiverId),
                content: content,
            }
        });

        // Fetch sender's name
        const sender = await prisma.user.findUnique({
            where: { user_id: myUserId },
            select: { full_name: true }
        });

        // Check if there is already an unread "new message" notification
        const existingNotif = await prisma.notification.findFirst({
            where: {
                user_id: parseInt(receiverId),
                is_read: false,
                content: { contains: `Tin nhắn mới từ ${sender?.full_name}` }
            }
        });

        if (!existingNotif) {
            await prisma.notification.create({
                data: {
                    user_id: parseInt(receiverId),
                    content: `Tin nhắn mới từ ${sender?.full_name}`,
                    link: `/chat/${myUserId}`
                }
            });
        }

        // Note: For real-time, this should trigger a WebSocket event.
        // For a minimal implementation without setting up a custom socket server for Next.js, 
        // polling is sufficient, but using a custom NodeJS logic or third party (Pusher) is ideal for "real time".
        // Let's keep it simple for now as DB layer.

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
