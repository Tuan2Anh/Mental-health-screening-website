'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Brain, Heart, Star, Facebook, Twitter, Globe, Linkedin } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    const [experts, setExperts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Fetch current user
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setUser(data.user))
            .catch(() => setUser(null));

        // Fetch experts
        fetch('/api/experts')
            .then(res => res.json())
            .then(data => {
                setExperts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            {/* Mission & Intro Section */}
            <section style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <div style={{ marginBottom: '2rem', display: 'inline-block', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%' }}>
                    <Brain size={64} color="#818cf8" />
                </div>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Về PsychoHealth</h1>
                <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    PsychoHealth được sinh ra với sứ mệnh xóa tan những rào cản về tâm lý, mang đến sự thấu hiểu và giải pháp chữa lành cho mọi người. 
                    Chúng tôi tin rằng sức khỏe tâm thần cũng quan trọng như sức khỏe thể chất, và mỗi tâm hồn đều xứng đáng được lắng nghe một cách trân trọng nhất.
                </p>
            </section>

            {/* Core Values Section */}
            <section style={{ marginBottom: '5rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Giá Trị Của Chúng Chúng Tôi</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div className="card text-center hover-scale">
                        <Heart size={40} color="#ec4899" className="mb-4" style={{ margin: '0 auto 1.5rem' }} />
                        <h3>Sự Chân Thành</h3>
                        <p>Mỗi cuộc đối thoại, mỗi bài test đều dựa trên sự đồng cảm sâu sắc nhất từ trái tim.</p>
                    </div>
                    <div className="card text-center hover-scale">
                        <Shield size={40} color="#22c55e" className="mb-4" style={{ margin: '0 auto 1.5rem' }} />
                        <h3>Bảo Mật & Tin Cậy</h3>
                        <p>Chúng tôi cam kết bảo vệ thông tin cá nhân và kết quả tư vấn của bạn một cách tuyệt đối.</p>
                    </div>
                    <div className="card text-center hover-scale">
                        <Star size={40} color="#eab308" className="mb-4" style={{ margin: '0 auto 1.5rem' }} />
                        <h3>Chuyên Nghiệp</h3>
                        <p>Chúng tôi làm việc cùng đội ngũ chuyên gia hàng đầu để cung cấp dịch vụ tốt nhất.</p>
                    </div>
                </div>
            </section>

            {/* Meet Our Experts Section */}
            <section style={{ marginBottom: '8rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '2.5rem' }}>Đội Ngũ Chuyên Gia</h2>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div className="animate-pulse" style={{ fontSize: '1.2rem' }}>Đang kết nối đội ngũ...</div>
                    </div>
                ) : experts.length === 0 ? (
                    <div className="text-center card" style={{ padding: '4rem' }}>Hiện chưa có chuyên gia nào tham gia.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
                        {experts.map((expert) => (
                            <div key={expert.user_id} className="card hover-scale" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '350px', background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                    {expert.avatar ? (
                                        <img src={expert.avatar} alt={expert.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
                                            <UserIcon size={100} color="#818cf8" strokeWidth={1} />
                                        </div>
                                    )}
                                    <div style={{ 
                                        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
                                        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                                        padding: '0.6rem 1.2rem', borderRadius: '2rem',
                                        color: '#4f46e5', fontWeight: 600, fontSize: '0.85rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        {expert.specialty || 'Chuyên Gia Tâm Lý'}
                                    </div>
                                </div>
                                
                                <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>{expert.full_name}</h3>
                                    
                                    <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem', flex: 1 }}>
                                        Với kiến thức sâu rộng và sự tận tâm tuyệt đối, {expert.full_name} cam kết mang lại sự hỗ trợ tốt nhất cho mỗi câu chuyện của bạn.
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div className="hover-scale" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                                                <Facebook size={18} color="#64748b" />
                                            </div>
                                            <div className="hover-scale" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                                                <Linkedin size={18} color="#64748b" />
                                            </div>
                                        </div>
                                        <Link href="/appointments" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '2rem', fontSize: '0.9rem' }}>
                                            Đặt Lịch
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="py-16 text-center" style={{ borderTop: '1px solid var(--border)', background: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.05))', borderRadius: '2rem', marginTop: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Bắt Đầu Hành Trình Chữa Lành?</h2>
                <p style={{ maxWidth: '600px', margin: '0 auto 2.5rem', color: 'var(--text-muted)' }}>Tham gia cùng PsychoHealth ngay hôm nay để nhận được sự hỗ trợ chuyên nghiệp nhất.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/test-screening" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Làm Bài Test Tâm Lý</Link>
                    {!user && (
                        <Link href="/register" className="btn btn-outline" style={{ padding: '1rem 2rem' }}>Đăng Ký Tài Khoản</Link>
                    )}
                </div>
            </section>
        </div>
    );
}
