import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

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

export async function POST(request: Request) {
    try {
        // --- AUTH CHECK ---
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        if (decoded.role !== 'expert' && decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // ------------------

        const body = await request.json();
        const { scale_name, description, questions } = body;

        if (!scale_name || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newScale = await prisma.psychoScale.create({
            data: {
                scale_name,
                description,
                questions: {
                    create: questions.map((q: any) => ({
                        content: q.content,
                        score_min: q.score_min || 0,
                        score_max: q.score_max || 3,
                    }))
                }
            },
            include: {
                questions: true
            }
        });

        return NextResponse.json(newScale);
    } catch (error) {
        console.error('Error creating scale:', error);
        return NextResponse.json({ error: 'Failed to create scale' }, { status: 500 });
    }
}
