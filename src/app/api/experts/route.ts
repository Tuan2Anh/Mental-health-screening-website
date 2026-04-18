import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const experts = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'expert' },
          { role: 'Expert' }
        ]
      },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        avatar: true,
        specialty: true,
      },
      orderBy: {
        full_name: 'asc'
      }
    });

    return NextResponse.json(experts);
  } catch (error) {
    console.error('Error fetching experts:', error);
    return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 });
  }
}
