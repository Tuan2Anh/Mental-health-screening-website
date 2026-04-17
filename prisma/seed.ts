import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Đang xóa dữ liệu cũ ---')
    await prisma.message.deleteMany({})
    await prisma.appointment.deleteMany({})
    await prisma.notification.deleteMany({})
    await prisma.patientProfile.deleteMany({})
    await prisma.answer.deleteMany({})
    await prisma.testResult.deleteMany({})
    await prisma.question.deleteMany({})
    await prisma.psychoScale.deleteMany({})
    await prisma.user.deleteMany({})
    console.log('--- Đã dọn sạch Database ---')

    const hashedPassword = await bcrypt.hash('123456', 10)

    // 1. Create PsychoScale (DASS-21)
    const dass21 = await prisma.psychoScale.create({
        data: {
            scale_name: 'DASS-21',
            description: 'Thang đo Trầm cảm - Lo âu - Stress (21 câu hỏi). Mức độ: 0 (Không) đến 3 (Rất nhiều).',
        },
    })

    const dass21Questions = [
        'Tôi thấy khó mà thoải mái được', 'Tôi bị khô miệng', 'Tôi dường như chẳng có chút cảm xúc tích cực nào',
        'Tôi bị rối loạn nhịp thở', 'Tôi thấy khó bắt tay vào công việc', 'Tôi có xu hướng phản ứng thái quá',
        'Tôi bị ra mồ hôi', 'Tôi thấy mình đang suy nghĩ quá nhiều', 'Tôi lo lắng về những tình huống hoảng sợ',
        'Tôi thấy mình chẳng có gì để mong đợi', 'Tôi thấy bản thân dễ bị kích động', 'Tôi thấy khó thư giãn được',
        'Tôi cảm thấy chán nản, thất vọng', 'Tôi không chấp nhận được việc bị cản trở', 'Tôi thấy mình gần như hoảng loạn',
        'Tôi không thấy hăng hái với việc gì', 'Tôi cảm thấy mình chẳng đáng làm người', 'Tôi thấy mình khá dễ phật ý',
        'Tôi nghe thấy rõ tiếng nhịp tim', 'Tôi hay sợ vô cớ', 'Tôi thấy cuộc sống vô nghĩa'
    ]

    for (const q of dass21Questions) {
        await prisma.question.create({
            data: { scale_id: dass21.scale_id, content: q, score_min: 0, score_max: 3 }
        })
    }

    // 2. PHQ-9
    const phq9 = await prisma.psychoScale.create({
        data: {
            scale_name: 'PHQ-9',
            description: 'Bảng câu hỏi sức khỏe bệnh nhân (9 câu hỏi). Đánh giá mức độ trầm cảm.',
        },
    })
    const phq9Questions = [
        "Ít hứng thú hoặc vui vẻ", "Cảm thấy buồn chán", "Khó ngủ hoặc ngủ quá nhiều",
        "Cảm thấy mệt mỏi", "Ăn không ngon hoặc quá nhiều", "Cảm thấy tồi tệ về bản thân",
        "Khó tập trung", "Di chuyển chậm/Bồn chồn", "Ý nghĩ tự hại"
    ]
    for (const q of phq9Questions) {
        await prisma.question.create({ data: { scale_id: phq9.scale_id, content: q, score_min: 0, score_max: 3 } })
    }

    // 3. GAD-7
    const gad7 = await prisma.psychoScale.create({
        data: { scale_name: 'GAD-7', description: 'Thang đo Lo âu Lan tỏa (7 câu hỏi).' },
    })
    const gad7Questions = ["Lo lắng, căng thẳng", "Không thể ngừng lo", "Lo lắng quá mức", "Khó thư giãn", "Bồn chồn không yên", "Dễ bực bội", "Cảm thấy sợ hãi"]
    for (const q of gad7Questions) {
        await prisma.question.create({ data: { scale_id: gad7.scale_id, content: q, score_min: 0, score_max: 3 } })
    }

    // 4. ISI (Insomnia Severity Index)
    const isi = await prisma.psychoScale.create({
        data: {
            scale_name: 'ISI',
            description: 'Chỉ số mức độ nghiêm trọng của chứng mất ngủ (7 câu hỏi). Đánh giá chất lượng giấc ngủ của bạn.',
        },
    })
    const isiQuestions = [
        "Khó đi vào giấc ngủ", "Khó duy trì giấc ngủ", "Thức dậy quá sớm",
        "Mức độ hài lòng với giấc ngủ", "Giấc ngủ ảnh hưởng đến hoạt động ban ngày",
        "Người khác nhận thấy sự ảnh hưởng của giấc ngủ", "Mức độ lo lắng về giấc ngủ"
    ]
    for (const q of isiQuestions) {
        await prisma.question.create({ data: { scale_id: isi.scale_id, content: q, score_min: 0, score_max: 4 } })
    }

    // 5. ASRS (ADHD Self-Report Scale)
    const asrs = await prisma.psychoScale.create({
        data: {
            scale_name: 'ASRS',
            description: 'Thang đo tự đánh giá ADHD ở người lớn (6 câu hỏi sàng lọc nhanh).',
        },
    })
    const asrsQuestions = [
        "Khó khăn khi làm phần cuối của công việc", "Khó khăn khi phải sắp xếp các công việc",
        "Khó khăn khi phải nhớ các cuộc hẹn", "Trì hoãn khi phải làm việc đòi hỏi suy nghĩ",
        "Quơ tay múa chân khi phải ngồi lâu", "Cảm thấy bị thôi thúc phải làm điều gì đó"
    ]
    for (const q of asrsQuestions) {
        await prisma.question.create({ data: { scale_id: asrs.scale_id, content: q, score_min: 0, score_max: 4 } })
    }

    // 6. PSS-10 (Perceived Stress Scale)
    const pss10 = await prisma.psychoScale.create({
        data: {
            scale_name: 'PSS-10',
            description: 'Thang đo Căng thẳng Cảm nhận (10 câu hỏi). Đánh giá mức độ stress trong 1 tháng qua.',
        },
    })
    const pss10Questions = [
        "Buồn bã vì điều bất ngờ xảy ra", "Thấy không thể kiểm soát các vấn đề", "Cảm thấy lo lắng và căng thẳng",
        "Tự tin xử lý các vấn đề cá nhân", "Thấy mọi việc theo ý mình", "Không thể giải quyết các việc phải làm",
        "Có khả năng kiểm soát gánh nặng cuộc sống", "Thấy mình đang làm chủ mọi việc",
        "Tức giận vì những điều ngoài tầm kiểm soát", "Thấy khó khăn chất chồng không thể vượt qua"
    ]
    for (const q of pss10Questions) {
        await prisma.question.create({ data: { scale_id: pss10.scale_id, content: q, score_min: 0, score_max: 4 } })
    }

    // 7. SPIN (Social Phobia Inventory)
    const spin = await prisma.psychoScale.create({
        data: {
            scale_name: 'SPIN',
            description: 'Thang đo Lo âu Xã hội (17 câu hỏi rút gọn). Đánh giá sự e ngại trong giao tiếp.',
        },
    })
    const spinQuestions = [
        "Sợ những người có quyền quyết định", "Sợ bị đỏ mặt trước mặt người khác", "Sợ các bữa tiệc và sự kiện xã hội",
        "Sợ nói chuyện với người lạ", "Sợ bị người khác chỉ trích", "Tránh làm những việc khiến tôi thành trung tâm"
    ]
    for (const q of spinQuestions) {
        await prisma.question.create({ data: { scale_id: spin.scale_id, content: q, score_min: 0, score_max: 4 } })
    }

    // 8. EPDS (Edinburgh Postnatal Depression Scale)
    const epds = await prisma.psychoScale.create({
        data: {
            scale_name: 'EPDS',
            description: 'Thang đo Trầm cảm sau sinh dành cho phụ nữ giai đoạn làm mẹ.',
        },
    })
    const epdsQuestions = [
        "Có khả năng cười và thấy mặt hài hước của mọi việc", "Háo hức mong chờ hưởng thụ mọi việc",
        "Tự trách mình vô ích khi có chuyện không hay", "Lo lắng hay lo sợ vô cớ", "Thấy kinh hãi hay hoảng hốt vô cớ",
        "Mọi việc có vẻ quá sức của tôi", "Thấy bất hạnh đến nỗi khó ngủ được", "Thấy buồn nản hay khổ sở",
        "Thấy bất hạnh đến nỗi phát khóc", "Có ý nghĩ làm hại chính mình"
    ]
    for (const q of epdsQuestions) {
        await prisma.question.create({ data: { scale_id: epds.scale_id, content: q, score_min: 0, score_max: 3 } })
    }

    // 9. Create Expert Users (Verified + PW 123456)
    const experts = [
        {
            full_name: 'ThS.BS Nguyễn Văn Minh',
            email: 'dr.minh@psychohealth.com',
            specialty: 'Trị liệu Hành vi nhận thức (CBT)',
            avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop'
        },
        {
            full_name: 'TS.BS Trần Thị Lan',
            email: 'dr.lan@psychohealth.com',
            specialty: 'Tâm lý học Trẻ em & Vị thành niên',
            avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop'
        },
        {
            full_name: 'BS.CKII Lê Anh Tuấn',
            email: 'dr.tuan@psychohealth.com',
            specialty: 'Tham vấn Gia đình & Cặp đôi',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop'
        }
    ]

    for (const exp of experts) {
        await prisma.user.create({
            data: {
                ...exp,
                password: hashedPassword,
                role: 'expert',
                is_verified: true
            }
        })
    }

    // 10. Create Admin (Verified + PW 123456)
    await prisma.user.create({
        data: {
            full_name: 'Quản trị viên',
            email: 'admin@psychohealth.com',
            password: hashedPassword,
            role: 'admin',
            is_verified: true
        }
    })

    console.log('--- SEED DỮ LIỆU HOÀN TẤT ---')
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
