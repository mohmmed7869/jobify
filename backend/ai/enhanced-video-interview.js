/**
 * Enhanced Video Interview System
 * Provides improved video interview functionality with support for accessibility features,
 * multiple platforms (including Zoom integration), and specialized assistance for different user groups.
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

class EnhancedVideoInterviewSystem {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Initialize OpenAI for interview analysis
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
    });
    
    // Store active rooms and users
    this.rooms = new Map();
    this.users = new Map();
    
    // Zoom API credentials (from environment variables)
    this.zoomConfig = {
      apiKey: process.env.ZOOM_API_KEY,
      apiSecret: process.env.ZOOM_API_SECRET,
      userId: process.env.ZOOM_USER_ID
    };
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup socket handlers
    this.setupSocketHandlers();
    
    // Setup API routes
    this.setupApiRoutes();
  }
  
  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.static(path.join(__dirname, '..')));
  }
  
  /**
   * Setup Socket.IO event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      // Join room
      socket.on('join-room', (data) => {
        const { roomId, userId, userInfo } = data;
        
        socket.join(roomId);
        socket.userId = userId;
        socket.roomId = roomId;
        
        // Store user info
        this.users.set(socket.id, {
          userId,
          userInfo,
          socketId: socket.id,
          accessibilitySettings: data.accessibilitySettings || {}
        });
        
        // Initialize room if doesn't exist
        if (!this.rooms.has(roomId)) {
          this.rooms.set(roomId, {
            id: roomId,
            users: new Map(),
            startTime: new Date(),
            recording: false,
            chatMessages: [],
            platform: data.platform || 'webrtc', // 'webrtc', 'zoom', or 'teams'
            accessibilityFeatures: data.accessibilityFeatures || {
              closedCaptions: false,
              signLanguage: false,
              highContrast: false,
              textToSpeech: false
            }
          });
        }
        
        const room = this.rooms.get(roomId);
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
        const user = this.users.get(socket.id);
        
        if (user && this.rooms.has(roomId)) {
          const chatMessage = {
            id: Date.now(),
            userId: user.userId,
            userInfo: user.userInfo,
            message,
            timestamp: new Date(),
            type: 'text'
          };
          
          this.rooms.get(roomId).chatMessages.push(chatMessage);
          
          // Broadcast to all users in room
          this.io.to(roomId).emit('chat-message', chatMessage);
          
          // If closed captions are enabled, send as caption too
          const room = this.rooms.get(roomId);
          if (room.accessibilityFeatures.closedCaptions) {
            this.io.to(roomId).emit('caption', {
              text: `${user.userInfo.name}: ${message}`,
              userId: user.userId,
              timestamp: new Date()
            });
          }
        }
      });
      
      // Accessibility features
      socket.on('toggle-accessibility-feature', (data) => {
        const { roomId, feature, enabled } = data;
        
        if (this.rooms.has(roomId)) {
          const room = this.rooms.get(roomId);
          room.accessibilityFeatures[feature] = enabled;
          
          // Notify all users in the room
          this.io.to(roomId).emit('accessibility-feature-changed', {
            feature,
            enabled,
            changedBy: socket.userId
          });
          
          console.log(`Accessibility feature ${feature} ${enabled ? 'enabled' : 'disabled'} in room ${roomId}`);
        }
      });
      
      // User accessibility settings
      socket.on('update-accessibility-settings', (data) => {
        const { settings } = data;
        const user = this.users.get(socket.id);
        
        if (user) {
          user.accessibilitySettings = settings;
          
          // Notify others in the room
          if (socket.roomId && this.rooms.has(socket.roomId)) {
            socket.to(socket.roomId).emit('user-accessibility-settings-updated', {
              userId: user.userId,
              socketId: socket.id,
              accessibilitySettings: settings
            });
          }
        }
      });
      
      // Speech-to-text
      socket.on('speech-to-text', async (data) => {
        const { audio, roomId, language } = data;
        
        try {
          // In a real implementation, this would call a speech-to-text service
          // For now, we'll simulate it
          const text = await this.simulateSpeechToText(audio, language);
          
          socket.emit('speech-to-text-result', {
            text,
            timestamp: new Date()
          });
          
          // If closed captions are enabled, broadcast to all users
          const room = this.rooms.get(roomId);
          if (room && room.accessibilityFeatures.closedCaptions) {
            const user = this.users.get(socket.id);
            this.io.to(roomId).emit('caption', {
              text: `${user.userInfo.name}: ${text}`,
              userId: user.userId,
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Speech-to-text error:', error);
          socket.emit('speech-to-text-error', {
            error: 'Failed to process speech',
            timestamp: new Date()
          });
        }
      });
      
      // Platform-specific events
      socket.on('switch-platform', async (data) => {
        const { roomId, platform, platformSettings } = data;
        
        if (this.rooms.has(roomId)) {
          const room = this.rooms.get(roomId);
          const oldPlatform = room.platform;
          room.platform = platform;
          
          // Handle platform-specific setup
          let platformData = {};
          
          if (platform === 'zoom') {
            try {
              platformData = await this.createZoomMeeting(roomId, platformSettings);
            } catch (error) {
              console.error('Error creating Zoom meeting:', error);
              socket.emit('platform-switch-error', {
                error: 'Failed to create Zoom meeting',
                platform
              });
              return;
            }
          }
          
          // Notify all users in the room
          this.io.to(roomId).emit('platform-switched', {
            oldPlatform,
            newPlatform: platform,
            platformData,
            changedBy: socket.userId
          });
          
          console.log(`Room ${roomId} switched from ${oldPlatform} to ${platform}`);
        }
      });
      
      // Interview AI analysis
      socket.on('request-interview-analysis', async (data) => {
        const { roomId, analysisType, interviewData } = data;
        
        try {
          const analysis = await this.analyzeInterview(analysisType, interviewData);
          
          socket.emit('interview-analysis-result', {
            type: analysisType,
            result: analysis,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Interview analysis error:', error);
          socket.emit('interview-analysis-error', {
            error: 'Failed to analyze interview',
            type: analysisType,
            timestamp: new Date()
          });
        }
      });
      
      // Disconnect handling
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        const user = this.users.get(socket.id);
        if (user && socket.roomId) {
          // Remove from room
          if (this.rooms.has(socket.roomId)) {
            const room = this.rooms.get(socket.roomId);
            room.users.delete(socket.id);
            
            // Notify others
            socket.to(socket.roomId).emit('user-left', {
              userId: user.userId,
              socketId: socket.id
            });
            
            // Clean up empty rooms
            if (room.users.size === 0) {
              // If it's a Zoom room, end the meeting
              if (room.platform === 'zoom' && room.zoomMeetingId) {
                this.endZoomMeeting(room.zoomMeetingId).catch(err => {
                  console.error('Error ending Zoom meeting:', err);
                });
              }
              
              this.rooms.delete(socket.roomId);
            }
          }
        }
        
        this.users.delete(socket.id);
      });
    });
  }
  
  /**
   * Setup API routes
   */
  setupApiRoutes() {
    // Get active rooms
    this.app.get('/api/rooms', (req, res) => {
      const roomList = Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        userCount: room.users.size,
        startTime: room.startTime,
        recording: room.recording,
        platform: room.platform,
        accessibilityFeatures: room.accessibilityFeatures
      }));
      
      res.json(roomList);
    });
    
    // Get room details
    this.app.get('/api/rooms/:roomId', (req, res) => {
      const { roomId } = req.params;
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      res.json({
        id: room.id,
        users: Array.from(room.users.values()).map(user => ({
          userId: user.userId,
          userInfo: user.userInfo,
          joinTime: user.joinTime,
          accessibilitySettings: user.accessibilitySettings
        })),
        startTime: room.startTime,
        recording: room.recording,
        platform: room.platform,
        accessibilityFeatures: room.accessibilityFeatures,
        messageCount: room.chatMessages.length
      });
    });
    
    // Create a new room
    this.app.post('/api/rooms', (req, res) => {
      const { roomId, createdBy, platform, accessibilityFeatures } = req.body;
      
      if (this.rooms.has(roomId)) {
        return res.status(400).json({ error: 'Room already exists' });
      }
      
      const room = {
        id: roomId,
        users: new Map(),
        startTime: new Date(),
        recording: false,
        chatMessages: [],
        createdBy,
        platform: platform || 'webrtc',
        accessibilityFeatures: accessibilityFeatures || {
          closedCaptions: false,
          signLanguage: false,
          highContrast: false,
          textToSpeech: false
        }
      };
      
      this.rooms.set(roomId, room);
      
      res.json({ 
        success: true, 
        room: { 
          id: roomId, 
          startTime: room.startTime,
          platform: room.platform,
          accessibilityFeatures: room.accessibilityFeatures
        } 
      });
    });
    
    // Create a Zoom meeting
    this.app.post('/api/zoom/meetings', async (req, res) => {
      try {
        const { topic, duration, startTime, agenda } = req.body;
        
        const meeting = await this.createZoomMeeting(crypto.randomUUID(), {
          topic,
          duration,
          startTime,
          agenda
        });
        
        res.json({
          success: true,
          meeting
        });
      } catch (error) {
        console.error('Error creating Zoom meeting:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create Zoom meeting',
          details: error.message
        });
      }
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        activeRooms: this.rooms.size,
        activeUsers: this.users.size,
        platforms: {
          webrtc: Array.from(this.rooms.values()).filter(room => room.platform === 'webrtc').length,
          zoom: Array.from(this.rooms.values()).filter(room => room.platform === 'zoom').length,
          teams: Array.from(this.rooms.values()).filter(room => room.platform === 'teams').length
        }
      });
    });
  }
  
  /**
   * Start the server
   */
  start(port = 3001) {
    this.server.listen(port, () => {
      console.log(`🚀 Enhanced Video Interview System running on port ${port}`);
      console.log(`📹 Video calls available at http://localhost:${port}`);
    });
  }
  
  /**
   * Create a Zoom meeting
   */
  async createZoomMeeting(roomId, settings = {}) {
    if (!this.zoomConfig.apiKey || !this.zoomConfig.apiSecret || !this.zoomConfig.userId) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      // Generate JWT token for Zoom API
      const payload = {
        iss: this.zoomConfig.apiKey,
        exp: Math.floor(Date.now() / 1000) + 60 * 60
      };
      
      const token = this.generateJWT(payload, this.zoomConfig.apiSecret);
      
      // Create Zoom meeting
      const response = await axios.post(
        `https://api.zoom.us/v2/users/${this.zoomConfig.userId}/meetings`,
        {
          topic: settings.topic || `Interview Room ${roomId}`,
          type: 2, // Scheduled meeting
          start_time: settings.startTime || new Date().toISOString(),
          duration: settings.duration || 60,
          timezone: 'UTC',
          agenda: settings.agenda || 'Job Interview',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: false,
            auto_recording: 'cloud',
            waiting_room: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const meetingData = response.data;
      
      // Store Zoom meeting info in the room
      if (this.rooms.has(roomId)) {
        const room = this.rooms.get(roomId);
        room.zoomMeetingId = meetingData.id;
        room.zoomJoinUrl = meetingData.join_url;
        room.zoomStartUrl = meetingData.start_url;
      }
      
      return {
        meetingId: meetingData.id,
        joinUrl: meetingData.join_url,
        startUrl: meetingData.start_url,
        password: meetingData.password,
        topic: meetingData.topic,
        startTime: meetingData.start_time,
        duration: meetingData.duration
      };
      
    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      throw new Error('Failed to create Zoom meeting');
    }
  }
  
  /**
   * End a Zoom meeting
   */
  async endZoomMeeting(meetingId) {
    if (!this.zoomConfig.apiKey || !this.zoomConfig.apiSecret) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      // Generate JWT token for Zoom API
      const payload = {
        iss: this.zoomConfig.apiKey,
        exp: Math.floor(Date.now() / 1000) + 60 * 60
      };
      
      const token = this.generateJWT(payload, this.zoomConfig.apiSecret);
      
      // End Zoom meeting
      await axios.put(
        `https://api.zoom.us/v2/meetings/${meetingId}/status`,
        {
          action: 'end'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return true;
      
    } catch (error) {
      console.error('Error ending Zoom meeting:', error.response?.data || error.message);
      throw new Error('Failed to end Zoom meeting');
    }
  }
  
  /**
   * Generate JWT token for Zoom API
   */
  generateJWT(payload, secret) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  /**
   * Simulate speech-to-text conversion
   * In a real implementation, this would call a speech-to-text service
   */
  async simulateSpeechToText(audio, language = 'ar') {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // This is just a placeholder - in a real implementation, you would
    // send the audio to a speech-to-text service like Google Cloud Speech-to-Text
    return 'هذا نص تجريبي من خدمة تحويل الكلام إلى نص';
  }
  
  /**
   * Analyze interview using AI
   */
  async analyzeInterview(analysisType, interviewData) {
    try {
      switch (analysisType) {
        case 'sentiment':
          return this.analyzeSentiment(interviewData);
          
        case 'communication':
          return this.analyzeCommunication(interviewData);
          
        case 'technical':
          return this.analyzeTechnicalSkills(interviewData);
          
        case 'overall':
          return this.analyzeOverall(interviewData);
          
        default:
          throw new Error('Unknown analysis type');
      }
    } catch (error) {
      console.error(`Error in ${analysisType} analysis:`, error);
      throw error;
    }
  }
  
  /**
   * Analyze sentiment in interview
   */
  async analyzeSentiment(interviewData) {
    const { transcript } = interviewData;
    
    try {
      // Use OpenAI for sentiment analysis
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in analyzing job interview sentiment. Analyze the following interview transcript and provide sentiment analysis with confidence score, details, and insights.'
          },
          {
            role: 'user',
            content: `Analyze the sentiment in this interview transcript: ${transcript}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
      
      const analysis = completion.choices[0].message.content;
      
      // Parse the analysis (in a real implementation, you would structure this better)
      return {
        overall: 'إيجابي',
        confidence: 85,
        details: {
          positive: 60,
          neutral: 25,
          negative: 15
        },
        insights: [
          'المرشح يظهر حماساً واضحاً للوظيفة',
          'التواصل إيجابي ومهني',
          'يحتاج لمزيد من الثقة في بعض الإجابات'
        ],
        rawAnalysis: analysis
      };
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }
  
  /**
   * Analyze communication skills
   */
  async analyzeCommunication(interviewData) {
    const { transcript, audioFeatures } = interviewData;
    
    // In a real implementation, this would analyze communication patterns
    return {
      score: 78,
      clarity: 82,
      confidence: 75,
      engagement: 80,
      insights: [
        'وضوح في التعبير جيد',
        'يحتاج لتحسين الثقة بالنفس',
        'تفاعل جيد مع الأسئلة'
      ]
    };
  }
  
  /**
   * Analyze technical skills
   */
  async analyzeTechnicalSkills(interviewData) {
    const { answers } = interviewData;
    
    // In a real implementation, this would analyze technical knowledge
    return {
      score: 72,
      knowledge: 75,
      problemSolving: 70,
      experience: 68,
      insights: [
        'معرفة تقنية جيدة',
        'يحتاج لمزيد من الخبرة العملية',
        'قدرة جيدة على حل المشاكل'
      ]
    };
  }
  
  /**
   * Analyze overall interview performance
   */
  async analyzeOverall(interviewData) {
    // In a real implementation, this would provide a comprehensive analysis
    return {
      recommendation: 'مرشح واعد',
      score: 76,
      strengths: [
        'تواصل جيد',
        'حماس للتعلم',
        'معرفة تقنية مناسبة'
      ],
      improvements: [
        'تطوير الثقة بالنفس',
        'اكتساب مزيد من الخبرة العملية',
        'تحسين مهارات العرض'
      ],
      nextSteps: [
        'مقابلة تقنية متقدمة',
        'اختبار عملي',
        'مراجعة المراجع'
      ]
    };
  }
}

module.exports = EnhancedVideoInterviewSystem;

// If this file is run directly
if (require.main === module) {
  const videoSystem = new EnhancedVideoInterviewSystem();
  videoSystem.start(process.env.PORT || 3001);
}