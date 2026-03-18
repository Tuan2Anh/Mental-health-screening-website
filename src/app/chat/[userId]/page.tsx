'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User as UserIcon, ArrowLeft, Zap, ZapOff } from 'lucide-react';
import Link from 'next/link';
import type Peer from 'peerjs';

export default function ChatPage({ params }: { params: { userId: string } }) {
    const router = useRouter();
    const otherUserId = parseInt(params.userId);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [myUser, setMyUser] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isP2PConnected, setIsP2PConnected] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const lastMessageCountRef = useRef(0);

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<any>(null);

    useEffect(() => {
        // Fetch current user
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user) {
                    router.push('/login');
                } else {
                    setMyUser(data.user);
                    fetchMessages();
                }
            });

        return () => {
            if (peerRef.current) {
                console.log('[WebRTC] Component unmounting, destroying peer.');
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, [router]);

    // Initialize WebRTC Peer
    useEffect(() => {
        if (!myUser || typeof window === 'undefined') return;

        let isDestroyed = false;

        let isInitializing = false;
        const initPeer = async () => {
            if (isInitializing) return;
            isInitializing = true;

            const { Peer } = await import('peerjs');
            
            const myPeerId = `psycho-app-user-${myUser.userId}`;
            console.log(`[WebRTC] Init for User ${myUser.userId}, ID: ${myPeerId}`);

            if (peerRef.current && !peerRef.current.destroyed) {
                isInitializing = false;
                return;
            }

            const peer = new Peer(myPeerId, {
                debug: 1, 
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                    ]
                }
            });
            peerRef.current = peer;

            // Release ID on close
            const cleanup = () => { if (peerRef.current) peerRef.current.destroy(); };
            window.addEventListener('beforeunload', cleanup);

            peer.on('open', (id) => {
                isInitializing = false;
                if (isDestroyed) {
                    peer.destroy();
                    return;
                }
                console.log('[WebRTC] Signaling server opened. ID:', id);
                connectToPeer(otherUserId);
            });

            // Re-try logic
            const retryInterval = setInterval(() => {
                if (!isP2PConnected && !isDestroyed && peer.open) {
                    connectToPeer(otherUserId);
                }
            }, 3000);
            setTimeout(() => clearInterval(retryInterval), 30000);

            peer.on('connection', (conn) => {
                console.log('[WebRTC] Incoming connection from:', conn.peer);
                setupConnection(conn);
            });

            peer.on('disconnected', () => {
                console.log('[WebRTC] Disconnected.');
                setIsP2PConnected(false);
                if (!isDestroyed && peerRef.current && !peerRef.current.destroyed) {
                    peerRef.current.reconnect();
                }
            });

            peer.on('error', (err: any) => {
                console.error('[WebRTC] Error:', err.type, err);
                setIsP2PConnected(false);
                isInitializing = false;

                if (err.type === 'unavailable-id' && !isDestroyed) {
                    console.log('[WebRTC] ID taken, waiting for server to release...');
                    setTimeout(() => {
                        if (peerRef.current) {
                            peerRef.current.destroy();
                            peerRef.current = null;
                        }
                        if (!isDestroyed) initPeer();
                    }, 3000); // 3 seconds cooldown
                }
            });
        };

        initPeer();

        return () => {
            isDestroyed = true;
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, [myUser, otherUserId]);

    const connectToPeer = async (targetId: number) => {
        if (!peerRef.current || peerRef.current.destroyed || !peerRef.current.open) return;
        if (isP2PConnected || (connRef.current && connRef.current.open)) return;

        const targetPeerId = `psycho-app-user-${targetId}`;
        console.log('[WebRTC] Connecting to:', targetPeerId);
        
        try {
            const conn = peerRef.current.connect(targetPeerId);
            setupConnection(conn);
        } catch (err) {
            console.error('[WebRTC] Connect failed:', err);
        }
    };

    const setupConnection = (conn: any) => {
        if (connRef.current && connRef.current.open && connRef.current.peer === conn.peer) return;

        connRef.current = conn;
        
        conn.on('open', () => {
            console.log('[WebRTC] Connected established with:', conn.peer);
            setIsP2PConnected(true);
        });

        conn.on('data', (data: any) => {
            console.log('[WebRTC] Data:', data);
            if (data.type === 'chat') {
                setMessages(prev => {
                    if (prev.find(m => m.message_id === data.msg.message_id)) return prev;
                    return [...prev, data.msg];
                });
            }
        });

        conn.on('close', () => {
            console.log('[WebRTC] Connection closed.');
            setIsP2PConnected(false);
            connRef.current = null;
        });

        conn.on('error', (err: any) => {
            console.error('[WebRTC] Conn Error:', err);
            setIsP2PConnected(false);
            connRef.current = null;
        });
    };

    // Polling backup
    useEffect(() => {
        if (!myUser) return;
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [myUser, otherUserId]);

    // Auto-scroll logic (Internal scrolling only)
    useEffect(() => {
        if (messages.length > lastMessageCountRef.current && messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
        lastMessageCountRef.current = messages.length;
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages/${otherUserId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
                setOtherUser(data.otherUser);
                if (!isP2PConnected) connectToPeer(otherUserId);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage;
        const msgObj = {
            message_id: Date.now(),
            sender_id: myUser.userId,
            receiver_id: otherUserId,
            content: content,
            created_at: new Date().toISOString()
        };

        setNewMessage('');
        setMessages(prev => [...prev, msgObj]);

        if (connRef.current && isP2PConnected) {
            console.log('[WebRTC] Sending P2P...');
            connRef.current.send({ type: 'chat', msg: msgObj });
        }

        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: otherUserId,
                    content: content
                })
            });
        } catch (error) {
            console.error('Error sending', error);
        }
    };

    if (loading) return <div className="container py-12 text-center" style={{ color: 'var(--text-main)' }}>Đang tải tin nhắn...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                
                {/* Chat Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface)' }}>
                    <Link href="/appointments" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <div style={{ position: 'relative' }}>
                        <div style={{ background: 'var(--background)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border)' }}>
                            <UserIcon color="#818cf8" />
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 12,
                            height: 12,
                            background: isP2PConnected ? '#22c55e' : '#94a3b8',
                            borderRadius: '50%',
                            border: '2px solid var(--surface)'
                        }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '1.2rem', display: 'block', color: 'var(--text-main)' }}>{otherUser ? otherUser.full_name : `Hộp Thư #${otherUserId}`}</strong>
                        <span style={{ fontSize: '0.8rem', color: isP2PConnected ? '#22c55e' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {isP2PConnected ? (
                                <><Zap size={12} fill="#22c55e" /> Kết nối trực tiếp</>
                            ) : (
                                <><ZapOff size={12} /> Đang kết nối...</>
                            )}
                        </span>
                    </div>
                </div>

                {/* Chat Messages */}
                <div 
                    ref={messagesContainerRef}
                    style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--background)' }}
                >
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto' }}>
                            Chưa có tin nhắn. Hãy gửi lời chào!
                        </div>
                    ) : (
                        messages.map((msg: any) => {
                            const isMe = msg.sender_id === myUser.userId;
                            return (
                                <div key={msg.message_id} style={{
                                    display: 'flex',
                                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                                }}>
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '0.75rem 1.25rem',
                                        borderRadius: '1.5rem',
                                        background: isMe ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--surface)',
                                        border: isMe ? 'none' : '1px solid var(--border)',
                                        borderBottomRightRadius: isMe ? '0.25rem' : '1.5rem',
                                        borderBottomLeftRadius: isMe ? '1.5rem' : '0.25rem',
                                        boxShadow: isMe ? '0 4px 15px rgba(99, 102, 241, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                                    }}>
                                        <p style={{ margin: 0, lineHeight: 1.5, color: isMe ? 'white' : 'var(--text-main)' }}>{msg.content}</p>
                                        <span style={{ fontSize: '0.7rem', color: isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', display: 'block', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                                            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSend} style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', background: 'var(--surface)' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        style={{ flex: 1, padding: '1rem 1.5rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '2rem', color: 'var(--text-main)', outline: 'none' }}
                    />
                    <button type="submit" disabled={!newMessage.trim()} style={{
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        opacity: newMessage.trim() ? 1 : 0.5
                    }}>
                        <Send size={20} style={{ marginLeft: '-2px' }} />
                    </button>
                </form>

            </div>
        </div>
    );
}
