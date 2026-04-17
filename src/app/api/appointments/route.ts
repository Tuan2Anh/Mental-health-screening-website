import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sendAppointmentNotificationEmail } from '@/lib/mail';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const userId = decoded.userId;

        const { expertId, time, type } = await request.json();

        if (!expertId || !time || !type) {
            return NextResponse.json({ error: 'Missing necessary fields' }, { status: 400 });
        }

        const appointmentDate = new Date(time);
        const now = new Date();

        // 1. Kiểm tra không được đặt lịch ở quá khứ
        if (appointmentDate < now) {
            return NextResponse.json({ error: 'Không thể đặt lịch hẹn ở quá khứ. Vui lòng chọn thời gian khác.' }, { status: 400 });
        }

        // 2. Kiểm tra trùng lịch (Overlap check - giả định mỗi ca 45 phút)
        const fortyFiveMinutes = 45 * 60 * 1000;
        const startTimeLimit = new Date(appointmentDate.getTime() - fortyFiveMinutes);
        const endTimeLimit = new Date(appointmentDate.getTime() + fortyFiveMinutes);

        const overlapping = await prisma.appointment.findFirst({
            where: {
                expert_id: parseInt(expertId),
                appointment_time: {
                    gt: startTimeLimit,
                    lt: endTimeLimit
                },
                status: { not: 'cancelled' } // Không tính các lịch đã hủy
            }
        });

        if (overlapping) {
            return NextResponse.json({ 
                error: 'Bác sĩ đã có lịch hẹn khác trong khoảng thời gian này. Vui lòng chọn khung giờ khác (cách ít nhất 45 phút).' 
            }, { status: 400 });
        }

        // Fetch user and expert info for email
        const user = await prisma.user.findUnique({ where: { user_id: userId } });
        const expert = await prisma.user.findUnique({ where: { user_id: parseInt(expertId) } });

        if (!expert) return NextResponse.json({ error: 'Expert not found' }, { status: 404 });

        const appointment = await prisma.appointment.create({
            data: {
                user_id: userId,
                expert_id: parseInt(expertId),
                appointment_time: appointmentDate,
                type: type, // online, offline
                status: 'pending'
            }
        });

        // Create notification for the expert
        await prisma.notification.create({
            data: {
                user_id: parseInt(expertId),
                content: `Bạn có một lịch hẹn mới đang chờ xác nhận vào ngày ${new Date(time).toLocaleDateString('vi-VN')} lúc ${new Date(time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}.`,
                link: '/appointments'
            }
        });

        // Send Email Notification
        try {
            await sendAppointmentNotificationEmail(expert.email, {
                time: time,
                type: type,
                userName: user?.full_name || 'Bệnh nhân'
            });
        } catch (mailError) {
            console.error('Failed to send appointment email:', mailError);
        }

        return NextResponse.json(appointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const userId = decoded.userId;
        const role = decoded.role;

        let appointments;
        if (role === 'expert') {
             // For expert, fetch where expert_id = userId
             appointments = await prisma.appointment.findMany({
                 where: { expert_id: userId },
                 include: {
                     user: { select: { full_name: true, email: true, user_id: true } }
                 },
                 orderBy: { appointment_time: 'desc' }
             });
        } else {
             // For standard user
             appointments = await prisma.appointment.findMany({
                 where: { user_id: userId },
                    include: {
                        expert: {
                            select: {
                                full_name: true,
                                email: true,
                                user_id: true,
                                specialty: true,
                                avatar: true,
                            },
                        },
                    },
                 orderBy: { appointment_time: 'desc' }
             });
        }

        return NextResponse.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}
