import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
        }

        const user = await prisma.user.findFirst({
            where: { verification_token: token },
        });

        if (!user) {
            return NextResponse.redirect(new URL('/login?error=token_not_found', request.url));
        }

        await prisma.user.update({
            where: { user_id: user.user_id },
            data: {
                is_verified: true,
                verification_token: null,
            },
        });

        return NextResponse.redirect(new URL('/login?verified=true', request.url));

    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
}
