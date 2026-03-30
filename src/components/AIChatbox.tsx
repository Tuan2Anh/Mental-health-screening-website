'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageCircle, Sparkles } from 'lucide-react';

const PROJECT_KNOWLEDGE = [
    {
        keywords: ['dự án', 'psychohealth', 'là gì', 'giới thiệu'],
        answer: 'PsychoHealth là nền tảng số hóa hỗ trợ chăm sóc sức khỏe tâm trí. Chúng tôi kết hợp các bài trắc nghiệm tâm lý khoa học với dịch vụ tư vấn chuyên nghiệp từ các bác sĩ đầu ngành qua Video Call và Transcription sinh ra từ AI.'
    },
    {
        keywords: ['dass-21', 'dass21', 'trầm cảm', 'lo âu', 'stress', 'ba khía cạnh'],
        answer: 'DASS-21 là bài test phổ biến nhất tại PsychoHealth, dùng để đánh giá nhanh 3 khía cạnh: Trầm cảm, Lo âu và Stress.\nLời khuyên: Nếu bạn cảm thấy căng thẳng kéo dài, hãy thử làm bài test này để có cái nhìn tổng quan nhất.'
    },
    {
        keywords: ['phq-9', 'phq9', 'trầm cảm nặng', 'buồn chán', 'bi quan'],
        answer: 'PHQ-9 là bộ công cụ chuyên sâu về Trầm cảm (Depression). \nLời khuyên: Nếu bạn thường xuyên có ý nghĩ tiêu cực hoặc mất ngủ trầm trọng, hãy ưu tiên làm bài test này và chia sẻ với chuyên gia.'
    },
    {
        keywords: ['gad-7', 'gad7', 'lo âu lan tỏa', 'bồn chồn', 'hồi hộp'],
        answer: 'GAD-7 giúp nhận diện trạng thái Lo âu lan tỏa. \nLời khuyên: Phù hợp nếu bạn thường xuyên cảm thấy hồi hộp, lo lắng không lý do rõ ràng.'
    },
    {
        keywords: ['bài test', 'kiểm tra', 'tâm lý', 'khám', 'bệnh'],
        answer: 'Chúng tôi cung cấp 6 bộ trắc nghiệm chuẩn quốc tế: DASS-21, PHQ-9 (Trầm cảm), GAD-7 (Lo âu), ISI (Mất ngủ), ASRS (ADHD) và PSS-10 (Stress mãn tính). \nBạn có thể vào mục "Sàng lọc tâm lý" để thực hiện ngay.'
    },
    {
        keywords: ['pss-10', 'pss10', 'áp lực', 'gánh nặng', 'kiểm soát'],
        answer: 'PSS-10 đo lường mức độ Căng thẳng cảm nhận. Nó giúp bạn biết áp lực cuộc sống đang vượt quá khả năng chịu đựng của bạn đến đâu.\nLời khuyên: Tập viết nhật ký cảm xúc và học cách từ chối các gánh nặng không cần thiết để lấy lại quyền kiểm soát cuộc sống.'
    },
    {
        keywords: ['isi', 'mất ngủ', 'giấc ngủ', 'khó ngủ'],
        answer: 'ISI (Insomnia Severity Index) đánh giá mức độ mất ngủ của bạn.\nLời khuyên: Duy trì giờ ngủ cố định, hạn chế ánh sáng xanh từ điện thoại 1 tiếng trước khi ngủ và không uống cafe sau 2h chiều sẽ giúp cải thiện đáng kể giấc ngủ.'
    },
    {
        keywords: ['asrs', 'tập trung', 'adhd', 'quên', 'lơ đễnh'],
        answer: 'ASRS dùng để tầm soát rối loạn tăng động giảm chú ý (ADHD) ở người lớn. \nLời khuyên: Nếu bạn hay quên hoặc khó tập trung, hãy thử chia nhỏ công việc (Pomodoro) và sử dụng các ứng dụng nhắc lịch để hỗ trợ trí nhớ.'
    },
    {
        keywords: ['đặt lịch', 'hẹn', 'bác sĩ', 'tư vấn'],
        answer: 'Để đặt lịch, hãy chọn mục "Lịch hẹn" -> "Đặt lịch mới" hoặc vào trang cá nhân của Bác sĩ trong mục "Tìm hiểu thêm". Bạn có thể gọi trực tuyến (Online) hoặc hẹn gặp trực tiếp (Offline).'
    },
    {
        keywords: ['lời khuyên', 'sức khỏe', 'tâm trí', 'làm gì', 'tốt hơn'],
        answer: 'Dành ít nhất 15 phút mỗi ngày để thư giãn không thiết bị điện tử, ngủ đủ giấc (7-8 tiếng) và duy trì các mối quan hệ tích cực là chìa khóa cho sức khỏe tâm trí. Nếu bạn cảm thấy bế tắc, trợ lý AI và các bác sĩ tại đây luôn sẵn sàng lắng nghe bạn.'
    }
];

export default function AIChatbox() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Xin chào! Tôi là trợ lý AI của PsychoHealth. Tôi có thể giúp gì cho bạn về dự án này không?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI thinking
        setTimeout(() => {
            const query = input.toLowerCase();
            let aiAnswer = "Xin lỗi, tôi chưa rõ câu hỏi của bạn. Bạn có thể hỏi về dự án, cách đặt lịch, các bài test tâm lý hoặc tính năng Video Call nhé!";

            for (const item of PROJECT_KNOWLEDGE) {
                if (item.keywords.some(k => query.includes(k))) {
                    aiAnswer = item.answer;
                    break;
                }
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiAnswer }]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: 'inherit' }}>
            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="hover-scale"
                    style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', border: 'none', cursor: 'pointer'
                    }}
                >
                    <MessageCircle size={30} />
                </button>
            )}

            {/* Chatbox Window */}
            {isOpen && (
                <div style={{
                    width: '380px', height: '550px', 
                    background: 'white', borderRadius: '1.5rem',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid #f1f5f9',
                    animation: 'slideUp 0.3s ease'
                }}>
                    {/* Header */}
                    <div style={{ 
                        padding: '1.25rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%' }}>
                                <Bot size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Sapo AI Assistant</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Đang trực tuyến (PsychoHealth)</div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ 
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '0.75rem 1rem',
                                borderRadius: msg.role === 'user' ? '1rem 1rem 0 1rem' : '0 1rem 1rem 1rem',
                                background: msg.role === 'user' ? '#6366f1' : 'white',
                                color: msg.role === 'user' ? 'white' : '#334155',
                                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                                fontSize: '0.9rem', lineHeight: '1.5'
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.75rem 1rem', borderRadius: '0 1rem 1rem 1rem', display: 'flex', gap: '4px' }}>
                                <div className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                <div className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animationDelay: '0.2s' }}></div>
                                <div className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '1.25rem', background: 'white', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Hỏi tôi bất cứ điều gì..."
                                style={{
                                    flex: 1, padding: '0.75rem 1rem', borderRadius: '2rem',
                                    border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button 
                                onClick={handleSend}
                                style={{
                                    width: '42px', height: '42px', borderRadius: '50%',
                                    background: '#6366f1', color: 'white', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Sparkles size={10} /> Powered by PsychoHealth Team 
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .dot-blink {
                    animation: blink 1.4s infinite both;
                }
                @keyframes blink {
                    0% { opacity: 0.2; }
                    20% { opacity: 1; }
                    100% { opacity: 0.2; }
                }
            `}</style>
        </div>
    );
}
