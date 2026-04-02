import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { pusherServer } from '@/lib/pusherServer';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const myUserId = decoded.userId;

        const { receiverId, event, callerId, callerName } = await request.json();

        // Channel name matches the chat page logic (numeric sort)
        const channelName = `chat-${[myUserId, parseInt(receiverId)].sort((a: number, b: number) => a - b).join('-')}`;

        await pusherServer.trigger(channelName, event, {
            callerId,
            callerName,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Call signal error:', error);
        return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
    }
}
