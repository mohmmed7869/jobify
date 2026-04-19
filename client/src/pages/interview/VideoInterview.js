import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ICE Server configuration - using multiple STUN servers for reliability
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

const VideoInterview = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [aiQuestions] = useState([
    { id: 1, text: "تحدث عن أكبر تحدي تقني واجهته وكيف تغلبت عليه؟", category: "تقني" },
    { id: 2, text: "كيف تتعامل مع ضغوط المواعيد النهائية للمشاريع؟", category: "سلوكي" },
    { id: 3, text: "لماذا تعتقد أنك المرشح الأمثل لهذا الدور الاستراتيجي؟", category: "استراتيجي" }
  ]);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null); // use ref to avoid stale closure issues
  const peersRef = useRef(new Map());
  const chatEndRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  const queryParams = new URLSearchParams(location.search);
  const jobTitle = queryParams.get('job') || 'مقابلة وظيفية';

  // Call duration timer
  useEffect(() => {
    if (!isSetupComplete) return;
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, [isSetupComplete]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (user?.role === 'employer' || user?.role === 'company') {
      setIsHost(true);
    }
  }, [user]);

  const startLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false, 
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('يرجى السماح بالوصول للكاميرا والميكروفون');
      } else {
        toast.error('تعذر الوصول للكاميرا أو الميكروفون');
      }
      return null;
    }
  }, []);

  // Start camera preview in setup screen
  useEffect(() => {
    startLocalStream();
    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [startLocalStream]);

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isSetupComplete]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Create peer connection
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peersRef.current.has(targetSocketId)) {
      peersRef.current.get(targetSocketId).close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { 
          candidate: event.candidate, 
          targetSocketId 
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from:', targetSocketId);
      setRemoteStreams(prev => new Map(prev).set(targetSocketId, event.streams[0]));
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE state for ${targetSocketId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    // Add local tracks to peer connection
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    peersRef.current.set(targetSocketId, pc);
    return pc;
  }, [socket]);

  const createOffer = useCallback(async (targetSocketId) => {
    try {
      const pc = createPeerConnection(targetSocketId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      socket.emit('offer', { offer, targetSocketId });
      console.log('Offer sent to:', targetSocketId);
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection, socket]);

  const handleOffer = useCallback(async (offer, senderSocketId) => {
    try {
      const pc = createPeerConnection(senderSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { answer, targetSocketId: senderSocketId });
      console.log('Answer sent to:', senderSocketId);
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, socket]);

  const handleAnswer = useCallback(async (answer, senderSocketId) => {
    try {
      const pc = peersRef.current.get(senderSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Answer received from:', senderSocketId);
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate, senderSocketId) => {
    try {
      const pc = peersRef.current.get(senderSocketId);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, []);

  // Socket event listeners - only after setup is complete
  useEffect(() => {
    if (!socket || !isSetupComplete) return;

    socket.emit('join-room', {
      roomId,
      userId: user?._id,
      userInfo: {
        name: user?.name,
        role: user?.role,
        avatar: user?.name?.charAt(0)
      }
    });

    socket.on('room-state', (state) => {
      setParticipants(state.users || []);
      setChatMessages(state.chatMessages || []);
      setIsRecording(state.recording || false);
    });

    socket.on('user-joined', (participant) => {
      setParticipants(prev => [...prev, participant]);
      toast.success(`${participant.userInfo?.name || 'مستخدم'} انضم للمقابلة`);
      // Small delay to ensure both sides are ready
      setTimeout(() => createOffer(participant.socketId), 500);
    });

    socket.on('user-left', ({ socketId }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(socketId);
        return newStreams;
      });
      if (peersRef.current.has(socketId)) {
        peersRef.current.get(socketId).close();
        peersRef.current.delete(socketId);
      }
      toast('مشارك غادر الغرفة', { icon: '👋' });
    });

    socket.on('offer', async ({ offer, senderSocketId }) => {
      await handleOffer(offer, senderSocketId);
    });

    socket.on('answer', async ({ answer, senderSocketId }) => {
      await handleAnswer(answer, senderSocketId);
    });

    socket.on('ice-candidate', async ({ candidate, senderSocketId }) => {
      await handleIceCandidate(candidate, senderSocketId);
    });

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
    };
  }, [socket, isSetupComplete, roomId, user, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach(track => { track.enabled = !isVideoOn; });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(track => { track.enabled = !isAudioOn; });
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        videoTrack.onended = () => stopScreenShare();
        setIsScreenSharing(true);
        toast.success('تم بدء مشاركة الشاشة');
      } else {
        stopScreenShare();
      }
    } catch (error) {
      if (error.name !== 'AbortError') toast.error('فشل في مشاركة الشاشة');
    }
  };

  const stopScreenShare = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) sender.replaceTrack(videoTrack);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    }
    setIsScreenSharing(false);
  };

  const endInterview = async () => {
    if (!window.confirm('هل أنت متأكد من إنهاء المقابلة؟')) return;
    try {
      const transcript = chatMessages.map(m => `${m.userName || m.userInfo?.name}: ${m.message}`).join('\n');
      const loadingToast = toast.loading('جاري تحليل البيانات...');
      const res = await axios.post('/api/ai/analyze-interview', { transcript, notes, roomId }).catch(() => null);
      toast.dismiss(loadingToast);
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peersRef.current.forEach(pc => pc.close());
      navigate(`/interview-feedback/${roomId}`, { state: { aiAnalysis: res?.data?.data } });
    } catch (error) {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peersRef.current.forEach(pc => pc.close());
      navigate(`/interview-feedback/${roomId}`);
    }
  };

  const handleJoin = async () => {
    const stream = await startLocalStream();
    if (stream) setIsSetupComplete(true);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket) return;
    const messageData = {
      roomId,
      userId: user?._id,
      userName: user?.name,
      message: messageInput,
      timestamp: new Date()
    };
    socket.emit('chat-message', messageData);
    setChatMessages(prev => [...prev, messageData]);
    setMessageInput('');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/smart-interview/${roomId}`;
    navigator.clipboard.writeText(link).then(() => toast.success('تم نسخ رابط المقابلة!'));
  };

  // Attach remote streams to video elements
  const RemoteVideo = ({ stream, socketId }) => {
    const videoRef = useRef(null);
    const participant = participants.find(p => p.socketId === socketId);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-xl text-white text-xs font-bold flex items-center gap-2">
          <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center text-[10px] font-black">
            {participant?.userInfo?.avatar || '؟'}
          </div>
          {participant?.userInfo?.name || 'مشارك'}
        </div>
      </div>
    );
  };

  // ========== SETUP SCREEN ==========
  if (!isSetupComplete) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 text-white p-4" dir="rtl">
        <div className="w-full max-w-lg bg-slate-900 rounded-3xl p-8 text-center shadow-2xl border border-white/10">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaShieldAlt size={32} />
          </div>
          <h2 className="text-3xl font-black mb-2">غرفة المقابلة</h2>
          <p className="text-slate-400 mb-6 text-sm">{jobTitle}</p>

          {/* Video preview */}
          <div className="aspect-video bg-black rounded-2xl mb-6 overflow-hidden border border-slate-800 relative">
            {localStream ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                <FaVideo size={48} className="mb-3" />
                <p className="text-sm font-bold">جاري تفعيل الكاميرا...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-slate-800 text-primary-400 border border-slate-700' : 'bg-red-600 text-white'}`}
            >
              {isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            </button>
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isAudioOn ? 'bg-slate-800 text-primary-400 border border-slate-700' : 'bg-red-600 text-white'}`}
            >
              {isAudioOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </button>
          </div>

          <button
            onClick={handleJoin}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl text-lg transition-all flex items-center justify-center gap-3"
          >
            <FaVideo /> دخول الغرفة
          </button>
          <button onClick={() => navigate(-1)} className="mt-3 w-full py-3 text-slate-500 hover:text-white transition-all text-sm font-bold">
            إلغاء والعودة
          </button>
        </div>
      </div>
    );
  }

  // ========== MAIN INTERVIEW ROOM ==========
  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex overflow-hidden" dir="rtl">
      
      {/* ===== Main Video Area ===== */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        
        {/* Top Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-white/5 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">مباشر</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
              <FiClock size={12} />
              {formatDuration(callDuration)}
            </div>
          </div>
          <span className="text-xs text-slate-500 font-bold truncate max-w-[200px]">{jobTitle}</span>
          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={handleCopyLink}
                className="text-[10px] font-black uppercase tracking-widest bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white px-3 py-1.5 rounded-xl border border-primary-500/30 transition-all"
              >
                نسخ رابط الدعوة
              </button>
            )}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <FaComments size={14} />
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-hidden p-3">
          <div className={`h-full grid gap-3 ${
            remoteStreams.size === 0 ? 'grid-cols-1' :
            remoteStreams.size === 1 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-2'
          } content-center`}>
            
            {/* Remote Videos */}
            {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
              <RemoteVideo key={socketId} stream={stream} socketId={socketId} />
            ))}

            {/* Waiting state */}
            {remoteStreams.size === 0 && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <FaUsers size={32} className="text-white/20" />
                </div>
                <h3 className="text-lg font-black text-white/40 mb-1">في انتظار الطرف الآخر</h3>
                <p className="text-white/20 text-xs font-bold">شارك رابط المقابلة للطرف الآخر</p>
                {isHost && (
                  <button
                    onClick={handleCopyLink}
                    className="mt-4 px-6 py-2 bg-primary-600/30 hover:bg-primary-600 text-primary-300 hover:text-white border border-primary-500/30 rounded-xl text-xs font-black transition-all"
                  >
                    نسخ رابط الدعوة
                  </button>
                )}
              </div>
            )}

            {/* Local Video */}
            <div className={`relative bg-slate-900 rounded-2xl overflow-hidden ${
              remoteStreams.size > 0 ? 'aspect-video' : 'aspect-video max-w-md mx-auto w-full'
            } border border-primary-500/20`}>
              <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`} />
              {!isVideoOn && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-600">
                  <FaVideoSlash size={48} className="mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">الكاميرا معطلة</p>
                </div>
              )}
              <div className="absolute bottom-3 right-3 bg-primary-600/80 backdrop-blur px-3 py-1 rounded-xl text-white text-xs font-bold">
                أنت
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 md:gap-4 px-4 py-4 bg-slate-900/80 backdrop-blur border-t border-white/5">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isAudioOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 text-white'}`}
            title={isAudioOn ? 'كتم الميكروفون' : 'تفعيل الميكروفون'}
          >
            {isAudioOn ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
          </button>
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 text-white'}`}
            title={isVideoOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          >
            {isVideoOn ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isScreenSharing ? 'bg-primary-600' : 'bg-white/10 hover:bg-white/20'}`}
            title="مشاركة الشاشة"
          >
            <FaDesktop size={18} />
          </button>
          <button
            onClick={() => {
              if (!isRecording) socket.emit('start-recording', roomId);
              else socket.emit('stop-recording', roomId);
              setIsRecording(!isRecording);
            }}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
            title={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
          >
            <FaRecordVinyl size={18} />
          </button>
          <div className="w-px h-8 bg-white/10 mx-1" />
          <button
            onClick={endInterview}
            className="h-12 md:h-14 px-5 md:px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black flex items-center gap-2 shadow-lg transition-all"
          >
            <FaPhoneSlash size={16} />
            <span className="hidden sm:inline text-sm">إنهاء</span>
          </button>
        </div>
      </div>

      {/* ===== Sidebar ===== */}
      <div className={`flex-shrink-0 w-full md:w-80 lg:w-96 bg-slate-900 border-r border-white/5 flex flex-col transition-all duration-300 ${
        showSidebar ? 'flex' : 'hidden md:flex'
      } absolute md:relative inset-0 md:inset-auto z-20 md:z-auto`}>
        
        {/* Sidebar Close on mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5">
          <span className="font-black text-sm">لوحة المقابلة</span>
          <button onClick={() => setShowSidebar(false)} className="p-2 rounded-xl bg-white/10">
            <FiX size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-slate-950/30 flex-shrink-0">
          {[
            { id: 'questions', icon: <FiZap />, label: 'الأسئلة' },
            { id: 'chat', icon: <FaComments />, label: 'المحادثة' },
            { id: 'notes', icon: <FaStickyNote />, label: 'الملاحظات' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest transition-all relative flex items-center justify-center gap-1.5 ${
                activeTab === tab.id ? 'text-primary-400' : 'text-slate-500'
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="bg-primary-600/10 border border-primary-500/20 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">مساعد ذكاء اصطناعي</p>
                <p className="text-xs text-slate-300 leading-relaxed">أسئلة مقترحة بناءً على طبيعة المقابلة:</p>
              </div>
              {aiQuestions.map((q) => (
                <div key={q.id} className="p-4 bg-white/5 hover:bg-white/8 rounded-2xl border border-white/5 transition-all">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded-md mb-2 inline-block">{q.category}</span>
                  <p className="text-sm font-bold text-slate-200 leading-relaxed">{q.text}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              {chatMessages.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center opacity-30">
                  <FaComments size={28} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">المحادثة فارغة</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${(msg.userId || msg.senderId) === user?._id ? 'items-start' : 'items-end'}`}>
                    <span className="text-[9px] font-black text-slate-500 mb-1 px-2">
                      {msg.userName || msg.userInfo?.name || 'مجهول'}
                    </span>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium ${
                      (msg.userId || msg.senderId) === user?._id
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
          )}

          {activeTab === 'notes' && (
            <textarea
              className="w-full h-full min-h-[300px] bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold leading-relaxed focus:ring-2 focus:ring-primary-500 outline-none resize-none placeholder-slate-700 text-primary-100"
              placeholder="اكتب ملاحظاتك هنا..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}
        </div>

        {/* Chat Input */}
        {activeTab === 'chat' && (
          <div className="flex-shrink-0 p-4 bg-slate-950/50 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-white/5 border border-white/10 focus:border-primary-500/50 rounded-xl py-3 px-4 text-sm font-bold transition-all outline-none"
                placeholder="أرسل رسالة..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="w-11 h-11 bg-primary-600 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-all"
              >
                <FaPaperPlane size={14} className="rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInterview;
