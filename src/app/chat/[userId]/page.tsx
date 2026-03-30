'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User as UserIcon, ArrowLeft, Zap, ZapOff, Video, VideoOff, PhoneOff, Mic, MicOff, Maximize2, Minimize2, FileText, Download } from 'lucide-react';
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
    const [isCalling, setIsCalling] = useState(false);
    const [callIncoming, setCallIncoming] = useState<any>(null);
    const [activeCall, setActiveCall] = useState<any>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [transcript, setTranscript] = useState<string>('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const currentStreamRef = useRef<MediaStream | null>(null);

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
                debug: 0, 
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
                if (err.type === 'peer-unavailable') {
                    console.warn('[WebRTC] Peer is currently offline:', otherUserId);
                } else {
                    console.error('[WebRTC] Error:', err.type, err);
                }
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

            // Handle incoming calls
            peer.on('call', (call) => {
                console.log('[WebRTC] Incoming call from:', call.peer);
                setCallIncoming(call);
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
        // Only log connection attempts if not already successfully connected
        if (!isP2PConnected) {
            console.log('[WebRTC] Attempting P2P connection to:', targetPeerId);
        }
        
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
            } else if (data.type === 'transcript') {
                // Doctor receives transcripts from anyone, User might also receive for later
                setTranscript(prev => prev + data.text);
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

    // Video Call Functions
    const startCall = async () => {
        if (!peerRef.current || !otherUser) return;
        
        try {
            console.log('[WebRTC] Starting call...');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            currentStreamRef.current = stream;
            setLocalStream(stream);
            setIsCalling(true);
            
            const targetPeerId = `psycho-app-user-${otherUserId}`;
            const call = peerRef.current.call(targetPeerId, stream);
            console.log('[WebRTC] Calling target:', targetPeerId);
            
            setupCall(call);
        } catch (err) {
            console.error('[WebRTC] Failed to get local stream', err);
            alert('Không thể truy cập camera/micro. Vui lòng kiểm tra quyền thiết bị.');
        }
    };

    const answerCall = async () => {
        if (!callIncoming) return;
        
        try {
            console.log('[WebRTC] Answering call from:', callIncoming.peer);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            currentStreamRef.current = stream;
            setLocalStream(stream);
            callIncoming.answer(stream);
            setupCall(callIncoming);
            setCallIncoming(null);
            setIsCalling(true);
        } catch (err) {
            console.error('[WebRTC] Failed to answer call', err);
            alert('Không thể truy cập camera/micro. Vui lòng kiểm tra quyền thiết bị.');
        }
    };

    const setupCall = (call: any) => {
        setActiveCall(call);
        
        call.on('stream', (remoteStream: MediaStream) => {
            console.log('[WebRTC] Received remote stream');
            setRemoteStream(remoteStream);
        });
        
        call.on('close', () => {
            endCall();
        });
        
        call.on('error', (err: any) => {
            console.error('[WebRTC] Call Error:', err);
            endCall();
        });
    };

    const endCall = () => {
        console.log('[WebRTC] Ending call.');
        // Automatically download transcript for doctor before closing if exists
        if (myUser?.role === 'expert' && transcript) {
            downloadTranscript();
        }

        if (activeCall) {
            activeCall.close();
            setActiveCall(null);
        }
        if (currentStreamRef.current) {
            currentStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log(`[WebRTC] Track stopped: ${track.kind}`);
            });
            currentStreamRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsCalling(false);
        setCallIncoming(null);
        setIsMuted(false);
        setIsVideoOff(false);
        stopTranscription();
    };

    const toggleMute = () => {
        const stream = currentStreamRef.current;
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                console.log('[WebRTC] Audio enabled:', audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        const stream = currentStreamRef.current;
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                console.log('[WebRTC] Video enabled:', videoTrack.enabled);
            }
        }
    };

    // Speech to Text (Transcribing)
    const startTranscription = () => {
        if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
            console.log('STT not supported');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsTranscribing(true);
            console.log('Transcription started');
        };

        recognition.onresult = (event: any) => {
            // Only process if mic is NOT muted
            if (currentStreamRef.current && !currentStreamRef.current.getAudioTracks()[0]?.enabled) {
                return;
            }

            let finalChunk = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalChunk += event.results[i][0].transcript + ' ';
                }
            }
            if (finalChunk && finalChunk.trim().length > 0) {
                // If I'm the doctor, show my own transcript too
                if (myUser?.role === 'expert') {
                    setTranscript(prev => prev + `(Bác sĩ): ${finalChunk}\n`);
                } else {
                    // If I'm a patient, send my transcript to the doctor
                    if (connRef.current && isP2PConnected) {
                        connRef.current.send({ type: 'transcript', text: `(Bệnh nhân): ${finalChunk}\n` });
                    }
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error('STT Error', event.error);
        };

        recognition.onend = () => {
            if (isTranscribing && isCalling) {
                recognition.start(); // Keep it running
            } else {
                setIsTranscribing(false);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopTranscription = () => {
        setIsTranscribing(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    const downloadTranscript = () => {
        if (!transcript) return;

        const header = `BIÊN BẢN TƯ VẤN TÂM LÝ\n` +
                      `========================\n` +
                      `Bác sĩ: ${myUser?.full_name}\n` +
                      `Bệnh nhân: ${otherUser?.full_name || 'N/A'}\n` +
                      `Ngày thực hiện: ${new Date().toLocaleString('vi-VN')}\n` +
                      `------------------------\n\n` +
                      `NỘI DUNG ĐÀM THOẠI:\n\n`;
        
        const fullContent = header + transcript;
        const blob = new Blob([fullContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BienBan_TuVan_${otherUser?.full_name?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (isCalling) {
            startTranscription();
        }
        return () => stopTranscription();
    }, [isCalling]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

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
                    {isP2PConnected && !isCalling && (
                        <button 
                            onClick={startCall}
                            style={{ 
                                background: 'rgba(99, 102, 241, 0.1)', 
                                border: 'none', 
                                borderRadius: '0.5rem', 
                                padding: '0.75rem', 
                                color: 'var(--primary-color)', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Video size={20} />
                            <span style={{ fontWeight: 600 }}>Facetime</span>
                        </button>
                    )}
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

            {/* Incoming Call Notification */}
            {callIncoming && (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '2rem',
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    border: '1px solid var(--primary-color)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '50%' }}>
                            <UserIcon color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>Cuộc gọi đến từ</div>
                            <div style={{ color: 'var(--text-muted)' }}>{otherUser?.full_name || 'Người dùng'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={answerCall} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Trả lời</button>
                        <button onClick={() => setCallIncoming(null)} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', color: 'var(--error)' }}>Từ chối</button>
                    </div>
                </div>
            )}

            {/* Video Call Overlay */}
            {isCalling && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.95)',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: myUser?.role === 'expert' ? 'row' : 'column', height: '100%' }}>
                        {/* Remote Video (Large Area) */}
                        <div style={{ 
                            flex: myUser?.role === 'expert' ? 3 : 1, 
                            position: 'relative', 
                            background: '#000', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: 0
                        }}>
                            <video 
                                ref={remoteVideoRef} 
                                autoPlay 
                                playsInline 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            {!remoteStream && (
                                <div style={{ position: 'absolute', color: 'white', textAlign: 'center' }}>
                                    <div className="animate-pulse" style={{ fontSize: '1.2rem' }}>Đang kết nối hình ảnh...</div>
                                </div>
                            )}
                            
                            {/* Local Video (Floating Overlay) */}
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                width: 'min(160px, 30%)',
                                aspectRatio: '4/3',
                                background: '#222',
                                borderRadius: '0.5rem',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.3)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                                zIndex: 10
                            }}>
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                                />
                            </div>

                            {/* Call Controls Bar */}
                            <div style={{
                                position: 'absolute',
                                bottom: '1.5rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '1rem',
                                padding: '0.8rem 1.5rem',
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(15px)',
                                borderRadius: '3rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                zIndex: 20,
                                flexWrap: 'nowrap'
                            }}>
                                <button onClick={toggleMute} style={{ background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <button onClick={toggleVideo} style={{ background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                                <button onClick={endCall} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '45px', height: '45px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PhoneOff size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Transcript Panel (Expert Only) */}
                        {myUser?.role === 'expert' && (
                            <div style={{ 
                                flex: 1, 
                                background: 'white', 
                                display: 'flex', 
                                flexDirection: 'column',
                                borderLeft: '1px solid var(--border)',
                                minWidth: '300px'
                            }}>
                                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={20} color="var(--primary-color)" />
                                        <strong style={{ fontSize: '1.1rem' }}>Văn bản đàm thoại (AI)</strong>
                                    </div>
                                    <button 
                                        onClick={downloadTranscript}
                                        disabled={!transcript}
                                        style={{ 
                                            background: 'var(--primary-color)', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '0.4rem 0.8rem', 
                                            borderRadius: '0.5rem', 
                                            fontSize: '0.8rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.4rem', 
                                            cursor: transcript ? 'pointer' : 'not-allowed',
                                            opacity: transcript ? 1 : 0.6
                                        }}
                                    >
                                        <Download size={14} /> Xuất file .doc
                                    </button>
                                </div>
                                <div 
                                    ref={transcriptRef}
                                    style={{ 
                                        flex: 1, 
                                        padding: '1.5rem', 
                                        overflowY: 'auto', 
                                        background: '#f8fafc',
                                        fontSize: '1rem',
                                        lineHeight: '1.6',
                                        color: 'var(--text-main)',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    {transcript || (
                                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                                            {isTranscribing ? 'Đang lắng nghe và chuyển đổi văn bản...' : 'Chưa có nội dung đàm thoại.'}
                                            <div style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#94a3b8' }}>* Lưu ý: Nếu test trên cùng 1 thiết bị, micro sẽ thu âm từ cả 2 tab.</div>
                                        </div>
                                    )}
                                    {transcript}
                                </div>
                                <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                                        Hệ thống đang hoạt động
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.7; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.7; }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
