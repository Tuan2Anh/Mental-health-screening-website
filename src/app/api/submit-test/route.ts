import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface SubmitBody {
    scaleId: number;
    answers: { questionId: number; score: number }[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'psycho-secret-key-123';

export async function POST(request: Request) {
    try {
        const body: SubmitBody = await request.json();
        const { scaleId, answers } = body;

        // --- AUTH CHECK ---
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token');
        let userId = 1; // Default to admin/guest if logic permits, but ideally we force auth.

        if (token) {
            try {
                const decoded: any = jwt.verify(token.value, JWT_SECRET);
                userId = decoded.userId;
            } catch (err) { }
        }
        // ------------------

        // DASS-21 Scoring Map (Question IDs or Indices depend on DB)
        // Assuming Questions 1-21 in DB match the standard order.
        // If DB IDs are auto-incremented and might not stem from 1, we should be careful.
        // However, for this project's scope, we assume index mapping or sort by ID.

        // Let's fetch questions from DB to map ID to Index properly (safer)
        const questionsInDb = await prisma.question.findMany({
            where: { scale_id: scaleId },
            orderBy: { question_id: 'asc' } // Assuming insertion order matches 1-21
        });

        // Map answer to question index (0-based)
        const answersMap = new Map<number, number>(); // questionId -> score
        answers.forEach(a => answersMap.set(a.questionId, a.score));

        // Categories (using 0-based index)
        const categories = {
            S: [0, 5, 7, 10, 11, 13, 17], // Stress: 1, 6, 8, 11, 12, 14, 18
            A: [1, 3, 6, 8, 14, 18, 19],  // Anxiety: 2, 4, 7, 9, 15, 19, 20
            D: [2, 4, 9, 12, 15, 16, 20]  // Depression: 3, 5, 10, 13, 16, 17, 21
        };

        // Calculate Raw Scores
        let rawS = 0, rawA = 0, rawD = 0;

        questionsInDb.forEach((q, index) => {
            const score = answersMap.get(q.question_id) || 0;
            if (categories.S.includes(index)) rawS += score;
            else if (categories.A.includes(index)) rawA += score;
            else if (categories.D.includes(index)) rawD += score;
        });

        // Multiply by 2
        const scoreS = rawS * 2;
        const scoreA = rawA * 2;
        const scoreD = rawD * 2;

        // Determine Levels function
        const getLevel = (score: number, type: 'D' | 'A' | 'S') => {
            if (type === 'D') {
                if (score <= 9) return 'Bình thường';
                if (score <= 13) return 'Nhẹ';
                if (score <= 20) return 'Vừa';
                if (score <= 27) return 'Nặng';
                return 'Rất nặng';
            }
            if (type === 'A') {
                if (score <= 7) return 'Bình thường';
                if (score <= 9) return 'Nhẹ';
                if (score <= 14) return 'Vừa';
                if (score <= 19) return 'Nặng';
                return 'Rất nặng';
            }
            if (type === 'S') {
                if (score <= 14) return 'Bình thường';
                if (score <= 18) return 'Nhẹ';
                if (score <= 25) return 'Vừa';
                if (score <= 33) return 'Nặng';
                return 'Rất nặng';
            }
            return 'Không xác định';
        };

        const resultDetails = {
            depression: { score: scoreD, level: getLevel(scoreD, 'D') },
            anxiety: { score: scoreA, level: getLevel(scoreA, 'A') },
            stress: { score: scoreS, level: getLevel(scoreS, 'S') }
        };

        const totalScore = scoreD + scoreA + scoreS; // Or just save the detail string

        // Save Result
        const testResult = await prisma.testResult.create({
            data: {
                user_id: userId,
                scale_id: scaleId,
                total_score: totalScore,
                risk_level: JSON.stringify(resultDetails), // Storing JSON in string field
                answers: {
                    create: answers.map(a => ({
                        question_id: a.questionId,
                        selected_score: a.score
                    }))
                }
            }
        });

        return NextResponse.json({ ...testResult, resultDetails });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
    }
}
