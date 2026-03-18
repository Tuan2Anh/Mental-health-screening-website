import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function PUT(request: Request, { params }: { params: { appointmentId: string } }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        
        // Only experts (or maybe admin) should approve appointments.
        if (decoded.role !== 'expert' && decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const appointmentIdInt = parseInt(params.appointmentId);
        if (isNaN(appointmentIdInt)) {
             return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const { status } = await request.json();

        if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { appointment_id: appointmentIdInt },
            data: { status: status }
        });

        const statusText = status === 'confirmed' ? 'đã được xác nhận' : status === 'cancelled' ? 'bị từ chối' : 'đã hoàn thành';

        await prisma.notification.create({
            data: {
                user_id: updatedAppointment.user_id,
                content: `Lịch hẹn với chuyên gia của bạn vào ngày ${new Date(updatedAppointment.appointment_time).toLocaleDateString('vi-VN')} ${statusText}.`,
                link: '/appointments'
            }
        });

        return NextResponse.json(updatedAppointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }
}
