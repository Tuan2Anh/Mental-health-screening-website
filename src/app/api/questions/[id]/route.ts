import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const questions = await prisma.question.findMany({
            where: {
                scale_id: parseInt(params.id),
            },
        });

        const scale = await prisma.psychoScale.findUnique({
            where: { scale_id: parseInt(params.id) },
        });

        if (!scale) {
            return NextResponse.json({ error: 'Scale not found' }, { status: 404 });
        }

        return NextResponse.json({ scale, questions });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}
