import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, 
  FaDesktop, FaPhoneSlash, FaComments, FaUsers, FaStickyNote,
  FaSave, FaDownload, FaPaperPlane, FaRecordVinyl, FaStop,
  FaExpand, FaCog, FaShieldAlt
} from 'react-icons/fa';
import { FiX, FiMaximize, FiMinimize, FiMoreHorizontal, FiZap } from 'react-icons/fi';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import './VideoInterview.css';

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
  const [aiQuestions, setAiQuestions] = useState([
    { id: 1, text: "تحدث عن أكبر تحدي تقني واجهته وكيف تغلبت عليه؟", category: "تقني" },
    { id: 2, text: "كيف تتعامل مع ضغوط المواعيد النهائية للمشاريع؟", category: "سلوكي" },
    { id: 3, text: "لماذا تعتقد أنك المرشح الأمثل لهذا الدور الاستراتيجي؟", category: "استراتيجي" }
  ]);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [showControls, setShowControls] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState([]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/smart-interview/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('تم نسخ رابط المقابلة الاستراتيجية بنجاح!');
  };

  // Refs
  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map());
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (user && user.role === 'employer') {
      setIsHost(true);
    }
  }, [user]);

  const queryParams = new URLSearchParams(location.search);
  const jobTitle = queryParams.get('job') || 'مقابلة وظيفية استراتيجية';

  const startLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: video ? { width: 1280, height: 720, frameRate: 30 } : false, 
        audio 
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('تعذر الوصول للكاميرا أو الميكروفون');
      return null;
    }
  }, []);

  // تفعيل الكاميرا تلقائياً للمعاينة
  useEffect(() => {
    startLocalStream();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startLocalStream]);

  // ربط البث بعنصر الفيديو
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isSetupComplete]);

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

    const setupSocketListeners = () => {
      socket.on('room-state', (state) => {
        setParticipants(state.users);
        setChatMessages(state.chatMessages);
        setIsRecording(state.recording);
      });

      socket.on('user-joined', (participant) => {
        setParticipants(prev => [...prev, participant]);
        toast.success(`${participant.userInfo.name} انضم للمقابلة`);
        createOffer(participant.socketId);
      });

      socket.on('user-left', ({ userId, socketId }) => {
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
    };

    setupSocketListeners();

    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
    };
  }, [socket, isSetupComplete, roomId, user]);

  const createPeerConnection = (targetSocketId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, targetSocketId });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev).set(targetSocketId, event.streams[0]));
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    peersRef.current.set(targetSocketId, pc);
    return pc;
  };

  const createOffer = async (targetSocketId) => {
    const pc = createPeerConnection(targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { offer, targetSocketId });
  };

  const handleOffer = async (offer, senderSocketId) => {
    const pc = createPeerConnection(senderSocketId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { answer, targetSocketId: senderSocketId });
  };

  const handleAnswer = async (answer, senderSocketId) => {
    const pc = peersRef.current.get(senderSocketId);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async (candidate, senderSocketId) => {
    const pc = peersRef.current.get(senderSocketId);
    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        videoTrack.onended = () => {
          stopScreenShare();
        };

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('فشل في مشاركة الشاشة');
    }
  };

  const stopScreenShare = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    peersRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    setIsScreenSharing(false);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      socket.emit('start-recording', roomId);
    } else {
      socket.emit('stop-recording', roomId);
    }
    setIsRecording(!isRecording);
  };

  const endInterview = async () => {
    if (window.confirm('هل أنت متأكد من إنهاء هذه الجلسة الاستراتيجية؟ سيتم تحليل البيانات فوراً.')) {
      try {
        const transcript = chatMessages.map(m => `${m.userName}: ${m.message}`).join('\n');
        
        toast.loading('جاري إجراء التحليل الذكي للبيانات...');
        const res = await axios.post('/api/ai/analyze-interview', {
          transcript,
          notes,
          roomId
        });

        if (localStream) localStream.getTracks().forEach(track => track.stop());
        
        // الانتقال لصفحة التقييم مع بيانات التحليل
        navigate(`/interview-feedback/${roomId}`, { state: { aiAnalysis: res.data.data } });
      } catch (error) {
        console.error('Analysis error:', error);
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        navigate(`/interview-feedback/${roomId}`);
      }
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

  if (!isSetupComplete) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 text-white p-4" dir="rtl">
        <div className="absolute inset-0 opacity-20 mesh-bg"></div>
        <div className="glass-card bg-slate-900/80 p-10 max-w-2xl w-full text-center shadow-2xl border-white/10 relative z-10 animate-scale-up">
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow rotate-3">
            <FaShieldAlt size={40} />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">غرفة المقابلة الرقمية</h2>
          <p className="text-slate-400 font-bold mb-10 text-lg">تجهيز بيئة العمل المهنية للمقابلة</p>
          
          <div className="aspect-video bg-black rounded-[2.5rem] mb-10 flex items-center justify-center overflow-hidden border-4 border-slate-800 shadow-inner relative group">
            {localStream ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-700 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <FaVideo size={48} />
                </div>
                <p className="font-black text-sm uppercase tracking-widest">انتظار تفعيل الكاميرا</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">معاينة البث المباشر</span>
            </div>
          </div>
          
          <div className="flex gap-6 justify-center mb-12">
            <button onClick={toggleVideo} className={`w-16 h-16 rounded-2xl transition-all flex items-center justify-center shadow-lg ${isVideoOn ? 'bg-slate-800 text-primary-400 border border-primary-500/30' : 'bg-red-600 text-white'}`}>
              {isVideoOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
            </button>
            <button onClick={toggleMute} className={`w-16 h-16 rounded-2xl transition-all flex items-center justify-center shadow-lg ${isAudioOn ? 'bg-slate-800 text-primary-400 border border-primary-500/30' : 'bg-red-600 text-white'}`}>
              {isAudioOn ? <FaMicrophone size={24} /> : <FaMicrophoneSlash size={24} />}
            </button>
            <button className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 border border-white/10 flex items-center justify-center">
              <FaCog size={24} />
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            <button onClick={handleJoin} className="btn-premium-primary py-5 text-xl font-black shadow-glow flex items-center justify-center gap-3">
              <FaVideo /> دخول الغرفة الآن
            </button>
            <button onClick={() => navigate(-1)} className="text-slate-500 font-bold hover:text-white transition-all text-sm">
              إلغاء والعودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden" dir="rtl">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden group">
        {/* Connection Status */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
          {isHost && (
            <button 
              onClick={handleCopyLink}
              className="bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white px-4 py-2 rounded-2xl border border-primary-500/30 backdrop-blur-md transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
            >
              <FaPaperPlane className="rotate-180" /> نسخ رابط الدعوة
            </button>
          )}
          <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl">
            <div className={`w-2.5 h-2.5 rounded-full ${connectionQuality === 'excellent' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-yellow-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">البث مستقر</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{jobTitle}</span>
          </div>
        </div>

        {/* Video Stage */}
        <div className="flex-1 p-6 pb-32 flex items-center justify-center relative overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center content-center">
            {/* Remote Streams */}
            {Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
              const participant = participants.find(p => p.socketId === socketId);
              return (
                <div key={socketId} className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-white/5 shadow-2xl group/video">
                  <video autoPlay playsInline className="w-full h-full object-cover" ref={el => { if (el) el.srcObject = stream; }} />
                  <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 transform transition-transform group-hover/video:scale-105">
                    <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center text-[10px] font-black">
                      {participant?.userInfo?.avatar || '؟'}
                    </div>
                    <span className="text-xs font-bold">{participant?.userInfo?.name || 'مشارك مجهول'}</span>
                    {isHost && participant?.socketId !== socket?.id && (
                      <button 
                        onClick={() => {
                          if(window.confirm(`هل تريد طرد ${participant?.userInfo?.name}؟`)) {
                            socket.emit('kick-user', { roomId, targetSocketId: socketId });
                          }
                        }}
                        className="w-8 h-8 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all mr-2"
                        title="طرد المشارك"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* If only local stream */}
            {remoteStreams.size === 0 && (
              <div className="md:col-span-2 flex flex-col items-center justify-center p-20 glass-card bg-white/5 border-dashed border-2 border-white/10 rounded-[3rem]">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
                  <FaUsers size={48} className="text-white/20" />
                </div>
                <h3 className="text-2xl font-black text-white/40 mb-2">في انتظار انضمام الطرف الآخر</h3>
                <p className="text-white/20 text-sm font-bold">تم إرسال تنبيه للمشارك بموعد المقابلة</p>
              </div>
            )}

            {/* Local Stream Mini/Float */}
            <div className={`relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-primary-500/20 shadow-2xl transition-all duration-700 ${remoteStreams.size > 0 ? 'md:col-span-1' : 'md:col-span-2'}`}>
              <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`} />
              {!isVideoOn && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-600">
                  <FaVideoSlash size={64} className="mb-4" />
                  <p className="font-black text-xs uppercase tracking-[0.2em]">الكاميرا قيد التعطيل</p>
                </div>
              )}
              <div className="absolute bottom-6 right-6 bg-primary-600/80 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-[10px] font-black text-white">أنت</div>
                <span className="text-xs font-bold">معاينة مخرج البث</span>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Controls */}
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-500 transform studio-controls ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <div className="bg-slate-900/80 backdrop-blur-2xl px-10 py-6 rounded-[2.5rem] flex items-center gap-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button onClick={toggleMute} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isAudioOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white shadow-glow-red'}`}>
              {isAudioOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </button>
            <button onClick={toggleVideo} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white shadow-glow-red'}`}>
              {isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            </button>
            
            <div className="h-10 w-px bg-white/10 mx-2"></div>
            
            <button 
              onClick={toggleScreenShare} 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isScreenSharing ? 'bg-primary-600 text-white shadow-glow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title="مشاركة الشاشة"
            >
              <FaDesktop size={20} />
            </button>
            <button 
              onClick={toggleRecording} 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
            >
              <FaRecordVinyl size={20} />
            </button>
            
            <div className="h-10 w-px bg-white/10 mx-2"></div>
            
            <button onClick={endInterview} className="px-8 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black flex items-center gap-3 shadow-glow-red transition-all">
              <FaPhoneSlash size={20} className="rotate-135" /> إنهاء المقابلة
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Chat & Notes & AI Questions */}
      <div className="w-full md:w-96 bg-slate-900 border-r border-white/5 flex flex-col shadow-2xl relative z-30">
        <div className="flex border-b border-white/5 bg-slate-950/30">
          <button onClick={() => setActiveTab('questions')} className={`flex-1 py-6 font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === 'questions' ? 'text-primary-400' : 'text-slate-500'}`}>
            <FiZap className="inline-block ml-2" /> الأسئلة الذكية
            {activeTab === 'questions' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 shadow-glow-sm"></div>}
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-6 font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === 'chat' ? 'text-primary-400' : 'text-slate-500'}`}>
            <FaComments className="inline-block ml-2" /> المحادثة
            {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 shadow-glow-sm"></div>}
          </button>
          <button onClick={() => setActiveTab('notes')} className={`flex-1 py-6 font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === 'notes' ? 'text-primary-400' : 'text-slate-500'}`}>
            <FaStickyNote className="inline-block ml-2" /> الملاحظات
            {activeTab === 'notes' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 shadow-glow-sm"></div>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'questions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-primary-600/10 border border-primary-500/20 p-5 rounded-[2rem]">
                <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">مساعد الذكاء الاصطناعي</p>
                <p className="text-xs text-slate-300 leading-relaxed font-bold">إليك مجموعة من الأسئلة المقترحة بناءً على تحليل السيرة الذاتية للمرشح:</p>
              </div>
              <div className="space-y-4">
                {aiQuestions.map((q) => (
                  <div key={q.id} className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-primary-600/20 text-primary-400 rounded-md">{q.category}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-200 leading-relaxed">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6 animate-fade-in">
              {chatMessages.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center opacity-20">
                  <FaComments size={32} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">المحادثة فارغة</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.userId === user?._id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-slate-500 mb-1 px-2">{msg.userName}</span>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium ${msg.userId === user?._id ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="h-full animate-fade-in">
              <textarea 
                className="w-full h-full min-h-[400px] bg-white/5 border border-white/10 rounded-[2rem] p-8 text-sm font-bold leading-relaxed focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none placeholder-slate-700 text-primary-100 shadow-inner"
                placeholder="ابدأ بتدوين ملاحظاتك الاستراتيجية هنا..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        {activeTab === 'chat' && (
          <div className="p-6 bg-slate-950/50 border-t border-white/5">
            <div className="relative">
              <input 
                type="text" 
                className="w-full bg-white/5 border-2 border-white/5 focus:border-primary-500/50 rounded-2xl py-4 pr-6 pl-14 text-sm font-bold transition-all"
                placeholder="أرسل رسالة..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-all shadow-glow-sm">
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
