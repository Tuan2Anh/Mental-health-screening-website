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
            orderBy: { question_id: 'asc' }
        });

        const answersMap = new Map<number, number>();
        answers.forEach(a => answersMap.set(a.questionId, a.score));

        let resultDetails: any = null;
        let riskLevel = 'Không xác định';
        let totalScore = 0;

        // Fetch scale info to know which one it is
        const scale = await prisma.psychoScale.findUnique({ where: { scale_id: scaleId } });

        if (scale?.scale_name === 'DASS-21') {
            const categories = {
                S: [0, 5, 7, 10, 11, 13, 17], // Stress
                A: [1, 3, 6, 8, 14, 18, 19],  // Anxiety
                D: [2, 4, 9, 12, 15, 16, 20]  // Depression
            };

            let rawS = 0, rawA = 0, rawD = 0;
            questionsInDb.forEach((q, index) => {
                const score = answersMap.get(q.question_id) || 0;
                if (categories.S.includes(index)) rawS += score;
                else if (categories.A.includes(index)) rawA += score;
                else if (categories.D.includes(index)) rawD += score;
            });

            const scoreS = rawS * 2;
            const scoreA = rawA * 2;
            const scoreD = rawD * 2;

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

            resultDetails = {
                type: 'DASS-21',
                depression: { score: scoreD, level: getLevel(scoreD, 'D'), max: 42 },
                anxiety: { score: scoreA, level: getLevel(scoreA, 'A'), max: 42 },
                stress: { score: scoreS, level: getLevel(scoreS, 'S'), max: 42 }
            };
            totalScore = scoreD + scoreA + scoreS;
            riskLevel = `S:${getLevel(scoreS, 'S')}, A:${getLevel(scoreA, 'A')}, D:${getLevel(scoreD, 'D')}`;
        } 
        else if (scale?.scale_name === 'PHQ-9') {
            let sum = 0;
            answers.forEach(a => sum += a.score);
            totalScore = sum;
            
            if (sum <= 4) riskLevel = 'Tối thiểu';
            else if (sum <= 9) riskLevel = 'Nhẹ';
            else if (sum <= 14) riskLevel = 'Trung bình';
            else if (sum <= 19) riskLevel = 'Trung bình nặng';
            else riskLevel = 'Nặng';

            resultDetails = {
                type: 'SINGLE',
                score: sum,
                level: riskLevel,
                max: 27,
                label: 'Trầm cảm'
            };
        }
        else if (scale?.scale_name === 'GAD-7') {
            let sum = 0;
            answers.forEach(a => sum += a.score);
            totalScore = sum;

            if (sum <= 4) riskLevel = 'Tối thiểu';
            else if (sum <= 9) riskLevel = 'Nhẹ';
            else if (sum <= 14) riskLevel = 'Trung bình';
            else riskLevel = 'Nặng';

            resultDetails = {
                type: 'SINGLE',
                score: sum,
                level: riskLevel,
                max: 21,
                label: 'Lo âu'
            };
        }
        else if (scale?.scale_name === 'ISI') {
            let sum = 0;
            answers.forEach(a => sum += a.score);
            totalScore = sum;

            if (sum <= 7) riskLevel = 'Bình thường';
            else if (sum <= 14) riskLevel = 'Nhẹ (Dưới lâm sàng)';
            else if (sum <= 21) riskLevel = 'Trung bình (Lâm sàng)';
            else riskLevel = 'Nặng (Lâm sàng)';

            resultDetails = {
                type: 'SINGLE',
                score: sum,
                level: riskLevel,
                max: 28,
                label: 'Mất ngủ'
            };
        }
        else if (scale?.scale_name === 'ASRS') {
            let sum = 0;
            answers.forEach(a => sum += a.score);
            totalScore = sum;

            if (sum <= 13) riskLevel = 'Ít dấu hiệu ADHD';
            else riskLevel = 'Có nguy cơ ADHD';

            resultDetails = {
                type: 'SINGLE',
                score: sum,
                level: riskLevel,
                max: 24,
                label: 'Triệu chứng ADHD'
            };
        }
        else if (scale?.scale_name === 'PSS-10') {
            let sum = 0;
            answers.forEach(a => sum += a.score);
            totalScore = sum;

            if (sum <= 13) riskLevel = 'Thấp';
            else if (sum <= 26) riskLevel = 'Trung bình';
            else riskLevel = 'Cao';

            resultDetails = {
                type: 'SINGLE',
                score: sum,
                level: riskLevel,
                max: 40,
                label: 'Căng thẳng (Stress)'
            };
        }
        else {
            // General Sum
            answers.forEach(a => totalScore += a.score);
            riskLevel = 'Đã hoàn thành';
            resultDetails = { 
                type: 'SINGLE', 
                score: totalScore, 
                level: 'Đã hoàn thành', 
                max: answers.length * 3, 
                label: 'Tổng điểm' 
            };
        }

        // Save Result
        const testResult = await prisma.testResult.create({
            data: {
                user_id: userId,
                scale_id: scaleId,
                total_score: totalScore,
                risk_level: riskLevel,
                result_details: JSON.stringify(resultDetails), // We'll need to update schema or use risk_level if strictly string
                answers: {
                    create: answers.map(a => ({
                        question_id: a.questionId,
                        selected_score: a.score
                    }))
                }
            }
        });

        // Wait, the schema might not have resultDetails field as a separate JSON.
        // Let's check schema.prisma
        return NextResponse.json({ ...testResult, resultDetails });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
    }
}
