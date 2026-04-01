'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, Video, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [experts, setExperts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Form states
    const [selectedExpert, setSelectedExpert] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('online');
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        // Fetch current user
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user) {
                    router.push('/login');
                } else {
                    setUser(data.user);
                    fetchAppointments();
                    if (data.user.role === 'user') {
                        fetchExperts();
                    }
                }
            });
    }, [router]);

    const fetchAppointments = async () => {
        try {
            const res = await fetch('/api/appointments');
            const data = await res.json();
            setAppointments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExperts = async () => {
        try {
            const res = await fetch('/api/experts');
            const data = await res.json();
            setExperts(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setBooking(true);
        try {
            const dateTime = new Date(`${date}T${time}`).toISOString();
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expertId: selectedExpert,
                    time: dateTime,
                    type: type
                })
            });
            if (res.ok) {
                toast.success('Đặt lịch thành công');
                fetchAppointments(); // Refresh list
                setSelectedExpert('');
                setDate('');
                setTime('');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Lỗi đặt lịch');
            }
        } catch (error) {
            toast.error('Lỗi hệ thống, vui lòng thử lại.');
        } finally {
            setBooking(false);
        }
    };

    const handleUpdateStatus = async (appointmentId: number, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchAppointments(); // Refresh list to see updated status
            } else {
                const data = await res.json();
                toast.error(data.error || 'Lỗi cập nhật');
            }
        } catch (error) {
            toast.error('Lỗi hệ thống, vui lòng thử lại.');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div className="container py-12 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Lịch Tư Vấn</h1>
                <p style={{ color: 'var(--text-muted)' }}>Quản lý và đặt lịch hẹn với các chuyên gia tâm lý hàng đầu.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* 1. BOOKING FORM (Only for normal users) */}
                {user?.role === 'user' && (
                    <div className="card" style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarIcon color="#818cf8" /> Đặt Lịch Mới
                        </h2>
                        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chọn chuyên gia</label>
                                <select
                                    required
                                    className="input-field"
                                    value={selectedExpert}
                                    onChange={e => setSelectedExpert(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(248, 250, 254, 0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'black' }}
                                >
                                    <option value="" disabled>-- Vui lòng chọn --</option>
                                    {experts.map(ex => (
                                        <option key={ex.user_id} value={ex.user_id}>{ex.full_name} {ex.specialty ? `- ${ex.specialty}` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Ngày</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(248, 250, 254, 0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'black', colorScheme: 'white' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Giờ</label>
                                    <input
                                        type="time"
                                        required
                                        className="input-field"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(248, 250, 254, 0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'black', colorScheme: 'white' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hình thức gặp</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="radio" name="type" value="online" checked={type === 'online'} onChange={() => setType('online')} />
                                        <Video size={18} /> Online
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="radio" name="type" value="offline" checked={type === 'offline'} onChange={() => setType('offline')} />
                                        <MapPin size={18} /> Tại phòng khám
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={booking} style={{ marginTop: '1rem' }}>
                                {booking ? 'Đang xử lý...' : 'Xác Nhận Đặt Lịch'}
                            </button>
                        </form>
                    </div>
                )}

                {/* 2. APPOINTMENTS LIST */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Danh Sách Lịch Hẹn</h2>
                    {appointments.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Bạn chưa có lịch hẹn nào.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {appointments.map((apt: any) => {
                                const partner = user?.role === 'expert' ? apt.user : apt.expert;
                                return (
                                    <div key={apt.appointment_id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '50%' }}>
                                                    <User color="#818cf8" />
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: '1.1rem', display: 'block' }}>{partner.full_name}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{partner.email}</span>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: apt.status === 'pending' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                                color: apt.status === 'pending' ? '#eab308' : '#22c55e'
                                            }}>
                                                {apt.status === 'pending' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                                                    <Clock size={16} /> {formatDate(apt.appointment_time)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                                    {apt.type === 'online' ? <Video size={16} /> : <MapPin size={16} />}
                                                    Hình thức: {apt.type === 'online' ? 'Online Video Call' : 'Tại phòng khám'}
                                                </div>
                                            </div>

                                            {/* Expert Actions & Chat */}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {user?.role === 'expert' && apt.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(apt.appointment_id, 'confirmed')}
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                        >
                                                            Xác nhận
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(apt.appointment_id, 'cancelled')}
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                <Link href={`/chat/${partner.user_id}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                                    <MessageCircle size={16} /> Chat ngay
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
