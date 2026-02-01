import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Create PsychoScale (DASS-21)
    const dass21 = await prisma.psychoScale.upsert({
        where: { scale_id: 1 }, // Assuming ID 1 for simplicity in seed, or we can find by name
        update: {},
        create: {
            scale_name: 'DASS-21',
            description: 'Thang đo Trầm cảm - Lo âu - Stress (21 câu hỏi). Mức độ: 0 (Không) đến 3 (Rất nhiều).',
        },
    })

    console.log({ dass21 })

    // 2. Create Questions for DASS-21
    // Sample questions (Full DASS-21 has 21 questions, adding a few representative ones)
    const questionsData = [
        { content: 'Tôi thấy khó mà thoải mái được', score_min: 0, score_max: 3 },
        { content: 'Tôi bị khô miệng', score_min: 0, score_max: 3 },
        { content: 'Tôi dường như chẳng có chút cảm xúc tích cực nào', score_min: 0, score_max: 3 },
        { content: 'Tôi bị rối loạn nhịp thở (thở gấp, khó thở dù chẳng làm việc gì nặng)', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy khó bắt tay vào công việc', score_min: 0, score_max: 3 },
        { content: 'Tôi có xu hướng phản ứng thái quá với mọi tình huống', score_min: 0, score_max: 3 },
        { content: 'Tôi bị ra mồ hôi (chẳng hạn như mồ hôi tay…)', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy mình đang suy nghĩ quá nhiều', score_min: 0, score_max: 3 },
        { content: 'Tôi lo lắng về những tình huống có thể làm tôi hoảng sợ hoặc biến tôi thành trò cười', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy mình chẳng có gì để mong đợi cả', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy bản thân dễ bị kích động', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy khó thư giãn được', score_min: 0, score_max: 3 },
        { content: 'Tôi cảm thấy chán nản, thất vọng', score_min: 0, score_max: 3 },
        { content: 'Tôi không chấp nhận được việc có cái gì đó xen vào cản trở việc tôi đang làm', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy mình gần như hoảng loạn', score_min: 0, score_max: 3 },
        { content: 'Tôi không thấy hăng hái với bất kỳ việc gì nữa', score_min: 0, score_max: 3 },
        { content: 'Tôi cảm thấy mình chẳng đáng làm người', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy mình khá dễ phật ý, tự ái', score_min: 0, score_max: 3 },
        { content: 'Tôi nghe thấy rõ tiếng nhịp tim dù chẳng làm việc gì cả (ví dụ, tiếng nhịp tim tăng, tiếng tim loạn nhịp)', score_min: 0, score_max: 3 },
        { content: 'Tôi hay sợ vô cớ', score_min: 0, score_max: 3 },
        { content: 'Tôi thấy cuộc sống vô nghĩa', score_min: 0, score_max: 3 },
    ]

    for (const q of questionsData) {
        await prisma.question.create({
            data: {
                scale_id: dass21.scale_id,
                content: q.content,
                score_min: q.score_min,
                score_max: q.score_max,
            },
        })
    }

    // 3. Create Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@psychohealth.com' },
        update: {},
        create: {
            full_name: 'Administrator',
            email: 'admin@psychohealth.com',
            password: 'hashed_password_here', // In real app, hash this
            role: 'admin',
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
