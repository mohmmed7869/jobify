// Store active rooms and users
const rooms = new Map();
const users = new Map();

const setupInterviewSocket = (socket, io) => {
    console.log('User connected to interview socket:', socket.id);

    // Join room
    socket.on('join-room', (data) => {
      const { roomId, userId, userInfo } = data;
      
      socket.join(roomId);
      socket.userId = userId;
      socket.roomId = roomId;
      
      // Store user info
      users.set(socket.id, { userId, userInfo, socketId: socket.id });
      
      // Initialize room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Map(),
          startTime: new Date(),
          recording: false,
          chatMessages: []
        });
      }
      
      const room = rooms.get(roomId);
      room.users.set(socket.id, { userId, userInfo, socketId: socket.id, joinTime: new Date() });
      
      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId,
        userInfo,
        socketId: socket.id
      });
      
      // Send current room state to new user
      socket.emit('room-state', {
        users: Array.from(room.users.values()),
        chatMessages: room.chatMessages,
        recording: room.recording
      });
      
      console.log(`User ${userId} joined room ${roomId}, total in room: ${room.users.size}`);
    });
    
    // WebRTC Signaling - relay between peers
    socket.on('offer', (data) => {
      const { offer, targetSocketId } = data;
      console.log(`Relaying offer from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit('offer', { offer, senderSocketId: socket.id });
    });
    
    socket.on('answer', (data) => {
      const { answer, targetSocketId } = data;
      console.log(`Relaying answer from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit('answer', { answer, senderSocketId: socket.id });
    });
    
    socket.on('ice-candidate', (data) => {
      const { candidate, targetSocketId } = data;
      socket.to(targetSocketId).emit('ice-candidate', { candidate, senderSocketId: socket.id });
    });
    
    // Chat message
    socket.on('chat-message', (data) => {
      const { message, roomId: msgRoomId, userName } = data;
      const user = users.get(socket.id);
      const targetRoom = msgRoomId || socket.roomId;
      if (user && rooms.has(targetRoom)) {
        const chatMessage = {
          id: Date.now(),
          userId: user.userId,
          userInfo: user.userInfo,
          userName: user.userInfo?.name || userName || 'مستخدم',
          message,
          timestamp: new Date()
        };
        rooms.get(targetRoom).chatMessages.push(chatMessage);
        // أرسل للآخرين فقط (المُرسِل يُضيفها محلياً)
        socket.to(targetRoom).emit('chat-message', chatMessage);
      }
    });

    // Recording control
    socket.on('start-recording', (roomId) => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).recording = true;
        io.to(roomId).emit('recording-started', { startedBy: socket.userId, timestamp: new Date() });
      }
    });

    socket.on('stop-recording', (roomId) => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).recording = false;
        io.to(roomId).emit('recording-stopped', { stoppedBy: socket.userId, timestamp: new Date() });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('User disconnected from interview:', socket.id);
      const user = users.get(socket.id);
      if (user && socket.roomId) {
        if (rooms.has(socket.roomId)) {
          const room = rooms.get(socket.roomId);
          room.users.delete(socket.id);
          socket.to(socket.roomId).emit('user-left', { userId: user.userId, socketId: socket.id });
          if (room.users.size === 0) rooms.delete(socket.roomId);
        }
      }
      users.delete(socket.id);
    });
};

const interviewHandler = (io) => {
  io.on('connection', (socket) => {
    setupInterviewSocket(socket, io);
  });
};

module.exports = { interviewHandler, rooms, users };
