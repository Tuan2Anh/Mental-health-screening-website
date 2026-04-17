'use client';

import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterSuccess() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '20px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                textAlign: 'center',
                animation: 'slideUp 0.6s ease-out'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#e0e7ff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    color: '#6366f1'
                }}>
                    <Mail size={40} />
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: '#1e293b',
                    marginBottom: '16px',
                    letterSpacing: '-0.025em'
                }}>
                    Kiểm tra Email của bạn!
                </h1>

                <p style={{
                    color: '#64748b',
                    lineHeight: '1.6',
                    marginBottom: '32px',
                    fontSize: '1.1rem'
                }}>
                    Chúng tôi đã gửi một liên kết xác thực đến địa chỉ email bạn đã đăng ký. 
                    Vui lòng nhấn vào liên kết đó để kích hoạt tài khoản PsychoHealth.
                </p>

                <div style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '32px',
                    textAlign: 'left'
                }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} color="#22c55e" /> Bước tiếp theo:
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Mở hộp thư đến (hoặc hòm thư Spam)</li>
                        <li>Tìm email từ <b>PsychoHealth Support</b></li>
                        <li>Nhấn nút <b>Xác thực tài khoản</b></li>
                    </ul>
                </div>

                <Link href="/login" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '16px',
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                }} onMouseOver={(e: any) => e.target.style.background = '#4f46e5'} onMouseOut={(e: any) => e.target.style.background = '#6366f1'}>
                    Quay lại Trang Đăng nhập <ArrowRight size={18} />
                </Link>

                <p style={{ marginTop: '24px', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Không nhận được email? <span style={{ color: '#6366f1', cursor: 'pointer', fontWeight: '500' }}>Gửi lại yêu cầu</span>
                </p>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
