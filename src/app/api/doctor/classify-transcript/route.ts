import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

const DEPRESSION_KEYWORDS = [
    'trầm cảm', 'mất hứng thú', 'suy nghĩ tiêu cực', 'vô dụng', 'buồn bã', 
    'thu mình', 'muốn ở một mình', 'tự đánh giá thấp', 'vô dụng'
];

const ANXIETY_KEYWORDS = [
    'lo âu', 'stress', 'căng thẳng', 'lo lắng về tương lai', 
    'tim đập nhanh', 'khó thở', 'tay lạnh', 'áp lực'
];

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text using mammoth
        const { value: text } = await mammoth.extractRawText({ buffer });
        const lowerText = text.toLowerCase();

        let depressionCount = 0;
        let anxietyCount = 0;

        DEPRESSION_KEYWORDS.forEach(k => {
            if (lowerText.includes(k)) depressionCount++;
        });

        ANXIETY_KEYWORDS.forEach(k => {
            if (lowerText.includes(k)) anxietyCount++;
        });

        let suggestion = 'Bình thường';
        let confidence = 'Thấp';

        if (depressionCount > 0 && depressionCount >= anxietyCount) {
            suggestion = 'Trầm cảm';
            confidence = depressionCount > 3 ? 'Cao' : 'Trung bình';
        } else if (anxietyCount > 0) {
            suggestion = 'Rối loạn lo âu';
            confidence = anxietyCount > 3 ? 'Cao' : 'Trung bình';
        }

        // Check if both are high
        if (depressionCount > 2 && anxietyCount > 2) {
            suggestion = 'Cần theo dõi thêm'; // Mixed symptoms
        }

        return NextResponse.json({
            suggestion,
            confidence,
            stats: {
                depression: depressionCount,
                anxiety: anxietyCount
            },
            snippet: text.substring(0, 500) + '...'
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
    }
}
