'use client';

import { useState, useEffect } from 'react';
import { Brain, Check, ArrowRight, RefreshCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './Screening.module.css';

// ... interfaces ...
interface Scale {
    scale_id: number;
    scale_name: string;
    description: string;
    _count: { questions: number };
}

interface Question {
    question_id: number;
    content: string;
    score_min: number;
    score_max: number;
}

interface TestResult {
    result_id: number;
    total_score: number;
    risk_level: string;
    resultDetails?: any;
}

export default function ScreeningTestPage() {
    const [scales, setScales] = useState<Scale[]>([]);
    const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);

    useEffect(() => {
        fetch('/api/scales')
            .then(res => res.json())
            .then(data => setScales(data))
            .catch(err => console.error(err));
    }, []);

    const handleStartTest = async (scale: Scale) => {
        setLoading(true);
        setSelectedScale(scale);
        try {
            const res = await fetch(`/api/questions/${scale.scale_id}`);
            const data = await res.json();
            setQuestions(data.questions);
            setResult(null);
            setAnswers({});
            // Scroll to top
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: number, score: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: score }));
    };

    const handleSubmit = async () => {
        if (!selectedScale) return;
        setSubmitting(true);
        const payload = {
            scaleId: selectedScale.scale_id,
            answers: Object.entries(answers).map(([qId, score]) => ({
                questionId: parseInt(qId),
                score: score
            }))
        };
        try {
            const res = await fetch('/api/submit-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setResult(data);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
            alert('Lỗi nộp bài');
        } finally {
            setSubmitting(false);
        }
    };

    const resetTest = () => {
        setSelectedScale(null);
        setResult(null);
        setAnswers({});
    };

    // Progress Calculation
    const answeredCount = Object.keys(answers).length;
    const totalCount = questions.length;
    const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

    if (loading) return <div className="container py-12 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className={styles.screenContainer}>

            {/* Header Section */}
            <div className={styles.header}>
                <h1 className={styles.title}>Sàng Lọc Tâm Lý</h1>
                {!selectedScale && <p className={styles.subtitle}>Chọn một bài test tiêu chuẩn dưới đây để bắt đầu đánh giá tình trạng sức khỏe tinh thần của bạn.</p>}
            </div>

            {!selectedScale ? (
                /* SCALE SELECTION */
                <div className={styles.cardGrid}>
                    {scales.map(scale => (
                        <div key={scale.scale_id} className={styles.scaleCard} onClick={() => handleStartTest(scale)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                                    <Brain className="text-indigo-400" size={24} color="#818cf8" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{scale.scale_name}</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>{scale.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                                <span style={{ background: 'var(--surface)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                                    {scale._count?.questions || 0} câu hỏi
                                </span>
                                <span style={{ color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    Bắt đầu <ArrowRight size={16} />
                                </span>
                            </div>
                        </div>
                    ))}
                    {scales.length === 0 && <p className="text-center" style={{ gridColumn: '1/-1' }}>Chưa có bài test nào.</p>}
                </div>
            ) : !result ? (
                /* TEST INTERFACE */
                <div>
                    {/* Progress Bar Sticky */}
                    <div className={styles.progressContainer}>
                        <div className="container">
                            <div className={styles.progressText}>
                                <button onClick={resetTest} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>&larr; Quay lại</button>
                                <span>Hoàn thành {answeredCount}/{totalCount}</span>
                            </div>
                            <div className={styles.track}>
                                <div className={styles.bar} style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="container">
                        {questions.map((q, index) => (
                            <div key={q.question_id} className={styles.questionCard}>
                                <div className={styles.questionText}>
                                    <span className={styles.questionIndex}>#{index + 1}</span>
                                    {q.content}
                                </div>

                                <div className={styles.optionsGrid}>
                                    {[
                                        { val: 0, label: "Không hề" },
                                        { val: 1, label: "Thỉnh thoảng" },
                                        { val: 2, label: "Khá thường xuyên" },
                                        { val: 3, label: "Luôn luôn" }
                                    ].map((opt) => {
                                        const isActive = answers[q.question_id] === opt.val;
                                        return (
                                            <div
                                                key={opt.val}
                                                className={`${styles.optionBtn} ${isActive ? styles.optionBtnActive : ''}`}
                                                onClick={() => handleAnswer(q.question_id, opt.val)}
                                            >
                                                {isActive && <div className={styles.checkIcon}><Check size={14} strokeWidth={3} /></div>}
                                                <span className={styles.optionValue}>{opt.val}</span>
                                                <span className={styles.optionLabel}>{opt.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className={styles.actions}>
                            <button
                                className={styles.submitBtn}
                                disabled={answeredCount < totalCount || submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? 'Đang chấm điểm...' : 'Xem Kết Quả Chi Tiết'}
                            </button>
                        </div>
                        {answeredCount < totalCount && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
                                Hãy trả lời tất cả câu hỏi để xem kết quả.
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                /* RESULT INTERFACE */
                <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
                    <div className={styles.questionCard} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Kết Quả Đánh Giá DASS-21</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Dưới đây là phân tích chi tiết sức khỏe tinh thần của bạn</p>

                        <div className={styles.resultGrid}>
                            {/* Details */}
                            {result.resultDetails ? (
                                <>
                                    <ResultBar label="Trầm cảm (D)" data={result.resultDetails.depression} color="#ef4444" max={42} />
                                    <ResultBar label="Lo âu (A)" data={result.resultDetails.anxiety} color="#f59e0b" max={42} />
                                    <ResultBar label="Stress (S)" data={result.resultDetails.stress} color="#6366f1" max={42} />
                                </>
                            ) : (
                                <div style={{ background: 'var(--surface)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>{result.total_score}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Tổng điểm</div>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.5rem 1.5rem',
                                        borderRadius: '2rem',
                                        fontWeight: 700,
                                        background: result.risk_level === 'Bình thường' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: result.risk_level === 'Bình thường' ? '#22c55e' : '#ef4444'
                                    }}>
                                        Mức độ: {result.risk_level}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
                            <button
                                onClick={resetTest}
                                className="btn btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RefreshCcw size={18} /> Làm lại bài test
                            </button>
                            <button
                                onClick={() => window.location.href = '/appointments'}
                                className="btn btn-primary"
                            >
                                Đặt lịch tư vấn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResultBar({ label, data, color, max }: { label: string, data: { score: number, level: string }, color: string, max: number }) {
    const percentage = Math.min((data.score / max) * 100, 100);

    return (
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{label}</strong>
                <span style={{ color: color, fontWeight: 700 }}>{data.level} ({data.score})</span>
            </div>
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: color,
                    transition: 'width 1s ease-out'
                }}></div>
            </div>
        </div>
    );
}
