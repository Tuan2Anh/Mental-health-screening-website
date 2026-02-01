import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const scales = await prisma.psychoScale.findMany({
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });
        return NextResponse.json(scales);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch scales' }, { status: 500 });
    }
}
