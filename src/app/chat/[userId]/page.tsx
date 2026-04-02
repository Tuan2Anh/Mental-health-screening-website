'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User as UserIcon, ArrowLeft, Video, VideoOff, PhoneOff, Mic, MicOff, FileText, Download, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type Peer from 'peerjs';
import toast from 'react-hot-toast';
import PusherJS from 'pusher-js';

export default function ChatPage({ params }: { params: { userId: string } }) {
    const router = useRouter();
    const otherUserId = parseInt(params.userId);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [myUser, setMyUser] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Video call state
    const peerRef = useRef<Peer | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [showCallOverlay, setShowCallOverlay] = useState(false); // Thêm state quản lý overlay riêng biệt
    const [callIncoming, setCallIncoming] = useState<any>(null);
    const [activeCall, setActiveCall] = useState<any>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [transcript, setTranscript] = useState<string>('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const tempTranscriptRef = useRef<string>('');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const myUserRef = useRef<any>(null);
    const isCallingRef = useRef(false);
    const recognitionRef = useRef<any>(null);
    const restartTimerRef = useRef<any>(null);
    const lastInterimRef = useRef('');
    const lastCommitTimeRef = useRef<number>(0);
    const lastCommitRoleRef = useRef<string>('');
    const myPeerIdRef = useRef<string>('');
    const [otherPeerId, setOtherPeerId] = useState<string | null>(null);
    const callIncomingRef = useRef<any>(null);
    const isWaitingForPeerToAnswerRef = useRef(false);

    useEffect(() => { myUserRef.current = myUser; }, [myUser]);
    useEffect(() => { isCallingRef.current = isCalling; }, [isCalling]);
    useEffect(() => { callIncomingRef.current = callIncoming; }, [callIncoming]);

    // --- Auth & Env Check ---
    useEffect(() => {
        // Log danh sách thiết bị để hỗ trợ debug
        navigator.mediaDevices?.enumerateDevices().then(devices => {
            console.log('[Media] Danh sách phần cứng:', devices.map(d => `${d.kind}: ${d.label || 'Không tên'}`));
        }).catch(err => console.error('[Media] Không thể lấy danh sách thiết bị:', err));

        // Kiểm tra biến môi trường để tránh lỗi JSON.parse "undefined"
        if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
            console.error('[Config] Thiếu biến môi trường Pusher!');
            toast.error('Lỗi cấu hình hệ thống (Pusher)!');
        }

        fetch('/api/auth/me').then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        }).then(data => {
            if (!data.user) router.push('/login');
            else setMyUser(data.user);
        }).catch((err) => {
            console.error('[Auth] Lỗi fetch user:', err);
            toast.error('Lỗi kết nối cơ sở dữ liệu hoặc phiên làm việc hết hạn!');
        });
    }, [router]);

    // --- Pusher ---
    useEffect(() => {
        if (!myUser?.user_id) return;
        fetchMessages();
        const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
        const channelName = `chat-${[myUser.user_id, otherUserId].sort((a: number, b: number) => a - b).join('-')}`;
        const channel = pusher.subscribe(channelName);
        channel.bind('pusher:subscription_succeeded', () => setIsConnected(true));
        channel.bind('new-message', (data: any) => {
            setMessages(prev => (prev.find(m => m.message_id === data.message_id) ? prev : [...prev, data]));
        });
        channel.bind('peer-discovery', (data: any) => {
            if (data.sender_id !== myUserRef.current?.user_id) {
                setOtherPeerId(data.peer_id);
            }
        });
        channel.bind('end-call', () => {
            console.log('[Pusher] Nhận được tín hiệu kết thúc cuộc gọi từ đối phương');
            endCallLocally(false); 
        });
        channel.bind('incoming-call', (data: any) => {
            if (data.sender_id !== myUserRef.current?.user_id) {
                console.log('[Pusher] Tín hiệu gọi đến từ:', data.sender_id);
                if (!isCallingRef.current && !callIncomingRef.current) {
                    setCallIncoming({ isPusherSignal: true, peerId: data.sender_peer_id });
                }
            }
        });
        channel.bind('call-rejected', (data: any) => {
            if (data.sender_id !== myUserRef.current?.user_id) {
                console.log('[Pusher] Đối phương đã từ chối cuộc gọi');
                setCallIncoming(null);
                toast('Đối phương đã từ chối cuộc gọi.');
                endCallLocally(false);
            }
        });
        channel.bind('transcript-signal', (data: any) => {
            if (data.sender_id !== myUserRef.current?.user_id) {
                console.log('[Pusher] Nhận hội thoại:', data.text);
                if (data.isJoining) {
                    tempTranscriptRef.current = tempTranscriptRef.current.trimEnd() + ' ' + data.text + '\n';
                } else {
                    tempTranscriptRef.current += data.text + '\n';
                }
            }
        });
        return () => { pusher.unsubscribe(channelName); pusher.disconnect(); };
    }, [myUser?.user_id, otherUserId]);

    // --- PeerJS với Định danh linh hoạt ---
    useEffect(() => {
        if (!myUser?.user_id || typeof window === 'undefined') return;
        
        const initPeer = async () => {
            const { Peer } = await import('peerjs');
            // Tạo ID có suffix ngẫu nhiên để tránh lỗi "ID is taken"
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const myId = `psycho-user-${myUser.user_id}-${randomSuffix}`;
            myPeerIdRef.current = myId;

            const peer = new Peer(myId, {
                host: '0.peerjs.com',
                port: 443,
                secure: true,
                config: { 
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }, 
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ] 
                }
            });
            peerRef.current = peer;

            peer.on('open', (id) => {
                console.log('[Peer] Sẵn sàng với ID động:', id);
                setIsConnected(true);
                // Phát tín hiệu cho đối phương biết ID của mình
                broadcastPeerId();
            });

            peer.on('call', (call) => {
                console.log('[Peer] Luồng Peer đã tới từ:', call.peer);
                
                // CƠ CHẾ AUTO-ANSWER: Nếu ta đã chuẩn bị sẵn stream và đang đợi (do bấm Answer từ tín hiệu Pusher trước)
                if (isWaitingForPeerToAnswerRef.current && localStreamRef.current) {
                    console.log('[Call] Khớp lệnh! Đang trả lời tự động cuộc gọi từ:', call.peer);
                    call.answer(localStreamRef.current);
                    setupCall(call);
                    isWaitingForPeerToAnswerRef.current = false;
                } else {
                    setCallIncoming(call);
                }
            });

            peer.on('error', (err) => {
                console.error('[Peer] Lỗi kết nối:', err.type, err.message);
                if (err.type === 'unavailable-id') {
                    // Nếu vẫn xui xẻo bị trùng, thử lại với ID khác sau 2s
                    setTimeout(() => initPeer(), 2000);
                }
            });

            peer.on('disconnected', () => {
                setIsConnected(false);
                peer.reconnect();
            });
        };

        const broadcastPeerId = async () => {
            if (!myPeerIdRef.current) return;
            try {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        receiverId: otherUserId, 
                        content: myPeerIdRef.current, 
                        isCallSignal: true,
                        isPeerDiscovery: true 
                    })
                });
            } catch (e) {}
        };

        initPeer();
        // Định kỳ nhắc lại ID cho bên kia (phòng trường hợp họ mới F5)
        const interval = setInterval(() => broadcastPeerId(), 30000);

        return () => { 
            clearInterval(interval);
            if (peerRef.current) {
                peerRef.current.destroy();
                setIsConnected(false);
            }
        };
    }, [myUser?.user_id]);

    const sendTranscriptSignal = async (text: string, isJoining = false) => {
        if (!text.trim()) return;
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    receiverId: otherUserId, 
                    content: text, 
                    isTranscriptPart: true,
                    isJoining: isJoining // Gắn cờ để bên nhận biết có nên xuống dòng hay không
                })
            });
        } catch (e) {}
    };

    // --- Advanced Speech Recognition ---
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const startSpeechEngine = () => {
            if (!isCallingRef.current || isMuted) return;
            
            // Dọn dẹp bản cũ nếu còn
            if (recognitionRef.current) {
                try { 
                    recognitionRef.current.onend = null;
                    recognitionRef.current.stop(); 
                } catch(e) {}
            }

            console.log('[Speech] Khởi tạo engine mới...');
            const rec = new SpeechRecognition();
            recognitionRef.current = rec;
            rec.lang = 'vi-VN';
            rec.continuous = true; 
            rec.interimResults = true; // Giữ true để có trải nghiệm mượt mà nhưng xử lý logic ghép nối

            rec.onstart = () => { 
                setIsTranscribing(true); 
                console.log('[Speech] 🔴 Thu âm...'); 
            };
            
            rec.onresult = (e: any) => {
                let interim = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const text = e.results[i][0].transcript;
                    if (e.results[i].isFinal) {
                        const now = Date.now();
                        const timeDiff = now - lastCommitTimeRef.current;
                        const role = myUserRef.current?.role || 'user';
                        const prefix = role === 'expert' ? '(BS): ' : '(BN): ';
                        
                        // Nếu cùng 1 người nói và cách nhau dưới 3s thì gộp vào
                        if (role === lastCommitRoleRef.current && timeDiff < 3000) {
                            tempTranscriptRef.current = tempTranscriptRef.current.trimEnd() + ' ' + text.trim() + '\n';
                            sendTranscriptSignal(text.trim(), true);
                        } else {
                            const formatted = prefix + text.trim();
                            tempTranscriptRef.current += formatted + '\n';
                            sendTranscriptSignal(formatted, false);
                        }
                        
                        lastCommitTimeRef.current = now;
                        lastCommitRoleRef.current = role;
                        lastInterimRef.current = '';
                    } else {
                        interim = text;
                    }
                }
                lastInterimRef.current = interim;
            };

            rec.onerror = (err: any) => {
                if (err.error === 'aborted') return;
                setIsTranscribing(false);
            };

            rec.onend = () => {
                setIsTranscribing(false);
                if (lastInterimRef.current) {
                    const now = Date.now();
                    const timeDiff = now - lastCommitTimeRef.current;
                    const role = myUserRef.current?.role || 'user';
                    const prefix = role === 'expert' ? '(BS): ' : '(BN): ';

                    if (role === lastCommitRoleRef.current && timeDiff < 3000) {
                        tempTranscriptRef.current = tempTranscriptRef.current.trimEnd() + ' ' + lastInterimRef.current.trim() + '\n';
                        sendTranscriptSignal(lastInterimRef.current.trim(), true);
                    } else {
                        const formatted = prefix + lastInterimRef.current.trim();
                        tempTranscriptRef.current += formatted + '\n';
                        sendTranscriptSignal(formatted, false);
                    }
                    lastCommitTimeRef.current = now;
                    lastCommitRoleRef.current = role;
                    lastInterimRef.current = '';
                }

                // Với continuous: true, onend chỉ gọi khi có lỗi hoặc im lặng quá lâu
                if (isCallingRef.current && !isMuted) {
                    clearTimeout(restartTimerRef.current);
                    restartTimerRef.current = setTimeout(() => {
                        console.log('[Speech] Đang khôi phục phiên thu âm...');
                        startSpeechEngine();
                    }, 2000);
                }
            };

            try { rec.start(); } catch(e) { console.warn('[Speech] Lỗi khởi động:', e); }
        };

        if (isCalling && myUser && !isMuted) {
            const timer = setTimeout(() => startSpeechEngine(), 1500);
            return () => {
                clearTimeout(timer);
                clearTimeout(restartTimerRef.current);
                if (recognitionRef.current) {
                    recognitionRef.current.onend = null;
                    try { recognitionRef.current.stop(); } catch(e) {}
                    recognitionRef.current = null;
                }
            };
        }
        
        return () => {
            clearTimeout(restartTimerRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                try { recognitionRef.current.stop(); } catch(e) {}
                recognitionRef.current = null;
            }
            setIsTranscribing(false);
        };
    }, [isCalling, myUser?.user_id, isMuted]);

    const fetchMessages = async () => {
        const res = await fetch(`/api/messages/${otherUserId}`);
        if (res.ok) { 
            const data = await res.json(); 
            setMessages(data.messages); 
            setOtherUser(data.otherUser); 
        }
        setLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault(); if (!newMessage.trim()) return;
        const msg = newMessage; setNewMessage('');
        await fetch('/api/messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiverId: otherUserId, content: msg })
        });
    };

    const startCall = async () => {
        if (isCalling) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Trình duyệt của bạn không hỗ trợ gọi Video/Audio.');
            return;
        }

        try {
            tempTranscriptRef.current = ''; 
            console.log('[Call] Đang yêu cầu quyền Media (Video + Audio)...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            console.log('[Call] Đã nhận được stream Media');
            localStreamRef.current = stream; 
            setLocalStream(stream); 
            setIsCalling(true);
            setShowCallOverlay(true); 

            // Gửi tín hiệu gọi qua Pusher trước để báo thức máy bên kia
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    receiverId: otherUserId, 
                    content: '__INCOMING_CALL__', 
                    isCallSignal: true,
                    sender_peer_id: myPeerIdRef.current // Gửi ID thực tế đang dùng
                })
            });

            // Ưu tiên gọi vào otherPeerId đã discovery được, nếu chưa có thì dùng ID mặc định
            const targetId = otherPeerId || `psycho-user-${otherUserId}`;
            const call = peerRef.current?.call(targetId, stream);
            if (call) {
                console.log('[Call] Đã gửi yêu cầu gọi tới:', otherUserId);
                setupCall(call);
            }
        } catch (err: any) {
            console.error('[Call] Lỗi Media hoặc Peer:', err);
            let msg = 'Không truy cập được Camera/Micro';
            
            if (err.name === 'NotFoundError') {
                msg = 'Máy tính của bạn hiện không tìm thấy Micrô hoặc Camera. Vui lòng kết nối đầy đủ thiết bị để bắt đầu cuộc gọi.';
            } else if (err.name === 'NotAllowedError') {
                msg = 'Bạn đã từ chối quyền truy cập Camera/Micro. Vui lòng bật lại trong cài đặt trình duyệt.';
            } else if (err.name === 'NotReadableError') {
                msg = 'Thiết bị đang bị chiếm dụng bởi ứng dụng khác (Zoom, Meet...).';
            } else {
                msg = `Yêu cầu hệ thống: Bản ghi âm bắt buộc phải có Micro. Lỗi: ${err.message || 'Unknown'}`;
            }
            toast.error(msg, { duration: 5000 });
        }
    };

    const answerCall = async () => {
        if (!callIncoming) return;
        try {
            tempTranscriptRef.current = '';
            console.log('[Call] Đang trả lời cuộc gọi, yêu cầu quyền Media (Video + Audio)...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            localStreamRef.current = stream; 
            setLocalStream(stream); 
            setIsCalling(true);
            setShowCallOverlay(true);

            // Nếu tín hiệu đến từ PeerJS thật
            if (callIncoming && typeof callIncoming.answer === 'function') {
                callIncoming.answer(stream); 
                setupCall(callIncoming); 
            } else {
                // Nếu nhận tín hiệu từ Pusher trước nhưng PeerJS chưa tới, ta đánh dấu là "đang muốn nghe"
                // PeerJS listener 'call' sẽ tự động check và trả lời nếu thấy ta đang có stream sẵn
                console.log('[Call] Đang đợi luồng PeerJS để trả lời tự động...');
                isWaitingForPeerToAnswerRef.current = true;
            }
            setCallIncoming(null);
        } catch (err: any) {
            console.error('[Call] Lỗi khi nhận cuộc gọi:', err);
            toast.error('Máy tính bạn thiếu cấu hình phần cứng (Micrô) và không thể bắt đầu cuộc gọi.');
        }
    };

    const rejectCall = async () => {
        setCallIncoming(null);
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    receiverId: otherUserId, 
                    content: '__CALL_REJECTED__', 
                    isCallSignal: true 
                })
            });
        } catch (e) {}
    };

    const setupCall = (call: any) => {
        setActiveCall(call);
        call.on('stream', (s: MediaStream) => setRemoteStream(s));
        call.on('close', () => endCallLocally(false));
        call.on('error', () => endCallLocally(false));
    };

    const endCallLocally = async (sendSignal = true) => {
        console.log('[Call] Đang dọn dẹp và kết thúc cuộc gọi...');
        clearTimeout(restartTimerRef.current); // Xóa bộ hẹn giờ khởi động lại Speech
        
        if (sendSignal) {
            // Gửi tín hiệu qua Pusher để bên kia cũng tự động tắt Cam/Mic
            const channelName = `chat-${[myUser?.user_id, otherUserId].sort((a, b) => a - b).join('-')}`;
            try {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        receiverId: otherUserId, 
                        content: '__CALL_ENDED__', // Tín hiệu đặc biệt
                        isCallSignal: true 
                    })
                });
                console.log('[Call] Đã gửi tín hiệu kết thúc tới đối phương');
            } catch (e) {
                console.error('[Call] Không thể gửi tín hiệu kết thúc:', e);
            }
        }

        if (activeCall) {
            try { activeCall.close(); } catch (e) {}
        }
        
        // Dừng toàn bộ tracks (Video/Audio) của local
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => {
                try { t.stop(); t.enabled = false; } catch (e) {}
            });
        }
        
        // Dừng tracks của remote
        if (remoteStream) {
            remoteStream.getTracks().forEach(t => {
                try { t.stop(); } catch (e) {}
            });
        }

        // Xóa srcObject của video elements để giải phóng hardware tốt hơn
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

        // Dừng bộ nhận diện giọng nói ngay lập tức
        if (recognitionRef.current) {
            try { 
                recognitionRef.current.onend = null; // Gỡ bỏ handler tránh hồi sinh
                recognitionRef.current.stop(); 
            } catch (e) {}
            recognitionRef.current = null;
        }

        // Reset toàn bộ state về mặc định
        localStreamRef.current = null; 
        setLocalStream(null); 
        setRemoteStream(null); 
        setIsCalling(false); 
        setCallIncoming(null); 
        setActiveCall(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsTranscribing(false);

        // Chỉ Bác sĩ mới cần xem quá trình biên dịch và kết quả cuối cùng
        if (myUserRef.current?.role === 'expert') {
            setIsProcessing(true);
            setTimeout(() => {
                if (tempTranscriptRef.current && tempTranscriptRef.current.trim()) {
                    setTranscript(tempTranscriptRef.current);
                    toast.success('Đã biên dịch xong cuộc trò chuyện!');
                }
                setIsProcessing(false);
            }, 2500);
        } else {
            // Đối với Bệnh nhân: Thoát hẳn màn hình cuộc gọi ngay lập tức
            setShowCallOverlay(false);
        }
    };

    const downloadTranscript = () => {
        if (!transcript) return;
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bien_ban_tu_van_${otherUser?.full_name || 'BS'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => { if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight; }, [messages]);
    useEffect(() => { if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream; }, [localStream]);
    useEffect(() => { if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream; }, [remoteStream]);
    useEffect(() => { if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight; }, [transcript]);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#6366f1' }}>Đang tải phòng chat...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px', height: '95vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
            <style>{`
                .btn-action { transition: all 0.2s; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .btn-action:hover { transform: scale(1.1); opacity: 0.9; }
                .btn-hangup { background: #ef4444 !important; }
                .btn-hangup:hover { background: #dc2626 !important; }
                .chat-msg { animation: fadeIn 0.3s ease-in; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* Header */}
            <div style={{ background: 'white', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #eee', borderRadius: '12px 12px 0 0', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                <Link href="/appointments" style={{ color: '#64748b' }}><ArrowLeft size={22}/></Link>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>{otherUser?.full_name || 'Đang tải...'}</div>
                    <div style={{ fontSize: '0.75rem', color: isConnected ? '#22c55e' : '#94a3b8' }}>● {isConnected ? 'Đang trực tuyến' : 'Đang kết nối...'}</div>
                </div>
                {!isCalling && (
                    <button onClick={startCall} title="Bắt đầu video call" className="btn-action" style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', gap: '8px' }}>
                        <Video size={18} /> Facetime
                    </button>
                )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg: any) => {
                    const isMe = msg.sender_id === myUser?.user_id;
                    return (
                        <div key={msg.message_id} className="chat-msg" style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? '#6366f1' : 'white', color: isMe ? 'white' : '#1e293b', padding: '10px 16px', borderRadius: '15px', maxWidth: '75%', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', fontSize: '0.95rem' }}>
                            {msg.content}
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ padding: '15px', background: 'white', display: 'flex', gap: '12px', borderTop: '1px solid #eee', borderRadius: '0 0 12px 12px' }}>
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ flex: 1, padding: '12px 18px', borderRadius: '25px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} placeholder="Nhập tin nhắn..." />
                <button type="submit" disabled={!newMessage.trim()} className="btn-action" style={{ background: '#6366f1', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%' }}>
                    <Send size={20} />
                </button>
            </form>

            {/* Call Incoming */}
            {callIncoming && (
                <div style={{ position: 'fixed', top: '30px', right: '30px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 1000, border: '2px solid #6366f1', width: '300px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: '#e0e7ff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><Video size={30} color="#6366f1"/></div>
                        <p style={{ fontWeight: '700', marginBottom: '20px' }}>Cuộc gọi video đang đến...</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={answerCall} className="btn-action" style={{ flex: 1, background: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600' }}>Trả lời</button>
                            <button onClick={() => setCallIncoming(null)} className="btn-action" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600' }}>Từ chối</button>
                        </div>
                    </div>
                </div>  
            )}

            {/* Facetime Overlay */}
            {showCallOverlay && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0f172a', zIndex: 2000, display: 'flex' }}>
                    <div style={{ flex: 3, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isCalling ? (
                            <>
                                <video ref={remoteVideoRef} autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <div style={{ position: 'absolute', top: '25px', right: '25px', width: '200px', height: '150px', borderRadius: '12px', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 15px rgba(0,0,0,0.3)' }}>
                                    <video ref={localVideoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                </div>
                                <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.1)', padding: '15px 30px', borderRadius: '40px', backdropFilter: 'blur(10px)' }}>
                                    <button onClick={() => { const t = localStream?.getAudioTracks()[0]; if(t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); } }} title={isMuted ? "Bật Mic" : "Tắt Mic"} className="btn-action" style={{ width: '55px', height: '55px', borderRadius: '50%', border: 'none', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)', color:'white' }}>
                                        {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                                    </button>
                                    <button onClick={() => { const t = localStream?.getVideoTracks()[0]; if(t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); } }} title={isVideoOff ? "Bật Camera" : "Tắt Camera"} className="btn-action" style={{ width: '55px', height: '55px', borderRadius: '50%', border: 'none', background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.2)', color:'white' }}>
                                        {isVideoOff ? <VideoOff size={24}/> : <Video size={24}/>}
                                    </button>
                                    <button onClick={() => endCallLocally()} title="Kết thúc cuộc gọi" className="btn-action btn-hangup" style={{ width: '55px', height: '55px', borderRadius: '50%', border: 'none', color:'white' }}>
                                        <PhoneOff size={24}/>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: 'white', textAlign: 'center' }}>
                                <div style={{ background: '#22c55e', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <PhoneOff size={40} color="white" />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Cuộc gọi đã kết thúc</h2>
                                <p style={{ color: '#94a3b8', marginTop: '10px' }}>Kiểm tra biên bản tư vấn ở cột bên phải.</p>
                                <button onClick={() => setShowCallOverlay(false)} className="btn-action" style={{ marginTop: '30px', background: 'white', color: '#0f172a', border: 'none', padding: '12px 30px', borderRadius: '10px', fontWeight: '700' }}>
                                    Đóng màn hình cuộc gọi
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Transcript Panel - Chỉ hiện cho Bác sĩ (Expert) */}
                    {myUser?.role === 'expert' && (
                        <div style={{ flex: 1, background: 'white', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0', minWidth: '320px' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={18} color="#6366f1"/>
                                    <span style={{ fontWeight: '700', color: '#1e293b' }}>Biên bản tư vấn</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => { setTranscript(''); tempTranscriptRef.current = ''; }} title="Làm mới" className="btn-action" style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '6px' }}><RotateCcw size={16} color="#64748b"/></button>
                                    <button onClick={downloadTranscript} title="Tải về .doc" disabled={!transcript} className="btn-action" style={{ border: 'none', background: '#6366f1', color:'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}><Download size={16}/></button>
                                </div>
                            </div>
                            <div ref={transcriptRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', fontSize: '0.95rem', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                                {isProcessing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '15px', color: '#6366f1' }}>
                                        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%' }}></div>
                                        <p style={{ fontWeight: '600', animation: 'pulse 1.5s infinite' }}>Hệ thống đang biên dịch cuộc hội thoại...</p>
                                    </div>
                                ) : transcript ? (
                                    transcript
                                ) : isTranscribing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: '600' }}>
                                        <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                                        🔴 Đang ghi âm nội dung cuộc hội thoại...
                                    </div>
                                ) : isCalling ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#94a3b8', textAlign: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', background: '#94a3b8', borderRadius: '50%' }}></div>
                                        <span>Đang khởi động bộ thu âm...</span>
                                        <span style={{ fontSize: '0.75rem' }}>(Vui lòng nói sau khi đèn đỏ hiện lên)</span>
                                    </div>
                                ) : (
                                    <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>
                                        Chưa có bản ghi âm nào. Biên bản sẽ xuất hiện sau khi kết thúc cuộc gọi.
                                    </div>
                                )}
                            </div>
                            <style>{`
                                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                                .animate-spin { animation: spin 1s linear infinite; }
                                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                            `}</style>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
