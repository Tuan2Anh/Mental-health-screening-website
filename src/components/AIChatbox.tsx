'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageCircle, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';

const PROJECT_KNOWLEDGE = [
    {
        title: 'Các bài test tâm lý',
        keywords: ['bài test', 'kiểm tra', 'trắc nghiệm', 'danh sách test', 'test tâm lý'],
        answer: 'PsychoHealth cung cấp 6 bộ trắc nghiệm chuẩn quốc tế: \n1. DASS-21 (Trầm cảm, lo âu, stress)\n2. PHQ-9 (Chẩn đoán Trầm cảm)\n3. GAD-7 (Rối loạn lo âu lan tỏa)\n4. ISI (Mức độ mất ngủ)\n5. ASRS (Tăng động giảm chú ý ADHD)\n6. PSS-10 (Căng thẳng mãn tính). \nBạn hãy vào mục "Sàng lọc tâm lý" để thực hiện ngay.'
    },
    {
        title: 'Bài test DASS-21',
        keywords: ['dass-21', 'dass21', 'trầm cảm', 'lo âu', 'stress'],
        answer: 'DASS-21 đánh giá 3 khía cạnh: Trầm cảm, Lo âu và Stress. \nLời khuyên: Nếu bạn cảm thấy căng thẳng kéo dài, hãy thử thực hiện tại mục "Sàng lọc tâm lý" để có kết quả tổng quan nhất.'
    },
    {
        title: 'Đặt lịch hẹn Bác sĩ',
        keywords: ['đặt lịch', 'hẹn', 'bác sĩ', 'tư vấn'],
        answer: 'Để đặt lịch: Chọn mục "Lịch hẹn" -> "Đặt lịch mới" hoặc vào trang cá nhân của Bác sĩ. Bạn có thể chọn tư vấn Online hoặc Offline.'
    },
    {
        title: 'Lợi ích của Video Call',
        keywords: ['video call', 'facetime', 'gọi', 'biên bản'],
        answer: 'Cuộc gọi tại PsychoHealth tích hợp công nghệ Speech-to-Text, tự động biên soạn nội dung hội thoại thành văn bản giúp Bác sĩ và Bệnh nhân dễ dàng xem lại lộ trình tư vấn.'
    },
    {
        title: 'Bảo mật thông tin',
        keywords: ['bảo mật', 'an toàn', 'bí mật'],
        answer: 'Tất cả dữ liệu từ bài trắc nghiệm đến nội dung cuộc gọi đều được mã hóa và bảo mật tuyệt đối, chỉ Bác sĩ điều trị và bạn mới có quyền tiếp cận.'
    },
    {
        title: 'Về dự án PsychoHealth',
        keywords: ['dự án', 'hệ thống', 'thông tin dự án'],
        answer: 'PsychoHealth là nền tảng số hóa hỗ trợ chăm sóc sức khỏe tâm trí. Chúng tôi kết hợp các bài trắc nghiệm tâm lý khoa học với dịch vụ tư vấn chuyên nghiệp từ các bác sĩ đầu ngành.'
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
                                    {PROJECT_KNOWLEDGE.map((item, i) => (
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
