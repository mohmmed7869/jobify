import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
  FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash,
  FaDesktop, FaPhoneSlash, FaComments, FaUsers, FaStickyNote,
  FaPaperPlane, FaRecordVinyl, FaShieldAlt
} from 'react-icons/fa';
import { FiX, FiZap, FiClock } from 'react-icons/fi';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import './VideoInterview.css';

// =====================================================
// ICE Servers - STUN + TURN للعمل خلف NAT/Firewall
// =====================================================
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

// =====================================================
// مكون الفيديو البعيد - يجب أن يكون خارج المكون الرئيسي
// تعريفه داخل الرئيسي يُسبب إعادة رسم مستمرة وقطع الاتصال
// =====================================================
const RemoteVideo = memo(({ stream, name, isOnline }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn('Remote play blocked:', e));
    }
  }, [stream]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
          <FaVideoSlash size={40} className="mb-2" />
          <p className="text-xs font-bold">بدون فيديو</p>
        </div>
      )}
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        {name || 'مشارك'}
      </div>
    </div>
  );
});

// =====================================================
// مكون الفيديو المحلي - خارج الرئيسي أيضاً
// =====================================================
const LocalVideo = memo(({ stream, isVideoOn, name }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn('Local play blocked:', e));
    }
  }, [stream]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden w-full h-full border-2 border-primary-500/30">
      {isVideoOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-500">
          <FaVideoSlash size={40} className="mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">الكاميرا معطلة</p>
        </div>
      )}
      <div className="absolute bottom-3 right-3 bg-primary-600/80 backdrop-blur px-3 py-1.5 rounded-xl text-white text-xs font-bold">
        أنت
      </div>
    </div>
  );
});

