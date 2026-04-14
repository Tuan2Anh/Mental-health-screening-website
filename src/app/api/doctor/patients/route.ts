import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

// Fetch patients who have appointments with the current doctor
export async function GET() {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const doctorId = Number(decoded.userId);

        // Verify role
        const doctor = await prisma.user.findUnique({ where: { user_id: doctorId } });
        if (doctor?.role !== 'expert') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Get unique patients from appointments
        const appointments = await prisma.appointment.findMany({
            where: { expert_id: doctorId },
            include: {
                user: {
                    include: {
                        patientProfiles: {
                            where: { doctor_id: doctorId }
                        }
                    }
                }
            },
            orderBy: { appointment_time: 'desc' }
        });

        // Unique patients by ID
        const patientMap = new Map();
        appointments.forEach(app => {
            if (!patientMap.has(app.user_id)) {
                const profile = app.user.patientProfiles[0] || null;
                patientMap.set(app.user_id, {
                    ...app.user,
                    status: profile?.status || 'Bình thường',
                    notes: profile?.notes || '',
                    profileId: profile?.id || null
                });
            }
        });

        return NextResponse.json(Array.from(patientMap.values()));
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Update patient status or create profile
export async function POST(req: Request) {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        const doctorId = Number(decoded.userId);
        const { patientId, status, notes } = await req.json();

        const profile = await prisma.patientProfile.upsert({
            where: {
                patient_id_doctor_id: {
                    patient_id: Number(patientId),
                    doctor_id: doctorId
                }
            },
            update: {
                status: status,
                notes: notes
            },
            create: {
                patient_id: Number(patientId),
                doctor_id: doctorId,
                status: status,
                notes: notes
            }
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
