'use client';

import Link from 'next/link';
import { Brain, User, Calendar, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setUser(data.user))
            .catch(() => setUser(null));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        window.location.href = '/';
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

                    <div className={styles.auth}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Chào, <strong style={{ color: 'white' }}>{user.name}</strong></span>
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
