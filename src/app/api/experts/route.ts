import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const experts = await prisma.user.findMany({
      where: {
        role: 'expert',
      },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        avatar: true,
        specialty: true,
      },
    });

    return NextResponse.json(experts);
  } catch (error) {
    console.error('Error fetching experts:', error);
    return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 });
  }
}
