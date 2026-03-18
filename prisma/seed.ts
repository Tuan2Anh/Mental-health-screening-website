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

    // Clear existing questions for DASS-21
    await prisma.question.deleteMany({ where: { scale_id: dass21.scale_id } })

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

    // 2. PHQ-9 (Depression)
    const phq9 = await prisma.psychoScale.upsert({
        where: { scale_id: 2 },
        update: {},
        create: {
            scale_name: 'PHQ-9',
            description: 'Bảng câu hỏi sức khỏe bệnh nhân (9 câu hỏi). Đánh giá mức độ trầm cảm trong 2 tuần qua.',
        },
    })

    const phq9Questions = [
        "Ít khi thấy hứng thú hoặc vui vẻ trong các hoạt động",
        "Cảm thấy buồn chán, trầm cảm hoặc tuyệt vọng",
        "Khó ngủ, ngủ không sâu giấc hoặc ngủ quá nhiều",
        "Cảm thấy mệt mỏi hoặc thiếu năng lượng",
        "Ăn không ngon miệng hoặc ăn quá nhiều",
        "Cảm thấy tồi tệ về bản thân - hoặc thấy mình là người thất bại hoặc làm cho bản thân và gia đình thất vọng",
        "Khó tập trung vào công việc, chẳng hạn như khi đọc báo hoặc xem tivi",
        "Di chuyển hoặc nói năng chậm chạp đến mức người khác có thể nhận thấy. Hoặc ngược lại - bồn chồn hoặc không yên đến mức bạn phải di chuyển nhiều hơn bình thường",
        "Có ý nghĩ rằng bạn thà chết còn hơn hoặc ý nghĩ làm hại bản thân bằng cách nào đó"
    ]

    // Clear existing questions for PHQ-9
    await prisma.question.deleteMany({ where: { scale_id: phq9.scale_id } })

    for (const content of phq9Questions) {
        await prisma.question.create({
            data: {
                scale_id: phq9.scale_id,
                content: content,
                score_min: 0,
                score_max: 3,
            }
        })
    }

    // 3. GAD-7 (Anxiety)
    const gad7 = await prisma.psychoScale.upsert({
        where: { scale_id: 3 },
        update: {},
        create: {
            scale_name: 'GAD-7',
            description: 'Thang đo Lo âu Lan tỏa (7 câu hỏi). Đánh giá mức độ lo âu trong 2 tuần qua.',
        },
    })

    const gad7Questions = [
        "Cảm thấy lo lắng, căng thẳng hoặc bồn chồn",
        "Không thể ngăn việc lo lắng hoặc kiểm soát sự lo lắng",
        "Lo lắng quá mức về nhiều thứ khác nhau",
        "Khó thư giãn",
        "Bồn chồn đến mức khó có thể ngồi yên",
        "Dễ dàng trở nên bực bội hoặc cáu kỉnh",
        "Cảm thấy sợ hãi như thể có điều gì đó khủng khiếp sắp xảy ra"
    ]

    // Clear existing questions for GAD-7
    await prisma.question.deleteMany({ where: { scale_id: gad7.scale_id } })

    for (const content of gad7Questions) {
        await prisma.question.create({
            data: {
                scale_id: gad7.scale_id,
                content: content,
                score_min: 0,
                score_max: 3,
            }
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

    // 4. Create Expert User
    const expert = await prisma.user.upsert({
        where: { email: 'dr.minh@psychohealth.com' },
        update: {},
        create: {
            full_name: 'Bác sĩ Minh',
            email: 'dr.minh@psychohealth.com',
            password: '$2a$10$tZ2n4xUQUK1t3qE8qZ6I.OS/zTqH.g4U4M2r6Q7M5h.N8C2jCqC2q', // Hash of '123456' for testing
            role: 'expert',
            specialty: 'Tâm lý học lâm sàng',
            avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
        },
    })

    console.log({ admin, expert })
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
