'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        age: '',
        address: ''
    });
    const [fieldErrors, setFieldErrors] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        age: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const setField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        const errors: any = {};
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

        if (!formData.gender) {
            errors.gender = 'Vui lòng chọn giới tính';
            isValid = false;
        }

        if (!formData.age) {
            errors.age = 'Vui lòng nhập tuổi';
            isValid = false;
        } else {
            const ageNum = parseInt(formData.age);
            if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
                errors.age = 'Tuổi phải từ 1 đến 120';
                isValid = false;
            }
        }

        if (!formData.address.trim()) {
            errors.address = 'Vui lòng nhập địa chỉ';
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
                    password: formData.password,
                    gender: formData.gender,
                    age: formData.age,
                    address: formData.address
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (hasError: boolean) => ({
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'rgba(248, 250, 254, 0.5)',
        border: hasError ? '1px solid #ef4444' : '1px solid var(--border)',
        borderRadius: '0.5rem',
        color: 'black',
        boxSizing: 'border-box' as const,
    });

    const inputWithIconStyle = (hasError: boolean) => ({
        ...inputStyle(hasError),
        paddingLeft: '2.8rem',
    });

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }}>
                <h2 className="text-center mb-6">Đăng Ký Tài Khoản</h2>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                    {/* Họ và tên */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Họ và tên</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" placeholder="Nguyễn Văn A" value={formData.full_name}
                                onChange={e => setField('full_name', e.target.value)}
                                style={inputWithIconStyle(!!fieldErrors.full_name)} />
                        </div>
                        {fieldErrors.full_name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.full_name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="email" placeholder="name@example.com" value={formData.email}
                                onChange={e => setField('email', e.target.value)}
                                style={inputWithIconStyle(!!fieldErrors.email)} />
                        </div>
                        {fieldErrors.email && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.email}</p>}
                    </div>

                    {/* Giới tính & Tuổi - hàng ngang */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Giới tính</label>
                            <select value={formData.gender} onChange={e => setField('gender', e.target.value)}
                                style={{ ...inputStyle(!!fieldErrors.gender), cursor: 'pointer' }}>
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                            {fieldErrors.gender && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.gender}</p>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tuổi</label>
                            <input type="number" placeholder="25" min={1} max={120} value={formData.age}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 120)) {
                                        setField('age', val);
                                    }
                                }}
                                style={inputStyle(!!fieldErrors.age)} />
                            {fieldErrors.age && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.age}</p>}
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Địa chỉ</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" placeholder="Số nhà, đường, phường/xã, tỉnh/thành" value={formData.address}
                                onChange={e => setField('address', e.target.value)}
                                style={inputWithIconStyle(!!fieldErrors.address)} />
                        </div>
                        {fieldErrors.address && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.address}</p>}
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="password" placeholder="••••••••" value={formData.password}
                                onChange={e => setField('password', e.target.value)}
                                style={inputWithIconStyle(!!fieldErrors.password)} />
                        </div>
                        {fieldErrors.password && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.password}</p>}
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Xác nhận mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="password" placeholder="••••••••" value={formData.confirmPassword}
                                onChange={e => setField('confirmPassword', e.target.value)}
                                style={inputWithIconStyle(!!fieldErrors.confirmPassword)} />
                        </div>
                        {fieldErrors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.confirmPassword}</p>}
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary"
                        style={{ marginTop: '0.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {loading ? 'Đang xử lý...' : <><ArrowRight size={18} /> Đăng Ký Tài Khoản</>}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Đã có tài khoản? <Link href="/login" style={{ color: '#818cf8' }}>Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
}
