import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

        const { receiverId, content, isCallSignal, isTranscriptPart, isPeerDiscovery, sender_peer_id, isJoining } = await request.json();

        if (!receiverId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const channelName = `chat-${[myUserId, parseInt(receiverId)].sort((a: number, b: number) => a - b).join('-')}`;
        
        // Handle specialized call signals
        if (isCallSignal) {
            if (isPeerDiscovery) {
                await pusherServer.trigger(channelName, 'peer-discovery', { sender_id: myUserId, peer_id: content });
                return NextResponse.json({ success: true, signal: 'peer-discovered' });
            }
            if (content === '__CALL_ENDED__') {
                await pusherServer.trigger(channelName, 'end-call', { sender_id: myUserId });
                return NextResponse.json({ success: true, signal: 'end-call' });
            }
            if (content === '__INCOMING_CALL__') {
                await pusherServer.trigger(channelName, 'incoming-call', { sender_id: myUserId, sender_peer_id });
                return NextResponse.json({ success: true, signal: 'incoming-call-sent' });
            }
            if (content === '__CALL_REJECTED__') {
                await pusherServer.trigger(channelName, 'call-rejected', { sender_id: myUserId });
                return NextResponse.json({ success: true, signal: 'call-rejected-sent' });
            }
        }

        // Handle real-time transcription signals
        if (isTranscriptPart) {
            await pusherServer.trigger(channelName, 'transcript-signal', { 
                sender_id: myUserId, 
                text: content,
                isJoining: isJoining === true
            });
            return NextResponse.json({ success: true, signal: 'transcript-sent' });
        }

        // Final safety: if any special signal reached here, don't save to DB
        if (isCallSignal || isTranscriptPart || isPeerDiscovery) {
            return NextResponse.json({ success: true, signal: 'signal-ignored' });
        }

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

        // Trigger Pusher real-time event
        await pusherServer.trigger(channelName, 'new-message', {
            message_id: message.message_id,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            content: message.content,
            created_at: message.created_at,
        });

        // Create notification (only if no unread notification exists)
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

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
