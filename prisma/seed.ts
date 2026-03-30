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

    // Clear existing answers and test results that reference THESE questions/scales
    await prisma.answer.deleteMany({ where: { question: { scale_id: dass21.scale_id } } })
    await prisma.testResult.deleteMany({ where: { scale_id: dass21.scale_id } })
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

    // Clear existing answers and test results that reference THESE questions/scales
    await prisma.answer.deleteMany({ where: { question: { scale_id: phq9.scale_id } } })
    await prisma.testResult.deleteMany({ where: { scale_id: phq9.scale_id } })
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

    // Clear existing answers and test results that reference THESE questions/scales
    await prisma.answer.deleteMany({ where: { question: { scale_id: gad7.scale_id } } })
    await prisma.testResult.deleteMany({ where: { scale_id: gad7.scale_id } })
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

    // 4. ISI (Insomnia Severity Index)
    const isi = await prisma.psychoScale.upsert({
        where: { scale_id: 4 },
        update: {},
        create: {
            scale_name: 'ISI',
            description: 'Chỉ số mức độ nghiêm trọng của chứng mất ngủ (7 câu hỏi). Đánh giá chất lượng giấc ngủ.',
        },
    })

    const isiQuestions = [
        "Mức độ khó đi vào giấc ngủ của bạn",
        "Mức độ ngủ không yên giấc, thường xuyên thức giấc",
        "Mức độ thức dậy quá sớm và không ngủ lại được",
        "Mức độ hài lòng với chu kỳ ngủ hiện tại của bạn",
        "Mức độ ảnh hưởng của giấc ngủ đến hoạt động ban ngày (tập trung, trí nhớ, tâm trạng)",
        "Mức độ người khác nhận thấy sự ảnh hưởng từ vấn đề giấc ngủ của bạn",
        "Mức độ lo lắng/muộn phiền về vấn đề giấc ngủ hiện tại"
    ]

    await prisma.answer.deleteMany({ where: { question: { scale_id: isi.scale_id } } })
    await prisma.testResult.deleteMany({ where: { scale_id: isi.scale_id } })
    await prisma.question.deleteMany({ where: { scale_id: isi.scale_id } })

    for (const content of isiQuestions) {
        await prisma.question.create({
            data: {
                scale_id: isi.scale_id,
                content: content,
                score_min: 0,
                score_max: 4,
            }
        })
    }

    // 5. ASRS (Adult ADHD Self-Report Scale)
    const asrs = await prisma.psychoScale.upsert({
        where: { scale_id: 5 },
        update: {},
        create: {
            scale_name: 'ASRS',
            description: 'Thang đo tự đánh giá ADHD ở người trưởng thành (6 câu hỏi ưu tiên).',
        },
    })

    const asrsQuestions = [
        "Khó khăn khi làm phần cuối của công việc một khi các phần nhàm chán đã xong",
        "Khó khăn khi phải sắp xếp các công việc cần tính tổ chức",
        "Khó khăn khi phải nhớ các cuộc hẹn hay công việc cần làm",
        "Trì hoãn hoặc tránh né công việc đòi hỏi sự suy nghĩ nhiều",
        "Quơ tay múa chân hoặc ngọ nguậy khi phải ngồi lâu",
        "Cảm thấy quá hăng hái và bị thôi thúc phải làm điều gì đó như có động cơ thúc đẩy"
    ]

    await prisma.answer.deleteMany({ where: { question: { scale_id: asrs.scale_id } } })
    await prisma.testResult.deleteMany({ where: { scale_id: asrs.scale_id } })
    await prisma.question.deleteMany({ where: { scale_id: asrs.scale_id } })

    for (const content of asrsQuestions) {
        await prisma.question.create({
            data: {
                scale_id: asrs.scale_id,
                content: content,
                score_min: 0,
                score_max: 4,
            }
        })
    }

    // 6. PSS-10 (Perceived Stress Scale)
    const pss10 = await prisma.psychoScale.upsert({
        where: { scale_id: 6 },
        update: {},
        create: {
            scale_name: 'PSS-10',
            description: 'Thang đo Căng thẳng Cảm nhận (10 câu hỏi). Đánh giá mức độ stress trong 1 tháng qua.',
        },
    })

    const pss10Questions = [
        "Cảm thấy buồn bã vì một điều gì đó xảy ra bất ngờ",
        "Cảm thấy không thể kiểm soát các vấn đề quan trọng trong cuộc sống",
        "Cảm thấy lo lắng và căng thẳng",
        "Cảm thấy tự tin về khả năng xử lý các vấn đề cá nhân",
        "Cảm thấy mọi việc đang đi theo ý mình",
        "Cảm thấy không thể giải quyết tất cả những việc phải làm",
        "Cảm thấy có khả năng kiểm soát gánh nặng trong cuộc sống",
        "Cảm thấy đang làm chủ mọi việc",
        "Cảm thấy tức giận vì những điều nằm ngoài tầm kiểm soát",
        "Cảm thấy khó khăn chất chồng đến mức không thể vượt qua"
    ]

    await prisma.answer.deleteMany({ where: { question: { scale_id: pss10.scale_id } } })
    await prisma.testResult.deleteMany({ where: { scale_id: pss10.scale_id } })
    await prisma.question.deleteMany({ where: { scale_id: pss10.scale_id } })

    for (const content of pss10Questions) {
        await prisma.question.create({
            data: {
                scale_id: pss10.scale_id,
                content: content,
                score_min: 0,
                score_max: 4,
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

    // 4. Create Expert Users
    const expert1 = await prisma.user.upsert({
        where: { email: 'dr.minh@psychohealth.com' },
        update: {},
        create: {
            full_name: 'ThS.BS Nguyễn Văn Minh',
            email: 'dr.minh@psychohealth.com',
            password: '$2a$10$tZ2n4xUQUK1t3qE8qZ6I.OS/zTqH.g4U4M2r6Q7M5h.N8C2jCqC2q', 
            role: 'expert',
            specialty: 'Trị liệu Hành vi nhận thức (CBT)',
            avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200'
        },
    })

    const expert2 = await prisma.user.upsert({
        where: { email: 'dr.lan@psychohealth.com' },
        update: {},
        create: {
            full_name: 'TS.BS Trần Thị Lan',
            email: 'dr.lan@psychohealth.com',
            password: '$2a$10$tZ2n4xUQUK1t3qE8qZ6I.OS/zTqH.g4U4M2r6Q7M5h.N8C2jCqC2q',
            role: 'expert',
            specialty: 'Tâm lý học Trẻ em & Vị thành niên',
            avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200'
        },
    })

    const expert3 = await prisma.user.upsert({
        where: { email: 'dr.tuan@psychohealth.com' },
        update: {},
        create: {
            full_name: 'BS.CKII Lê Anh Tuấn',
            email: 'dr.tuan@psychohealth.com',
            password: '$2a$10$tZ2n4xUQUK1t3qE8qZ6I.OS/zTqH.g4U4M2r6Q7M5h.N8C2jCqC2q',
            role: 'expert',
            specialty: 'Tham vấn Gia đình & Cặp đôi',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200'
        },
    })

    console.log({ admin, expert1, expert2, expert3 })
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
