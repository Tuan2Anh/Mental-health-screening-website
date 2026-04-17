'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Mail, Shield, Calendar, Edit2, Save, X, Camera, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    
    // Form states
    const [fullName, setFullName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [address, setAddress] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.user) {
                setUser(data.user);
                setFullName(data.user.full_name || '');
                setAvatar(data.user.avatar || '');
                setGender(data.user.gender || '');
                setAge(data.user.age?.toString() || '');
                setAddress(data.user.address || '');
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, avatar, gender, age, address })
            });
            if (res.ok) {
                setEditing(false);
                fetchUser(); // Refresh user data to update navbar etc.
                toast.success('Cập nhật thông tin thành công');
            } else {
                toast.error('Có lỗi xảy ra khi cập nhật.');
            }
        } catch (error) {
            toast.error('Lỗi hệ thống, vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Dung lượng ảnh không được vượt quá 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="container py-24 text-center">Đang tải thông tin...</div>;
    if (!user) return null;

    return (
        <div className="container" style={{ padding: '3rem 1rem' }}>
            <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* 1. Sidebar / Basic Info */}
                <div className="card w-full md:w-1/3 text-center" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', zIndex: 0 }}></div>
                    <div style={{ position: 'relative', zIndex: 1, paddingTop: '2.5rem' }}>
                        <div style={{ 
                            width: '120px', height: '120px', 
                            borderRadius: '50%', background: 'var(--surface)', 
                            border: '4px solid var(--surface)', 
                            margin: '0 auto 1.5rem', overflow: 'hidden',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ background: '#f8fafc', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserIcon size={64} color="#818cf8" />
                                </div>
                            )}
                        </div>
                        <h2 style={{ marginBottom: '0.25rem' }}>{user.full_name}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>{user.email}</p>
                        
                        {user.role === 'expert' && (
                            <div style={{ 
                                display: 'inline-block', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '2rem', 
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                            }}>
                                Chuyên Gia
                            </div>
                        )}

                        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                <Mail size={18} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
                            </div>
                            {user.role !== 'user' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                    <Shield size={18} /> <span>Quyền hạn: {user.role}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                <Calendar size={18} /> <span>Ngày tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Main Content / Settings */}
                <div className="w-full md:w-2/3">
                    <div className="card" style={{ padding: '2.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <div className="flex justify-between items-center mb-12">
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Thông Tin Tài Khoản</h3>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: 'fit-content' }}>
                                    <Edit2 size={16} /> Chỉnh sửa
                                </button>
                            ) : (
                                <button onClick={() => setEditing(false)} className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2', height: 'fit-content' }}>
                                    <X size={16} style={{ marginRight: '0.5rem' }} /> Hủy
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Họ và tên</label>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                value={fullName} 
                                                onChange={e => setFullName(e.target.value)} 
                                                className="input-field" 
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '1rem', 
                                                    paddingLeft: '3rem', 
                                                    borderRadius: '0.75rem', 
                                                    border: '1px solid #e2e8f0',
                                                    background: '#f8fafc',
                                                    fontSize: '1rem',
                                                    transition: 'all 0.3s'
                                                }} 
                                                placeholder="Nhập họ tên"
                                            />
                                            <UserIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Giới tính</label>
                                        <select 
                                            value={gender} 
                                            onChange={e => setGender(e.target.value)}
                                            style={{ 
                                                width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem'
                                            }}
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Tuổi</label>
                                        <input 
                                            type="number" 
                                            value={age} 
                                            min={1}
                                            max={120}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 120)) {
                                                    setAge(val);
                                                }
                                            }}
                                            placeholder="Nhập số tuổi"
                                            style={{ 
                                                width: '100%', padding: '1rem', borderRadius: '0.75rem', 
                                                border: '1px solid #e2e8f0', background: '#f8fafc', 
                                                fontSize: '1rem', boxSizing: 'border-box' as const
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Địa chỉ</label>
                                        <input 
                                            type="text" 
                                            value={address} 
                                            onChange={e => setAddress(e.target.value)}
                                            placeholder="Nhập địa chỉ của bạn"
                                            style={{ 
                                                width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Ảnh đại diện</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleFileChange} 
                                                    id="avatar-upload"
                                                    style={{ display: 'none' }}
                                                />
                                                <label 
                                                    htmlFor="avatar-upload"
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        gap: '0.75rem',
                                                        padding: '1rem', 
                                                        borderRadius: '0.75rem', 
                                                        border: '1px dashed #cbd5e1', 
                                                        background: '#f1f5f9',
                                                        cursor: 'pointer',
                                                        fontSize: '0.95rem',
                                                        color: '#475569',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Camera size={20} color="#6366f1" />
                                                    Tải ảnh lên
                                                </label>
                                            </div>
                                            {avatar && (
                                                <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                    <img src={avatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {user.role === 'expert' && (
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Chuyên khoa</label>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                value={user.specialty || ''} 
                                                disabled
                                                className="input-field" 
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '1rem', 
                                                    paddingLeft: '3rem', 
                                                    borderRadius: '0.75rem', 
                                                    border: '1px solid #e2e8f0', 
                                                    background: '#f1f5f9', 
                                                    cursor: 'not-allowed',
                                                    color: '#94a3b8' 
                                                }} 
                                            />
                                            <ClipboardList size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>* Vui lòng liên hệ quản trị viên để thay đổi thông tin chuyên môn.</span>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderRadius: '0.75rem', boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)' }}>
                                        {saving ? 'Đang lưu...' : <><Save size={20} /> Lưu Thay Đổi</>}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Họ và tên</span>
                                        <strong style={{ fontSize: '1.25rem', color: '#1e293b', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{user.full_name}</strong>
                                    </div>
                                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email liên hệ</span>
                                        <strong style={{ fontSize: '1.25rem', color: '#1e293b', display: 'block', wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{user.email}</strong>
                                    </div>
                                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Giới tính</span>
                                        <strong style={{ fontSize: '1.25rem', color: '#1e293b' }}>{user.gender || 'Chưa cập nhật'}</strong>
                                    </div>
                                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tuổi</span>
                                        <strong style={{ fontSize: '1.25rem', color: '#1e293b' }}>{user.age || 'Chưa cập nhật'}</strong>
                                    </div>
                                    <div className="md:col-span-2" style={{ padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Địa chỉ</span>
                                        <strong style={{ fontSize: '1.25rem', color: '#1e293b', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{user.address || 'Chưa cập nhật'}</strong>
                                    </div>
                                    {user.role === 'expert' && (
                                        <div className="md:col-span-2" style={{ padding: '2rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '1rem', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chuyên khoa</span>
                                            <strong style={{ fontSize: '1.25rem', color: '#1e293b', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{user.specialty || 'Chuyên Gia Tâm Lý'}</strong>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-8" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: '1.5rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Hoạt Động Của Bạn</h4>
                                    <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 2rem' }}>Theo dõi hành trình chăm sóc sức khỏe tâm trí của bạn tại đây.</p>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem' }}>
                                        <div className="text-center">
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1' }}>{user._count?.testResults || 0}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>Bài Test</div>
                                        </div>
                                        <div className="text-center">
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ec4899' }}>
                                                {user.role === 'expert' ? (user._count?.appointmentsAsExpert || 0) : (user._count?.appointmentsAsUser || 0)}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>Lịch Hẹn</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
