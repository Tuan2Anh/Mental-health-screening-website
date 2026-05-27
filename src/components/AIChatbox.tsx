'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageCircle, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';

const PROJECT_KNOWLEDGE = [
    {
        title: 'Các bài test tâm lý',
        keywords: ['bài test', 'kiểm tra', 'trắc nghiệm', 'danh sách test', 'test tâm lý'],
        answer: 'PsychoHealth cung cấp 8 bộ trắc nghiệm chuẩn quốc tế:\n1. DASS-21 (Trầm cảm, lo âu, stress)\n2. PHQ-9 (Đánh giá trầm cảm)\n3. GAD-7 (Đánh giá lo âu lan tỏa)\n4. ISI (Đánh giá mức độ mất ngủ)\n5. ASRS (Tự đánh giá ADHD ở người lớn)\n6. PSS-10 (Đánh giá căng thẳng cảm nhận)\n7. SPIN (Đánh giá lo âu xã hội)\n8. EPDS (Sàng lọc trầm cảm sau sinh).\n\nBạn hãy vào mục "Sàng lọc tâm lý" để thực hiện ngay.',
        suggest: true
    },
    {
        title: 'Bài test DASS-21',
        keywords: ['dass-21', 'dass21', 'trầm cảm', 'lo âu', 'stress', 'căng thẳng'],
        answer: 'DASS-21 đánh giá 3 khía cạnh: Trầm cảm, Lo âu và Stress qua 21 câu hỏi.\nMức độ điểm (sau khi nhân hệ số 2):\n- Trầm cảm: Bình thường (0-9), Nhẹ (10-13), Vừa (14-20), Nặng (21-27), Rất nặng (>=28).\n- Lo âu: Bình thường (0-7), Nhẹ (8-9), Vừa (10-14), Nặng (15-19), Rất nặng (>=20).\n- Stress: Bình thường (0-14), Nhẹ (15-18), Vừa (19-25), Nặng (26-33), Rất nặng (>=34).\n\nLời khuyên: Nếu bạn cảm thấy căng thẳng kéo dài, hãy thử thực hiện tại mục "Sàng lọc tâm lý" để có kết quả tổng quan nhất.'
    },
    {
        title: 'Bài test PHQ-9',
        keywords: ['phq-9', 'phq9', 'trầm cảm', 'sàng lọc trầm cảm'],
        answer: 'PHQ-9 là bộ trắc nghiệm gồm 9 câu hỏi giúp đánh giá mức độ trầm cảm.\nMức độ điểm (Tối đa 27 điểm):\n- 0 - 4: Trầm cảm tối thiểu\n- 5 - 9: Trầm cảm nhẹ\n- 10 - 14: Trầm cảm trung bình\n- 15 - 19: Trầm cảm trung bình nặng\n- >=20: Trầm cảm nặng.'
    },
    {
        title: 'Bài test GAD-7',
        keywords: ['gad-7', 'gad7', 'lo âu', 'lo âu lan tỏa', 'rối loạn lo âu'],
        answer: 'GAD-7 gồm 7 câu hỏi đánh giá mức độ lo âu lan tỏa.\nMức độ điểm (Tối đa 21 điểm):\n- 0 - 4: Lo âu tối thiểu\n- 5 - 9: Lo âu nhẹ\n- 10 - 14: Lo âu trung bình\n- >=15: Lo âu nặng.'
    },
    {
        title: 'Bài test ISI',
        keywords: ['isi', 'mất ngủ', 'khó ngủ', 'giấc ngủ', 'chất lượng giấc ngủ'],
        answer: 'ISI (Insomnia Severity Index) gồm 7 câu hỏi đánh giá mức độ nghiêm trọng của chứng mất ngủ trong 2 tuần qua.\nMức độ điểm (Tối đa 28 điểm):\n- 0 - 7: Không mất ngủ lâm sàng\n- 8 - 14: Mất ngủ nhẹ (dưới lâm sàng)\n- 15 - 21: Mất ngủ trung bình (lâm sàng)\n- 22 - 28: Mất ngủ nặng (lâm sàng).'
    },
    {
        title: 'Bài test ASRS',
        keywords: ['asrs', 'adhd', 'tăng động', 'giảm chú ý', 'kém tập trung'],
        answer: 'ASRS gồm 6 câu hỏi sàng lọc nhanh chứng tăng động giảm chú ý (ADHD) ở người lớn.\nMức độ điểm (Tối đa 24 điểm):\n- <=13: Ít dấu hiệu ADHD\n- >=14: Có nguy cơ cao mắc ADHD.'
    },
    {
        title: 'Bài test PSS-10',
        keywords: ['pss-10', 'pss10', 'stress', 'căng thẳng cảm nhận', 'áp lực'],
        answer: 'PSS-10 gồm 10 câu hỏi đánh giá mức độ căng thẳng cảm nhận của bạn trong 1 tháng qua.\nMức độ điểm (Tối đa 40 điểm):\n- 0 - 13: Căng thẳng thấp\n- 14 - 26: Căng thẳng trung bình\n- 27 - 40: Căng thẳng cao.'
    },
    {
        title: 'Bài test SPIN',
        keywords: ['spin', 'lo âu xã hội', 'ngại giao tiếp', 'sợ đám đông', 'tránh né'],
        answer: 'SPIN (Social Phobia Inventory) gồm các câu hỏi tự đánh giá nhằm nhận biết mức độ lo âu xã hội, sự sợ hãi hoặc tránh né các tình huống giao tiếp thường ngày.'
    },
    {
        title: 'Bài test EPDS',
        keywords: ['epds', 'trầm cảm sau sinh', 'mẹ bỉm', 'sau sinh', 'mang thai'],
        answer: 'EPDS (Edinburgh Postnatal Depression Scale) gồm 10 câu hỏi tự khai báo giúp phát hiện sớm nguy cơ trầm cảm và lo âu ở phụ nữ trong giai đoạn mang thai và sau sinh.'
    },
    {
        title: 'Đặt lịch hẹn Bác sĩ',
        keywords: ['đặt lịch', 'hẹn', 'bác sĩ', 'tư vấn'],
        answer: 'Để đặt lịch: Chọn mục "Lịch hẹn" -> "Đặt lịch mới" hoặc vào trang cá nhân của Bác sĩ. Bạn có thể chọn tư vấn Online hoặc Offline.',
        suggest: true
    },
    {
        title: 'Lợi ích của Video Call',
        keywords: ['video call', 'facetime', 'gọi', 'biên bản'],
        answer: 'Cuộc gọi tại PsychoHealth tích hợp công nghệ Speech-to-Text, tự động biên soạn nội dung hội thoại thành văn bản giúp Bác sĩ và Bệnh nhân dễ dàng xem lại lộ trình tư vấn.',
        suggest: true
    },
    {
        title: 'Bảo mật thông tin',
        keywords: ['bảo mật', 'an toàn', 'bí mật'],
        answer: 'Tất cả dữ liệu từ bài trắc nghiệm đến nội dung cuộc gọi đều được mã hóa và bảo mật tuyệt đối, chỉ Bác sĩ điều trị và bạn mới có quyền tiếp cận.',
        suggest: true
    },
    {
        title: 'Về dự án PsychoHealth',
        keywords: ['dự án', 'hệ thống', 'thông tin dự án'],
        answer: 'PsychoHealth là nền tảng số hóa hỗ trợ chăm sóc sức khỏe tâm trí. Chúng tôi kết hợp các bài trắc nghiệm tâm lý khoa học với dịch vụ tư vấn chuyên nghiệp từ các bác sĩ đầu ngành.',
        suggest: true
    }
];

