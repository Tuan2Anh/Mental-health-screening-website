'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [fieldErrors, setFieldErrors] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const errors = { full_name: '', email: '', password: '', confirmPassword: '' };
        let isValid = true;

        if (!formData.full_name.trim()) {
            errors.full_name = 'Vui lòng nhập họ và tên';
            isValid = false;
        }

        if (!formData.email) {
            errors.email = 'Vui lòng nhập email';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Định dạng email không hợp lệ';
            isValid = false;
        }

        if (!formData.password) {
            errors.password = 'Vui lòng nhập mật khẩu';
            isValid = false;
        } else if (formData.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');

            // Auto login or redirect to login
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
                <h2 className="text-center mb-6">Đăng Ký Tài Khoản</h2>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Họ và tên</label>
                        <div style={{ position: 'relative' }}>
                            <User className="text-gray-400" size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Nguyễn Văn A"
                                value={formData.full_name}
                                onChange={e => {
                                    setFormData({ ...formData, full_name: e.target.value });
                                    if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: '' });
                                }}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem 1rem 0.75rem 2.8rem', 
                                    background: 'rgba(248, 250, 254, 0.5)', 
                                    border: fieldErrors.full_name ? '1px solid #ef4444' : '1px solid var(--border)', 
                                    borderRadius: '0.5rem', 
                                    color: 'black' 
                                }}
                            />
                        </div>
                        {fieldErrors.full_name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.full_name}</p>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail className="text-gray-400" size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={e => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                                }}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem 1rem 0.75rem 2.8rem', 
                                    background: 'rgba(248, 250, 254, 0.5)', 
                                    border: fieldErrors.email ? '1px solid #ef4444' : '1px solid var(--border)', 
                                    borderRadius: '0.5rem', 
                                    color: 'black' 
                                }}
                            />
                        </div>
                        {fieldErrors.email && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.email}</p>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <Lock className="text-gray-400" size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => {
                                    setFormData({ ...formData, password: e.target.value });
                                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                                }}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem 1rem 0.75rem 2.8rem', 
                                    background: 'rgba(248, 250, 254, 0.5)', 
                                    border: fieldErrors.password ? '1px solid #ef4444' : '1px solid var(--border)', 
                                    borderRadius: '0.5rem', 
                                    color: 'black' 
                                }}
                            />
                        </div>
                        {fieldErrors.password && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.password}</p>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Xác nhận mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <Lock className="text-gray-400" size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={e => {
                                    setFormData({ ...formData, confirmPassword: e.target.value });
                                    if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                                }}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem 1rem 0.75rem 2.8rem', 
                                    background: 'rgba(248, 250, 254, 0.5)', 
                                    border: fieldErrors.confirmPassword ? '1px solid #ef4444' : '1px solid var(--border)', 
                                    borderRadius: '0.5rem', 
                                    color: 'black' 
                                }}
                            />
                        </div>
                        {fieldErrors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.confirmPassword}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng Ký Tài Khoản'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Đã có tài khoản? <Link href="/login" style={{ color: '#818cf8' }}>Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
}