// =====================================================
// المكون الرئيسي
// =====================================================
const VideoInterview = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();

  // حالة المكون
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // socketId -> MediaStream
  const [participants, setParticipants] = useState([]);         // socketId -> userInfo
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, connecting, connected, failed

  const [aiQuestions] = useState([
    { id: 1, text: 'تحدث عن أكبر تحدي تقني واجهته وكيف تغلبت عليه؟', category: 'تقني' },
    { id: 2, text: 'كيف تتعامل مع ضغوط المواعيد النهائية للمشاريع؟', category: 'سلوكي' },
    { id: 3, text: 'لماذا تعتقد أنك المرشح الأمثل لهذا الدور الاستراتيجي؟', category: 'استراتيجي' }
  ]);

  // Refs - هامة لتجنب stale closures
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());         // socketId -> RTCPeerConnection
  const pendingCandidates = useRef(new Map()); // socketId -> RTCIceCandidate[]
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const jobTitle = queryParams.get('job') || 'مقابلة وظيفية';
  const myId = user?._id || user?.id;

  // ===== تحديد إذا الشخص مضيف =====
  useEffect(() => {
    if (user?.role === 'employer' || user?.role === 'company') setIsHost(true);
  }, [user]);

  // ===== مؤقت المكالمة =====
  useEffect(() => {
    if (!isSetupComplete) return;
    const t = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [isSetupComplete]);

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ===== جلب الكاميرا والميكروفون =====
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Media error:', err);
      if (err.name === 'NotAllowedError') toast.error('يرجى السماح بالوصول للكاميرا والميكروفون');
      else toast.error('تعذر الوصول للكاميرا أو الميكروفون');
      return null;
    }
  }, []);

  // Start preview on mount
  useEffect(() => {
    startLocalStream();
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startLocalStream]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // =====================================================
  // WebRTC - إنشاء اتصال مع مستخدم آخر
  // =====================================================
  const addPendingCandidates = useCallback(async (socketId, pc) => {
    const candidates = pendingCandidates.current.get(socketId) || [];
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
    }
    pendingCandidates.current.delete(socketId);
  }, []);

  const createPeerConnection = useCallback((targetSocketId) => {
    // أغلق الاتصال القديم إن وجد
    if (peersRef.current.has(targetSocketId)) {
      peersRef.current.get(targetSocketId).close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit('ice-candidate', { candidate, targetSocketId });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`ICE [${targetSocketId.slice(-4)}]: ${state}`);
      if (state === 'connected' || state === 'completed') {
        setConnectionStatus('connected');
      } else if (state === 'failed') {
        setConnectionStatus('failed');
        toast.error('فشل الاتصال بالطرف الآخر - يحاول إعادة الاتصال...');
        pc.restartIce();
      } else if (state === 'disconnected') {
        setConnectionStatus('idle');
      }
    };

    pc.ontrack = (event) => {
      console.log('📹 Received remote track from:', targetSocketId);
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setRemoteStreams(prev => new Map(prev).set(targetSocketId, remoteStream));
      }
    };

    // أضف tracks المحلية
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log(`Added local ${track.kind} track to peer`);
      });
    } else {
      console.warn('No local stream when creating peer connection!');
    }

    peersRef.current.set(targetSocketId, pc);
    return pc;
  }, [socket]);

  const createAndSendOffer = useCallback(async (targetSocketId) => {
    console.log('Creating offer for:', targetSocketId);
    setConnectionStatus('connecting');
    const pc = createPeerConnection(targetSocketId);
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit('offer', { offer, targetSocketId });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection, socket]);

  const handleIncomingOffer = useCallback(async (offer, senderSocketId) => {
    console.log('Handling offer from:', senderSocketId);
    setConnectionStatus('connecting');
    const pc = createPeerConnection(senderSocketId);
    try {
      // حماية من glare: إذا كان هناك offer محلي معلق نتجاهل الوارد
      if (pc.signalingState === 'have-local-offer') {
        console.warn('Glare detected - rolling back');
        await pc.setLocalDescription({ type: 'rollback' });
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await addPendingCandidates(senderSocketId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { answer, targetSocketId: senderSocketId });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, socket, addPendingCandidates]);

  const handleIncomingAnswer = useCallback(async (answer, senderSocketId) => {
    const pc = peersRef.current.get(senderSocketId);
    if (!pc) { console.warn('No peer for answer from:', senderSocketId); return; }
    try {
      if (pc.signalingState !== 'have-local-offer') return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await addPendingCandidates(senderSocketId, pc);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, [addPendingCandidates]);

  const handleIncomingCandidate = useCallback(async (candidate, senderSocketId) => {
    const pc = peersRef.current.get(senderSocketId);
    if (!pc || !pc.remoteDescription) {
      // احتفظ بـ candidates لحين جهوزية peer connection
      const pending = pendingCandidates.current.get(senderSocketId) || [];
      pending.push(candidate);
      pendingCandidates.current.set(senderSocketId, pending);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding candidate:', err);
    }
  }, []);

  // =====================================================
  // Socket Events - بعد الدخول للغرفة فقط
  // =====================================================
  useEffect(() => {
    if (!socket || !isSetupComplete || !roomId) return;

    // الانضمام للغرفة
    socket.emit('join-room', {
      roomId,
      userId: myId,
      userInfo: { name: user?.name, role: user?.role }
    });

    const onRoomState = (state) => {
      console.log('Room state received:', state);
      setParticipants(state.users || []);
      setChatMessages(state.chatMessages || []);
      setIsRecording(state.recording || false);
      // ❌ لا نُرسل offer هنا لتجنب حالة الـ glare
      // المستخدمون الموجودون مسبقاً سيُرسلون offer لنا عبر حدث 'user-joined'
    };

    const onUserJoined = (participant) => {
      console.log('User joined:', participant.userInfo?.name);
      setParticipants(prev => {
        const exists = prev.find(p => p.socketId === participant.socketId);
        if (exists) return prev;
        return [...prev, participant];
      });
      toast.success(`${participant.userInfo?.name || 'مستخدم'} انضم للمقابلة`);
      // ✅ المستخدم الموجود في الغرفة فقط هو من يُرسل الـ offer للداخل الجديد
      // هذا يمنع حالة الـ glare حيث يرسل الطرفان offer في نفس الوقت
      setTimeout(() => createAndSendOffer(participant.socketId), 500);
    };

    const onUserLeft = ({ socketId }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
      setRemoteStreams(prev => { const m = new Map(prev); m.delete(socketId); return m; });
      if (peersRef.current.has(socketId)) {
        peersRef.current.get(socketId).close();
        peersRef.current.delete(socketId);
      }
      toast('مشارك غادر الغرفة', { icon: '👋' });
    };

    const onOffer = ({ offer, senderSocketId }) => handleIncomingOffer(offer, senderSocketId);
    const onAnswer = ({ answer, senderSocketId }) => handleIncomingAnswer(answer, senderSocketId);
    const onIceCandidate = ({ candidate, senderSocketId }) => handleIncomingCandidate(candidate, senderSocketId);

    const onChatMessage = (msg) => {
      if (msg.userId !== myId) { // لم أرسله أنا
        setChatMessages(prev => [...prev, msg]);
      }
    };

    socket.on('room-state', onRoomState);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('chat-message', onChatMessage);

    return () => {
      socket.off('room-state', onRoomState);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('chat-message', onChatMessage);
    };
  }, [socket, isSetupComplete, roomId, myId, user, createAndSendOffer, handleIncomingOffer, handleIncomingAnswer, handleIncomingCandidate]);

  // =====================================================
  // التحكم في الكاميرا والميكروفون
  // =====================================================
  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !isVideoOn; });
    setIsVideoOn(v => !v);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !isAudioOn; });
    setIsAudioOn(a => !a);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // أعد الكاميرا
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && camTrack) sender.replaceTrack(camTrack);
      });
      setIsScreenSharing(false);
      return;
    }
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screen.getVideoTracks()[0];
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => toggleScreenShare();
      setIsScreenSharing(true);
      toast.success('مشاركة الشاشة نشطة');
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('فشل مشاركة الشاشة');
    }
  };

  const endInterview = () => {
    if (!window.confirm('هل أنت متأكد من إنهاء المقابلة؟')) return;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peersRef.current.forEach(pc => pc.close());
    navigate(`/interview-feedback/${roomId}`, {
      state: { notes, chatMessages: chatMessages.map(m => `${m.userName}: ${m.message}`).join('\n') }
    });
  };

  const handleJoin = async () => {
    // ✅ أعد استخدام الـ stream الموجود من المعاينة بدلاً من استدعاء getUserMedia مرة ثانية
    // استدعاؤه مرتين يُسبب تعارضاً في الـ tracks ويمنع إضافتها للـ peer connection
    if (localStreamRef.current && localStreamRef.current.active) {
      setIsSetupComplete(true);
    } else {
      // إذا فشلت المعاينة، حاول مجدداً
      const stream = await startLocalStream();
      if (stream) setIsSetupComplete(true);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket) return;
    const msg = {
      roomId,
      userId: myId,
      userName: user?.name || 'أنا',
      message: messageInput,
      timestamp: new Date()
    };
    socket.emit('chat-message', msg);
    setChatMessages(prev => [...prev, { ...msg, isMine: true }]);
    setMessageInput('');
    messageInputRef.current?.focus();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/smart-interview/${roomId}`)
      .then(() => toast.success('تم نسخ رابط المقابلة!'));
  };

  // =====================================================
  // شاشة الإعداد
  // =====================================================
  if (!isSetupComplete) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 text-white p-4" dir="rtl">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 text-center shadow-2xl border border-white/10">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FaShieldAlt size={28} />
          </div>
          <h2 className="text-2xl font-black mb-2">غرفة المقابلة</h2>
          <p className="text-slate-400 text-sm mb-5">{jobTitle}</p>

          {/* معاينة الكاميرا */}
          <div className="aspect-video bg-black rounded-2xl mb-5 overflow-hidden border border-slate-800 relative">
            <LocalVideo stream={localStream} isVideoOn={isVideoOn} name={user?.name} />
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isAudioOn ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-red-600 text-white'}`}
            >
              {isAudioOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-red-600 text-white'}`}
            >
              {isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            </button>
          </div>

          <button
            onClick={handleJoin}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl text-base transition-all flex items-center justify-center gap-3"
          >
            <FaVideo size={18} /> دخول الغرفة
          </button>
          <button onClick={() => navigate(-1)} className="mt-3 w-full py-2.5 text-slate-500 hover:text-slate-300 text-sm font-bold transition-all">
            إلغاء والعودة
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // غرفة المقابلة الرئيسية
  // =====================================================
  const remoteParticipants = participants.filter(p => p.socketId !== socket?.id);

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex overflow-hidden" dir="rtl">

      {/* ===== منطقة الفيديو الرئيسية ===== */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">

        {/* شريط القمة */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-white/5 z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">مباشر</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
              <FiClock size={12} />
              {formatDuration(callDuration)}
            </div>
            {connectionStatus === 'connecting' && (
              <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                <div className="w-2 h-2 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span>يتصل...</span>
              </div>
            )}
            {connectionStatus === 'failed' && (
              <div className="text-red-400 text-xs font-bold">⚠ فشل الاتصال</div>
            )}
          </div>

          <span className="text-xs text-slate-400 font-bold truncate max-w-[180px]">{jobTitle}</span>

          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={handleCopyLink}
                className="text-[10px] font-black uppercase bg-primary-600/20 hover:bg-primary-600 text-primary-300 hover:text-white px-3 py-1.5 rounded-xl border border-primary-500/30 transition-all"
              >
                نسخ الرابط
              </button>
            )}
            <button
              onClick={() => setShowSidebar(s => !s)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${showSidebar ? 'bg-primary-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <FaComments size={14} />
            </button>
          </div>
        </div>

        {/* شبكة الفيديو */}
        <div className="flex-1 overflow-hidden p-3">
          {remoteParticipants.length === 0 ? (
            /* لا يوجد مشاركون آخرون - انتظار */
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <FaUsers size={32} className="text-white/20" />
                </div>
                <h3 className="text-lg font-black text-white/40 mb-1">في انتظار الطرف الآخر</h3>
                <p className="text-white/20 text-xs mb-4">شارك رابط المقابلة</p>
                {isHost && (
                  <button
                    onClick={handleCopyLink}
                    className="px-5 py-2 bg-primary-600/30 hover:bg-primary-600 text-primary-300 hover:text-white border border-primary-500/30 rounded-xl text-xs font-black transition-all"
                  >
                    نسخ رابط الدعوة
                  </button>
                )}
              </div>
              {/* الفيديو المحلي */}
              <div className="h-full min-h-[200px]">
                <LocalVideo stream={localStream} isVideoOn={isVideoOn} name={user?.name} />
              </div>
            </div>
          ) : (
            /* يوجد مشاركون */
            <div className={`h-full grid gap-3 ${remoteParticipants.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2'}`}>
              {/* فيديوهات المشاركين البعيدين */}
              {remoteParticipants.map(p => (
                <RemoteVideo
                  key={p.socketId}
                  stream={remoteStreams.get(p.socketId) || null}
                  name={p.userInfo?.name}
                  isOnline={true}
                />
              ))}
              {/* الفيديو المحلي */}
              <div className="min-h-[150px] md:min-h-[200px]">
                <LocalVideo stream={localStream} isVideoOn={isVideoOn} name={user?.name} />
              </div>
            </div>
          )}
        </div>

        {/* شريط التحكم */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 md:gap-4 px-4 py-4 bg-slate-900/90 backdrop-blur border-t border-white/5">
          <button
            onClick={toggleMute}
            title={isAudioOn ? 'كتم' : 'تفعيل الصوت'}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isAudioOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 text-white'}`}
          >
            {isAudioOn ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
          </button>
          <button
            onClick={toggleVideo}
            title={isVideoOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 text-white'}`}
          >
            {isVideoOn ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
          </button>
          <button
            onClick={toggleScreenShare}
            title="مشاركة الشاشة"
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isScreenSharing ? 'bg-primary-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <FaDesktop size={18} />
          </button>
          <button
            onClick={() => {
              socket?.emit(isRecording ? 'stop-recording' : 'start-recording', roomId);
              setIsRecording(r => !r);
            }}
            title={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <FaRecordVinyl size={18} />
          </button>
          <div className="w-px h-8 bg-white/10 mx-1" />
          <button
            onClick={endInterview}
            className="h-12 md:h-14 px-5 md:px-7 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black flex items-center gap-2 shadow-lg transition-all"
          >
            <FaPhoneSlash size={16} />
            <span className="hidden sm:inline text-sm">إنهاء</span>
          </button>
        </div>
      </div>

      {/* ===== اللوحة الجانبية ===== */}
      {showSidebar && (
        <div className="flex-shrink-0 w-full md:w-80 lg:w-96 bg-slate-900 border-r border-white/5 flex flex-col absolute inset-0 md:relative md:inset-auto z-20">

          {/* رأس اللوحة */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="font-black text-sm">لوحة المقابلة</span>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all md:hidden"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* التبويبات */}
          <div className="flex border-b border-white/5 bg-slate-950/30 flex-shrink-0">
            {[
              { id: 'chat', icon: <FaComments size={13} />, label: 'المحادثة' },
              { id: 'questions', icon: <FiZap size={13} />, label: 'الأسئلة' },
              { id: 'notes', icon: <FaStickyNote size={13} />, label: 'الملاحظات' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 relative ${activeTab === tab.id ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab.icon} {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />}
              </button>
            ))}
          </div>

          {/* محتوى التبويب */}
          <div className="flex-1 overflow-y-auto">

            {/* محادثة الغرفة */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 opacity-30">
                      <FaComments size={24} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">لا توجد رسائل بعد</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.userId === myId || msg.isMine ? 'items-start' : 'items-end'}`}>
                        <span className="text-[9px] font-black text-slate-500 mb-1 px-2">
                          {msg.userName || msg.userInfo?.name || 'مجهول'}
                        </span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm font-medium ${
                          msg.userId === myId || msg.isMine
                            ? 'bg-primary-600 text-white rounded-tr-sm'
                            : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex-shrink-0 p-3 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && sendMessage()}
                      placeholder="أرسل رسالة..."
                      className="flex-1 bg-white/5 border border-white/10 focus:border-primary-500/50 rounded-xl py-2.5 px-3 text-sm font-bold outline-none transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className="w-10 h-10 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all"
                    >
                      <FaPaperPlane size={14} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* أسئلة الذكاء الاصطناعي */}
            {activeTab === 'questions' && (
              <div className="p-4 space-y-3">
                <div className="bg-primary-600/10 border border-primary-500/20 p-3 rounded-xl mb-3">
                  <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">أسئلة مقترحة</p>
                  <p className="text-xs text-slate-400">اقرأ هذه الأسئلة أثناء المقابلة</p>
                </div>
                {aiQuestions.map(q => (
                  <div key={q.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[9px] font-black text-primary-400 uppercase tracking-widest px-2 py-0.5 bg-primary-600/20 rounded-md mr-1 inline-block mb-2">
                      {q.category}
                    </span>
                    <p className="text-xs font-bold text-slate-200 leading-relaxed">{q.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* الملاحظات */}
            {activeTab === 'notes' && (
              <div className="p-4 h-full">
                <textarea
                  className="w-full h-full min-h-[300px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold leading-relaxed focus:ring-2 focus:ring-primary-500 outline-none resize-none placeholder-slate-700 text-white"
                  placeholder="اكتب ملاحظاتك هنا..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInterview;