export default function AIChatbox() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Chào bạn! Tôi là Trợ lý AI chuyên biệt của dự án PsychoHealth. Tôi được huấn luyện chỉ để hỗ trợ các câu hỏi liên quan đến dự án và sức khỏe tâm trí tại đây.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleTopicClick = (item: any) => {
        const userMessage = { role: 'user', content: `Cho tôi biết về: ${item.title}` };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', content: item.answer }]);
            setIsTyping(false);
        }, 800);
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const query = input.toLowerCase();
            let aiAnswer = "Xin lỗi, câu hỏi của bạn nằm ngoài phạm vi hỗ trợ của tôi. Tôi chỉ có thể trả lời các vấn đề về dự án PsychoHealth, bài test tâm lý và cách vận hành của hệ thống này.";

            for (const item of PROJECT_KNOWLEDGE) {
                if (item.keywords.some(k => query.includes(k))) {
                    aiAnswer = item.answer;
                    break;
                }
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiAnswer }]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="hover-pop"
                    style={{
                        width: '64px', height: '64px', borderRadius: '1.25rem',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 12px 30px rgba(79, 70, 229, 0.4)', border: 'none', cursor: 'pointer'
                    }}
                >
                    <MessageCircle size={32} />
                </button>
            )}

            {isOpen && (
                <div style={{
                    width: '400px', height: '600px', 
                    background: '#ffffff', borderRadius: '2rem',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)',
                    animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {/* Header */}
                    <div style={{ 
                        padding: '1.5rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.6rem', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}>
                                <Bot size={28} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>PsychoHealth AI Hub</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></div>
                                    Hỗ trợ dự án chuyên sâu
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8fafc' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ 
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '1rem 1.25rem',
                                borderRadius: msg.role === 'user' ? '1.25rem 1.25rem 0 1.25rem' : '0 1.25rem 1.25rem 1.25rem',
                                background: msg.role === 'user' ? '#4f46e5' : '#ffffff',
                                color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                                boxShadow: msg.role === 'user' ? '0 8px 16px rgba(79, 70, 229, 0.25)' : '0 4px 12px rgba(0,0,0,0.03)',
                                fontSize: '0.925rem', lineHeight: '1.6',
                                border: msg.role === 'user' ? 'none' : '1px solid #f1f5f9'
                            }}>
                                {msg.content}
                            </div>
                        ))}

                        {/* Suggested Topics - Only show near the initial greeting/specific moments */}
                        {messages.length < 5 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginLeft: '4px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <HelpCircle size={14} /> CHỦ ĐỀ GỢI Ý
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                    {PROJECT_KNOWLEDGE.filter(item => item.suggest).map((item, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleTopicClick(item)}
                                            style={{
                                                padding: '0.6rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0',
                                                borderRadius: '2rem', fontSize: '0.85rem', color: '#4f46e5',
                                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                                                fontWeight: 500, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                            onMouseOver={(e: any) => { e.target.style.background = '#f0f0ff'; e.target.style.borderColor = '#4f46e5'; }}
                                            onMouseOut={(e: any) => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#e2e8f0'; }}
                                        >
                                            {item.title} <ChevronRight size={14} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', background: '#ffffff', padding: '1rem', borderRadius: '0 1.25rem 1.25rem 1.25rem', display: 'flex', gap: '5px', border: '1px solid #f1f5f9' }}>
                                <div className="dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                                <div className="dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1.5s infinite ease-in-out', animationDelay: '0.2s' }}></div>
                                <div className="dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1.5s infinite ease-in-out', animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '1.5rem', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Gõ câu hỏi về hệ thống..."
                                style={{
                                    flex: 1, padding: '1rem 1.25rem', borderRadius: '1.5rem',
                                    border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc',
                                    fontSize: '0.95rem', transition: 'border-color 0.2s'
                                }}
                            />
                            <button 
                                onClick={handleSend}
                                style={{
                                    width: '50px', height: '50px', borderRadius: '1.25rem',
                                    background: '#4f46e5', color: '#ffffff', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                }}
                                onMouseOver={(e: any) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e: any) => e.target.style.transform = 'scale(1)'}
                            >
                                <Send size={22} />
                            </button>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Sparkles size={12} /> Hỗ trợ kiến thức PsychoHealth nội bộ
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(30px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                .hover-pop:hover {
                    transform: scale(1.08) translateY(-4px);
                    box-shadow: 0 15px 35px rgba(79, 70, 229, 0.5);
                }
                .hover-pop { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}</style>
        </div>
    );
}
