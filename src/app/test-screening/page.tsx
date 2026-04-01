'use client';

import { useState, useEffect } from 'react';
import { Brain, Check, ArrowRight, RefreshCcw, AlertTriangle, CheckCircle, Plus, Trash2, Save, X as CloseIcon } from 'lucide-react';
import styles from './Screening.module.css';
import toast from 'react-hot-toast';

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
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Create Scale States
    const [isAddingScale, setIsAddingScale] = useState(false);
    const [newScaleName, setNewScaleName] = useState('');
    const [newScaleDesc, setNewScaleDesc] = useState('');
    const [newQuestions, setNewQuestions] = useState<{ content: string; score_min: number; score_max: number }[]>([
        { content: '', score_min: 0, score_max: 3 }
    ]);

    useEffect(() => {
        fetch('/api/scales')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setScales(data);
                } else {
                    console.error('Dữ liệu scales không phải là mảng:', data);
                    setScales([]);
                }
            })
            .catch(err => {
                console.error(err);
                setScales([]);
            });

        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setCurrentUser(data.user))
            .catch(() => setCurrentUser(null));
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
            toast.error('Lỗi nộp bài, vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetTest = () => {
        setSelectedScale(null);
        setResult(null);
        setAnswers({});
        setIsAddingScale(false);
    };

    const handleAddQuestionField = () => {
        setNewQuestions([...newQuestions, { content: '', score_min: 0, score_max: 3 }]);
    };

    const handleRemoveQuestionField = (index: number) => {
        const updated = [...newQuestions];
        updated.splice(index, 1);
        setNewQuestions(updated);
    };

    const handleQuestionChange = (index: number, content: string) => {
        const updated = [...newQuestions];
        updated[index].content = content;
        setNewQuestions(updated);
    };

    const handleSaveScale = async () => {
        if (!newScaleName || newQuestions.some(q => !q.content)) {
            toast.error('Vui lòng điền đủ tên bộ sàng lọc và nội dung các câu hỏi.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/scales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scale_name: newScaleName,
                    description: newScaleDesc,
                    questions: newQuestions
                })
            });

            if (res.ok) {
                toast.success('Thêm bộ sàng lọc thành công');
                setIsAddingScale(false);
                setNewScaleName('');
                setNewScaleDesc('');
                setNewQuestions([{ content: '', score_min: 0, score_max: 3 }]);

                // Refresh scales list
                const scalesRes = await fetch('/api/scales');
                const scalesData = await scalesRes.json();
                setScales(scalesData);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Lỗi khi lưu');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi hệ thống, vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
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
                {(!selectedScale && !isAddingScale) && (
                    <>
                        <p className={styles.subtitle}>Chọn một bài test tiêu chuẩn dưới đây để bắt đầu đánh giá tình trạng sức khỏe tinh thần của bạn.</p>
                        {(currentUser?.role === 'expert' || currentUser?.role === 'admin') && (
                            <button
                                onClick={() => setIsAddingScale(true)}
                                className="btn btn-primary"
                                style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginInline: 'auto' }}
                            >
                                <Plus size={20} /> Thêm Bộ Sàng Lọc Mới
                            </button>
                        )}
                    </>
                )}
            </div>

            {isAddingScale ? (
                /* ADD NEW SCALE FORM */
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className={styles.questionCard} style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Thêm Bộ Sàng Lọc</h2>
                            <button onClick={() => setIsAddingScale(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <CloseIcon size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tên bộ sàng lọc</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: DASS-21, PHQ-9..."
                                    className="input-field"
                                    value={newScaleName}
                                    onChange={e => setNewScaleName(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(30, 41, 59, 0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Mô tả ngắn</label>
                                <textarea
                                    placeholder="Bộ câu hỏi đánh giá mức độ..."
                                    rows={3}
                                    value={newScaleDesc}
                                    onChange={e => setNewScaleDesc(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(30, 41, 59, 0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label style={{ marginBottom: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Danh sách câu hỏi ({newQuestions.length})
                                    <button
                                        onClick={handleAddQuestionField}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--surface)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        <Plus size={14} /> Thêm câu hỏi
                                    </button>
                                </label>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {newQuestions.map((q, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <span style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem', width: '2rem' }}>#{idx + 1}</span>
                                            <input
                                                type="text"
                                                placeholder="Nội dung câu hỏi..."
                                                value={q.content}
                                                onChange={e => handleQuestionChange(idx, e.target.value)}
                                                style={{ flex: 1, padding: '0.75rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                            />
                                            {newQuestions.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveQuestionField(idx)}
                                                    style={{ marginTop: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={handleSaveScale}
                                    disabled={submitting}
                                    className="btn btn-primary"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {submitting ? 'Đang lưu...' : <><Save size={20} /> Lưu Bộ Sàng Lọc</>}
                                </button>
                                <button
                                    onClick={() => setIsAddingScale(false)}
                                    className="btn btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : !selectedScale ? (
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
                                <button onClick={resetTest} style={{ background: 'none', border: 'none', color: '#f7f7f7ff', cursor: 'pointer' }}>&larr; Quay lại</button>
                                <span style={{ color: '#f7f7f7ff' }}>Hoàn thành {answeredCount}/{totalCount}</span>
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
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Kết Quả Đánh Giá {selectedScale?.scale_name}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Dưới đây là phân tích chi tiết sức khỏe tinh thần của bạn</p>

                        <div className={styles.resultGrid}>
                            {/* Details */}
                            {result.resultDetails?.type === 'DASS-21' ? (
                                <>
                                    <ResultBar label="Trầm cảm (D)" data={result.resultDetails.depression} color="#ef4444" max={42} />
                                    <ResultBar label="Lo âu (A)" data={result.resultDetails.anxiety} color="#f59e0b" max={42} />
                                    <ResultBar label="Stress (S)" data={result.resultDetails.stress} color="#6366f1" max={42} />
                                </>
                            ) : result.resultDetails?.type === 'SINGLE' ? (
                                <ResultBar
                                    label={result.resultDetails.label}
                                    data={{ score: result.resultDetails.score, level: result.resultDetails.level }}
                                    color="#6366f1"
                                    max={result.resultDetails.max}
                                />
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
