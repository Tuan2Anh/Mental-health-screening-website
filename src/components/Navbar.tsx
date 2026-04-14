'use client';

import Link from 'next/link';
import { Brain, User, Calendar, Menu, X, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<{ name: string, email: string, role?: string, full_name?: string, avatar?: string } | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const fetchUser = () => {
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => setUser(data.user || null))
                .catch(() => setUser(null));
        };
        fetchUser();
        // Set a listener or check periodically for profile updates
        const interval = setInterval(fetchUser, 30000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const fetchNotifs = () => {
            fetch('/api/notifications')
                .then(res => res.json())
                .then(data => {
                    if (data && Array.isArray(data.notifications)) {
                        setNotifications(data.notifications);
                        const unreadArr = data.notifications.filter((n: any) => !n.is_read).length;
                        setUnreadCount(unreadArr + (data.unreadMessagesCount || 0));
                    } else {
                        setNotifications([]);
                        setUnreadCount(data.unreadMessagesCount || 0);
                    }
                })
                .catch(err => console.error(err));
        };

        fetchNotifs();
        const interval = setInterval(fetchNotifs, 5000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        // Handle click outside dropdown
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        window.location.href = '/';
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch('/api/notifications/read', { method: 'POST' });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <nav className={styles.navbar}>
            <div className="container flex justify-between items-center">
                <Link href="/" className={styles.logo}>
                    <Brain className="w-8 h-8 text-indigo-400" size={32} color="#818cf8" />
                    <span>PsychoHealth</span>
                </Link>

                {/* Desktop Menu */}
                <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
                    <Link href="/test-screening" className={styles.link}>
                        Sàng Lọc
                    </Link>
                    <Link href="/appointments" className={styles.link}>
                        <Calendar size={18} />
                        Đặt Lịch
                    </Link>
                    {user?.role === 'expert' && (
                        <Link href="/doctor/patients" className={styles.link}>
                            <User size={18} />
                            Bệnh Nhân
                        </Link>
                    )}
                    <Link href="/about" className={styles.link}>
                        Tìm Hiểu Thêm
                    </Link>

                    <div className={styles.auth}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} ref={dropdownRef}>
                                {/* Notifications */}
                                <div style={{ position: 'relative' }}>
                                    <button 
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: 'var(--text-main)', padding: '0.5rem' }}
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span style={{ 
                                                position: 'absolute', top: 0, right: 0, 
                                                background: '#ef4444', color: 'white', 
                                                fontSize: '0.65rem', fontWeight: 'bold', 
                                                padding: '0.1rem 0.35rem', borderRadius: '1rem' 
                                            }}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Dropdown */}
                                    {showNotifications && (
                                        <div style={{
                                            position: 'absolute', top: '100%', right: '0',
                                            width: '320px', background: 'var(--surface)',
                                            border: '1px solid var(--border)', borderRadius: '0.5rem',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                            zIndex: 50, overflow: 'hidden', marginTop: '0.5rem'
                                        }}>
                                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Thông báo</h3>
                                                {unreadCount > 0 && (
                                                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                        Đánh dấu đã đọc
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {notifications.length === 0 ? (
                                                    <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Bạn không có thông báo nào</p>
                                                ) : (
                                                    notifications.map((notif: any) => (
                                                        <div key={notif.id} style={{ 
                                                            padding: '1rem', borderBottom: '1px solid var(--border)',
                                                            background: notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.05)'
                                                        }}>
                                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>{notif.content}</p>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    {isMounted ? new Date(notif.created_at).toLocaleString('vi-VN') : 'Đang tải...'}
                                                                </span>
                                                                {notif.link && (
                                                                    <Link href={notif.link} onClick={() => setShowNotifications(false)} style={{ fontSize: '0.8rem', color: '#818cf8' }}>
                                                                        Xem chi tiết
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Link href="/profile" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#f8fafc', border: '1.5px solid var(--border)', transition: 'all 0.2s ease' }}>
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={18} color="var(--text-muted)" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                    <span style={{ color: 'var(--text-muted)' }}>Chào, <Link href="/profile" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600 }}>{user.full_name || user.name}</Link></span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    Đăng Xuất
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    Đăng Nhập
                                </Link>
                                <Link href="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    Đăng Ký
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Toggle */}
                <button className={styles.toggle} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
}
