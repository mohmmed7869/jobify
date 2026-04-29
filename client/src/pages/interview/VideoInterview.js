import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};

// =====================================================
// مكون الفيديو البعيد - يجب أن يكون خارج المكون الرئيسي
// تعريفه داخل الرئيسي يُسبب إعادة رسم مستمرة وقطع الاتصال
// =====================================================
// RemoteVideo - بدون memo لضمان إعادة الرسم عند تغيير الـ stream
// =====================================================
const RemoteVideo = ({ stream, name, isOnline }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    // دائماً أعد تعيين srcObject لضمان التشغيل
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    const playVideo = () => {
      video.play().catch(e => console.warn('Remote play blocked:', e));
    };
    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true });
    }
    return () => video.removeEventListener('loadeddata', playVideo);
  }, [stream]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        onLoadedMetadata={() => videoRef.current?.play().catch(e => console.warn('Autoplay blocked:', e))}
      />
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-900">
          <FaVideoSlash size={40} className="mb-2" />
          <p className="text-xs font-bold">جاري الاتصال...</p>
        </div>
      )}
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        {name || 'مشارك'}
      </div>
    </div>
  );
};

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
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [networkQuality, setNetworkQuality] = useState('good'); // 'good', 'poor'

  // iceServers كـ ref ثابت لتجنب إعادة بناء دوال WebRTC عند كل تغيير
  const iceServersRef = useRef([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ]);

  // socketRef لتجنب stale closures في WebRTC callbacks
  const socketRef = useRef(null);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // جلب ICE servers وتخزينها في الـ ref مباشرة (لا تُحدث state = لا تُعيد رسم)
  useEffect(() => {
    axios.get('/api/interview/ice-servers')
      .then(res => {
        if (res.data?.success && res.data?.data?.iceServers) {
          iceServersRef.current = res.data.data.iceServers;
          console.log('✅ ICE servers loaded:', iceServersRef.current.length);
        }
      })
      .catch(err => console.warn('⚠️ Using default ICE servers:', err.message));
  }, []);

  const [aiQuestions] = useState([
    { id: 1, text: 'تحدث عن أكبر تحدي تقني واجهته وكيف تغلبت عليه؟', category: 'تقني' },
    { id: 2, text: 'كيف تتعامل مع ضغوط المواعيد النهائية للمشاريع؟', category: 'سلوكي' },
    { id: 3, text: 'لماذا تعتقد أنك المرشح الأمثل لهذا الدور الاستراتيجي؟', category: 'استراتيجي' }
  ]);

  // Refs - هامة لتجنب stale closures
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());           // socketId -> RTCPeerConnection
  const pendingCandidates = useRef(new Map());  // socketId -> RTCIceCandidate[]
  const remoteStreamsRef = useRef(new Map());   // socketId -> MediaStream (ref لتجنب stale closures)
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const hasJoinedRoom = useRef(false);

  // إغلاق جميع الاتصالات عند تدمير المكون لتجنب Memory Leaks وتداخل الاتصالات
  useEffect(() => {
    return () => {
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      hasJoinedRoom.current = false;
    };
  }, []);

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

  // ===== مراقب جودة الإنترنت =====
  useEffect(() => {
    if (!isSetupComplete || peersRef.current.size === 0) return;
    
    const interval = setInterval(async () => {
      let isPoor = false;
      for (const [id, pc] of peersRef.current.entries()) {
        try {
          const stats = await pc.getStats();
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const packetsLost = report.packetsLost || 0;
              const packetsReceived = report.packetsReceived || 1;
              const lossRate = packetsLost / (packetsReceived + packetsLost);
              if (lossRate > 0.05) isPoor = true; // أكثر من 5% فقدان للبيانات
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              const rtt = report.currentRoundTripTime || report.roundTripTime || 0;
              if (rtt > 0.4) isPoor = true; // أكثر من 400ms تأخير
            }
          });
        } catch (err) {}
      }
      
      setNetworkQuality(isPoor ? 'poor' : 'good');
      if (isPoor) {
        toast('اتصالك ضعيف، يتم التركيز على جودة الصوت 📡', { id: 'network-poor' });
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isSetupComplete]);

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ===== جلب الكاميرا والميكروفون =====
  const startLocalStream = useCallback(async () => {
    try {
      // فحص إذا كان المتصفح لا يدعم mediaDevices (غالباً بسبب HTTP بدل HTTPS)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('⚠️ المتصفح لا يدعم الوصول للكاميرا، تأكد من استخدام HTTPS أو متصفح حديث.');
        console.error('navigator.mediaDevices is undefined');
        return null;
      }

      // طلب الكاميرا: محاولة 1 (إعدادات محسنة)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('✅ Camera opened (advanced constraints)');
      } catch (err1) {
        console.warn('⚠️ Attempt 1 failed:', err1.name, err1.message, '- trying basic...');
        try {
          // محاولة 2: بدون تحديد الدقة
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          console.log('✅ Camera opened (basic constraints)');
        } catch (err2) {
          console.error('❌ Attempt 2 failed:', err2.name, err2.message);
          // إظهار الخطأ الحقيقي للمستخدم
          if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError') {
            toast.error('❌ رُفض إذن الكاميرا - افتح إعدادات المتصفح وامنح الإذن لهذا الموقع');
          } else if (err2.name === 'NotFoundError' || err2.name === 'DevicesNotFoundError') {
            toast.error('❌ لم يتم العثور على كاميرا في هذا الجهاز');
          } else if (err2.name === 'NotReadableError' || err2.name === 'TrackStartError') {
            toast.error('❌ الكاميرا مستخدمة من تطبيق آخر، أغلق التطبيقات الأخرى وحاول مجدداً');
          } else if (err2.name === 'OverconstrainedError') {
            toast.error('❌ كاميرا الجهاز لا تدعم الإعدادات المطلوبة');
          } else if (!window.isSecureContext) {
            toast.error('❌ يجب استخدام HTTPS لتشغيل الكاميرا في المتصفح - تأكد من أن الرابط يبدأ بـ https://');
          } else {
            toast.error(`❌ خطأ في الكاميرا: ${err2.name} - ${err2.message}`);
          }
          return null;
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Unexpected camera error:', err);
      toast.error(`❌ خطأ غير متوقع: ${err.name}`);
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
  // WebRTC - جميع الدوال تستخدم Refs لتجنب stale closures
  // =====================================================
  const addPendingCandidates = useCallback(async (socketId, pc) => {
    const candidates = pendingCandidates.current.get(socketId) || [];
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
    }
    pendingCandidates.current.delete(socketId);
  }, []);

  // createPeerConnection بدون أي dependency على state متغير
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peersRef.current.has(targetSocketId)) {
      peersRef.current.get(targetSocketId).close();
      peersRef.current.delete(targetSocketId);
    }

    // نستخدم iceServersRef (ثابت) بدل iceServers (state)
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { candidate, targetSocketId });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection [${targetSocketId.slice(-4)}]: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      }
      if (pc.connectionState === 'failed') {
        setConnectionStatus('failed');
        console.warn('⚠️ ICE failed for:', targetSocketId, '- triggering ICE restart offer');
        // restartIce() alone is not enough on Android Chrome.
        // We must create a new offer with iceRestart:true and resend it.
        setTimeout(async () => {
          try {
            if (pc.signalingState === 'stable') {
              const restartOffer = await pc.createOffer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: true });
              await pc.setLocalDescription(restartOffer);
              socketRef.current?.emit('offer', { offer: restartOffer, targetSocketId });
              console.log('🔄 ICE restart offer sent to:', targetSocketId);
            }
          } catch (e) {
            console.error('ICE restart failed:', e.message);
          }
        }, 1000);
      }
      if (pc.connectionState === 'disconnected') {
        setConnectionStatus('disconnected');
        // Give 5 seconds for natural recovery before forcing a restart
        setTimeout(() => {
          const currentPc = peersRef.current.get(targetSocketId);
          if (currentPc && currentPc.connectionState === 'disconnected') {
            console.warn('Still disconnected after 5s, forcing ICE restart...');
            currentPc.restartIce();
          }
        }, 5000);
      }
    };

    pc.ontrack = (event) => {
      const { track } = event;
      console.log(`📹 ontrack [${track.kind}] from:`, targetSocketId);

      let stream = remoteStreamsRef.current.get(targetSocketId);

      // Initialize a new MediaStream if none exists for this peer
      if (!stream) {
        stream = new MediaStream();
        remoteStreamsRef.current.set(targetSocketId, stream);
      }

      // Add the incoming track to our stable MediaStream
      if (!stream.getTrackById(track.id)) {
        stream.addTrack(track);
      }

      console.log(`✅ Remote stream [${targetSocketId.slice(-4)}] tracks: ${stream.getTracks().map(t => t.kind).join(', ')}`);
      
      // Update state to trigger re-render, but DO NOT clone the MediaStream
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(targetSocketId, stream);
        return newMap;
      });
    };

    // أضف tracks المحلية الآن
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach(track => {
        const sender = pc.addTrack(track, localStream);
        console.log(`✅ Added local ${track.kind} to peer ${targetSocketId.slice(-4)}`);
        
        // تقييد استهلاك الفيديو لضمان استقرار الصوت في الإنترنت الضعيف (Audio Priority)
        if (track.kind === 'video') {
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];
          
          // تقليل الـ Bitrate إلى 400kbps كحد أقصى للتعامل مع الإنترنت الضعيف
          params.encodings[0].maxBitrate = 400000;
          sender.setParameters(params).catch(e => console.warn('Could not set video params:', e));
        }
      });
    } else {
      console.warn('⚠️ No local stream when creating peer for:', targetSocketId);
    }

    peersRef.current.set(targetSocketId, pc);
    return pc;
  }, [addPendingCandidates]);

  const createAndSendOffer = useCallback(async (targetSocketId) => {
    console.log('📤 Creating offer for:', targetSocketId);
    setConnectionStatus('connecting');
    const pc = createPeerConnection(targetSocketId);
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('offer', { offer, targetSocketId });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection]);

  const handleIncomingOffer = useCallback(async (offer, senderSocketId) => {
    console.log('📥 Handling offer from:', senderSocketId);
    setConnectionStatus('connecting');
    const pc = createPeerConnection(senderSocketId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await addPendingCandidates(senderSocketId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('answer', { answer, targetSocketId: senderSocketId });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, addPendingCandidates]);

  const handleIncomingAnswer = useCallback(async (answer, senderSocketId) => {
    const pc = peersRef.current.get(senderSocketId);
    if (!pc) { console.warn('No peer for answer from:', senderSocketId); return; }
    try {
      if (pc.signalingState !== 'have-local-offer') {
        console.warn('Ignoring answer in state:', pc.signalingState); return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await addPendingCandidates(senderSocketId, pc);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, [addPendingCandidates]);

  const handleIncomingCandidate = useCallback(async (candidate, senderSocketId) => {
    const pc = peersRef.current.get(senderSocketId);
    if (!pc || !pc.remoteDescription) {
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

    // الانضمام للغرفة فقط إذا لم ننضم مسبقاً (لتجنب الـ Glare عند إعادة رسم الـ useEffect)
    if (!hasJoinedRoom.current) {
      socket.emit('join-room', {
        roomId,
        userId: myId,
        userInfo: { name: user?.name, role: user?.role }
      });
      hasJoinedRoom.current = true;
    }

    const onRoomState = (state) => {
      console.log('🏠 Room state:', state);
      setParticipants(state.users || []);
      setChatMessages(state.chatMessages || []);
      setIsRecording(state.recording || false);
    };

    const onUserJoined = (participant) => {
      console.log('👤 User joined:', participant.userInfo?.name, participant.socketId);
      setParticipants(prev => {
        if (prev.find(p => p.socketId === participant.socketId)) return prev;
        return [...prev, participant];
      });
      toast.success(`${participant.userInfo?.name || 'مستخدم'} انضم للمقابلة`);
      // المستخدم الموجود هو من يُرسل الـ offer للداخل الجديد
      setTimeout(() => createAndSendOffer(participant.socketId), 800);
    };

    const onUserLeft = ({ socketId }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
      setRemoteStreams(prev => { const m = new Map(prev); m.delete(socketId); return m; });
      remoteStreamsRef.current.delete(socketId);
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
      if (msg.userId !== myId) setChatMessages(prev => [...prev, msg]);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isSetupComplete, roomId]);

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
            {networkQuality === 'poor' && connectionStatus !== 'failed' && (
              <div className="flex items-center gap-1 text-orange-400 text-xs font-bold animate-pulse">
                <span>⚠ إنترنت ضعيف</span>
              </div>
            )}
            {(connectionStatus === 'failed' || connectionStatus === 'disconnected') && (
              <div className="flex items-center gap-2">
                <div className="text-red-400 text-xs font-bold">
                  {connectionStatus === 'failed' ? '⚠ فشل الاتصال' : '⚠ انقطع الاتصال'}
                </div>
                <button
                  onClick={() => {
                    // إعادة الاتصال يدوياً: إعادة بناء peer connections من الصفر
                    const peers = Array.from(peersRef.current.keys());
                    peers.forEach(socketId => {
                      peersRef.current.get(socketId)?.close();
                      peersRef.current.delete(socketId);
                    });
                    setConnectionStatus('connecting');
                    setTimeout(() => {
                      participants
                        .filter(p => p.socketId !== socket?.id)
                        .forEach(p => createAndSendOffer(p.socketId));
                    }, 500);
                  }}
                  className="text-[10px] font-black bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg transition-all"
                >
                  إعادة الاتصال
                </button>
              </div>
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
