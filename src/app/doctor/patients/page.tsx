'use client';

import { useState, useEffect } from 'react';
import { User, Search, Filter, MessageSquare, Clipboard, MoreVertical, Edit2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Patient {
    user_id: number;
    full_name: string;
    email: string;
    avatar: string | null;
    age: number | null;
    gender: string | null;
    status: string;
    notes: string;
    profileId: number | null;
}

const STATUS_MAP: { [key: string]: { label: string, color: string, icon: any } } = {
    'Bình thường': { label: 'Bình thường', color: '#22c55e', icon: CheckCircle },
    'Trầm cảm': { label: 'Trầm cảm', color: '#ef4444', icon: AlertCircle },
    'Rối loạn lo âu': { label: 'Rối loạn lo âu', color: '#f59e0b', icon: Info },
    'Cần theo dõi thêm': { label: 'Cần theo dõi thêm', color: '#6366f1', icon: Clipboard }
};

export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleAnalyzeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAnalyzing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/doctor/classify-transcript', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setNewStatus(data.suggestion);
                toast.success(
                    `Phân tích xong! \nĐề xuất: ${data.suggestion} (${data.confidence})\nPhát hiện: ${data.stats.depression} Trầm cảm, ${data.stats.anxiety} Lo âu`,
                    { duration: 5000 }
                );
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi phân tích file');
        } finally {
            setAnalyzing(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch('/api/doctor/patients');
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPatient) return;
        setSaving(true);
        try {
            const res = await fetch('/api/doctor/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: editingPatient.user_id,
                    status: newStatus,
                    notes: newNotes
                })
            });
            if (res.ok) {
                fetchPatients();
                setEditingPatient(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#6366f1' }}>Đang tải danh sách bệnh nhân...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Quản lý bệnh nhân</h1>
                    <p style={{ color: '#64748b' }}>Theo dõi và phân loại lộ trình hồi phục của bệnh nhân.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Tìm bệnh nhân..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', 
                                outline: 'none', width: '250px', fontSize: '0.9rem' 
                            }} 
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        <option value="All">Tất cả trạng thái</option>
                        {Object.keys(STATUS_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '20px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Bệnh nhân</th>
                            <th style={{ padding: '20px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Thông tin</th>
                            <th style={{ padding: '20px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Trạng thái bệnh</th>
                            <th style={{ padding: '20px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Ghi chú chuyên môn</th>
                            <th style={{ padding: '20px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map((p) => {
                            const StatusIcon = STATUS_MAP[p.status]?.icon || Info;
                            return (
                                <tr key={p.user_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdff'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9' }}>
                                                {p.avatar ? <img src={p.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} style={{ margin: '10px', color: '#cbd5e1' }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.full_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                                            {p.age ? `${p.age} tuổi` : 'N/A'}, {p.gender || 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ 
                                            display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                            padding: '6px 12px', borderRadius: '20px', 
                                            background: `${STATUS_MAP[p.status]?.color}15`, 
                                            color: STATUS_MAP[p.status]?.color,
                                            fontSize: '0.85rem', fontWeight: 600
                                        }}>
                                            <StatusIcon size={14} />
                                            {p.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.notes || <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>Chưa có ghi chú...</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => {
                                                    setEditingPatient(p);
                                                    setNewStatus(p.status);
                                                    setNewNotes(p.notes);
                                                }}
                                                style={{ border: 'none', background: 'none', color: '#6366f1', cursor: 'pointer', padding: '5px' }} 
                                                title="Cập nhật trạng thái"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <Link href={`/chat/${p.user_id}`} style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                                <MessageSquare size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredPatients.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        Không tìm thấy bệnh nhân nào.
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingPatient && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Cập nhật tình trạng: {editingPatient.full_name}</h2>
                        <form onSubmit={handleUpdateStatus}>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#f1f5f9', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
                                    Tự động phân loại từ biên bản (.docx)
                                </label>
                                <input 
                                    type="file" 
                                    accept=".docx" 
                                    onChange={handleAnalyzeFile}
                                    style={{ fontSize: '0.8rem', width: '100%' }}
                                    disabled={analyzing}
                                />
                                {analyzing && <p style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '5px' }}>Đang phân tích từ khóa...</p>}
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>
                                    * Hệ thống sẽ quét các từ khóa lâm sàng trong file docx để đề xuất tình trạng bệnh.
                                </p>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Phân loại bệnh</label>
                                <select 
                                    className="input-field"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                >
                                    {Object.keys(STATUS_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Ghi chú chuyên môn</label>
                                <textarea 
                                    className="input-field"
                                    rows={4}
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                    placeholder="Ghi chú về triệu chứng, lộ trình..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                                <button type="button" onClick={() => setEditingPatient(null)} className="btn btn-outline" style={{ flex: 1 }}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
