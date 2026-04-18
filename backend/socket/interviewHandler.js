const OpenAI = require('openai');
const axios = require('axios');
const crypto = require('crypto');

// Store active rooms and users
const rooms = new Map();
const users = new Map();

const interviewHandler = (io) => {
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
  });

  io.on('connection', (socket) => {
    console.log('User connected to interview socket:', socket.id);

    // Join room
    socket.on('join-room', (data) => {
      const { roomId, userId, userInfo } = data;
      
      socket.join(roomId);
      socket.userId = userId;
      socket.roomId = roomId;
      
      // Store user info
      users.set(socket.id, {
        userId,
        userInfo,
        socketId: socket.id,
        accessibilitySettings: data.accessibilitySettings || {}
      });
      
      // Initialize room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Map(),
          startTime: new Date(),
          recording: false,
          chatMessages: [],
          platform: data.platform || 'webrtc',
          accessibilityFeatures: data.accessibilityFeatures || {
            closedCaptions: false,
            signLanguage: false,
            highContrast: false,
            textToSpeech: false
          }
        });
      }
      
      const room = rooms.get(roomId);
      room.users.set(socket.id, {
        userId,
        userInfo,
        socketId: socket.id,
        joinTime: new Date(),
        accessibilitySettings: data.accessibilitySettings || {}
      });
      
      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId,
        userInfo,
        socketId: socket.id,
        accessibilitySettings: data.accessibilitySettings || {}
      });
      
      // Send current room state to new user
      const roomUsers = Array.from(room.users.values());
      socket.emit('room-state', {
        users: roomUsers,
        chatMessages: room.chatMessages,
        recording: room.recording,
        platform: room.platform,
        accessibilityFeatures: room.accessibilityFeatures
      });
      
      console.log(`User ${userId} joined room ${roomId}`);
    });
    
    // WebRTC Signaling
    socket.on('offer', (data) => {
      const { offer, targetSocketId } = data;
      socket.to(targetSocketId).emit('offer', {
        offer,
        senderSocketId: socket.id
      });
    });
    
    socket.on('answer', (data) => {
      const { answer, targetSocketId } = data;
      socket.to(targetSocketId).emit('answer', {
        answer,
        senderSocketId: socket.id
      });
    });
    
    socket.on('ice-candidate', (data) => {
      const { candidate, targetSocketId } = data;
      socket.to(targetSocketId).emit('ice-candidate', {
        candidate,
        senderSocketId: socket.id
      });
    });
    
    // Chat message
    socket.on('chat-message', (data) => {
      const { message, roomId } = data;
      const user = users.get(socket.id);
      
      if (user && rooms.has(roomId)) {
        const chatMessage = {
          id: Date.now(),
          userId: user.userId,
          userInfo: user.userInfo,
          message,
          timestamp: new Date(),
          type: 'text'
        };
        
        rooms.get(roomId).chatMessages.push(chatMessage);
        
        // Broadcast to all users in room
        io.to(roomId).emit('chat-message', chatMessage);
        
        // Accessibility features: closed captions
        const room = rooms.get(roomId);
        if (room.accessibilityFeatures.closedCaptions) {
          io.to(roomId).emit('caption', {
            text: `${user.userInfo.name}: ${message}`,
            userId: user.userId,
            timestamp: new Date()
          });
        }
      }
    });

    // Toggle audio/video
    socket.on('toggle-audio', (data) => {
      const { roomId, enabled } = data;
      socket.to(roomId).emit('user-audio-toggle', {
        userId: socket.userId,
        socketId: socket.id,
        enabled
      });
    });

    socket.on('toggle-video', (data) => {
      const { roomId, enabled } = data;
      socket.to(roomId).emit('user-video-toggle', {
        userId: socket.userId,
        socketId: socket.id,
        enabled
      });
    });

    // Recording control
    socket.on('start-recording', (roomId) => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).recording = true;
        io.to(roomId).emit('recording-started', {
          startedBy: socket.userId,
          timestamp: new Date()
        });
      }
    });

    socket.on('stop-recording', (roomId) => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).recording = false;
        io.to(roomId).emit('recording-stopped', {
          stoppedBy: socket.userId,
          timestamp: new Date()
        });
      }
    });

    // AI Analysis request
    socket.on('request-ai-analysis', async (data) => {
      const { roomId, analysisType, interviewData } = data;
      try {
        const analysis = await analyzeInterview(openai, analysisType, interviewData);
        socket.emit('ai-analysis-result', {
          type: analysisType,
          result: analysis,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('ai-analysis-error', {
          error: 'فشل في تحليل البيانات',
          timestamp: new Date()
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('User disconnected from interview socket:', socket.id);
      
      const user = users.get(socket.id);
      if (user && socket.roomId) {
        if (rooms.has(socket.roomId)) {
          const room = rooms.get(socket.roomId);
          room.users.delete(socket.id);
          
          socket.to(socket.roomId).emit('user-left', {
            userId: user.userId,
            socketId: socket.id
          });
          
          if (room.users.size === 0) {
            rooms.delete(socket.roomId);
          }
        }
      }
      users.delete(socket.id);
    });
  });
};

// AI Analysis helper (migrated from EnhancedVideoInterviewSystem)
async function analyzeInterview(openai, analysisType, interviewData) {
  // Simplified for this handler, can be expanded like in the original file
  const { transcript } = interviewData || {};
  
  if (!transcript) return { error: 'No transcript provided' };

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in analyzing job interviews.'
        },
        {
          role: 'user',
          content: `Analyze the following interview data for ${analysisType}: ${JSON.stringify(interviewData)}`
        }
      ],
      max_tokens: 500,
    });
    
    return {
      type: analysisType,
      analysis: completion.choices[0].message.content,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('AI Analysis error:', error);
    throw error;
  }
}

module.exports = { interviewHandler, rooms, users };
