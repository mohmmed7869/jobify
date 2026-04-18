#!/usr/bin/env node
/**
 * Smart Recruitment Platform Server
 * منصة التوظيف الذكية - النسخة 3.0
 */

const express = require('express');
require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cluster = require('cluster');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

// Passport Config
require('./config/passport')(passport);

// Clustering
const numCPUs = os.cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production' && false) {
  console.log('🚀 Smart Recruitment Platform Starting...');
  console.log(`🖥️  Forking ${Math.min(numCPUs, 4)} workers...`);

  for (let i = 0; i < Math.min(numCPUs, 4); i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

} else {
  const app = express();
  
  // Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers));
    next();
  });

  console.log('Environment:', process.env.NODE_ENV);
  console.log('System PORT:', process.env.PORT);
  const PORT = process.env.PORT || 5000;
  console.log('Server running on PORT:', PORT);

  // Create necessary directories
  const requiredDirs = [
    'logs', 'uploads', 'uploads/temp', 'uploads/images', 
    'uploads/documents', 'uploads/videos', 'uploads/posts', 'backups', 
    'reports', 'cache', 'sessions'
  ];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());
  
  // CORS Configuration for Production
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    /\.vercel\.app$/, // Allow all Vercel subdomains
    /\.onrender\.com$/, // Allow all Render subdomains
    /^http:\/\/(localhost|127\.0\.0\.1):\d+\/?$/
  ];

  app.use(cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-auth-token']
  }));

  // Passport middleware
  app.use(passport.initialize());
  
  // Maintenance Middleware
  app.use(require('./middleware/maintenance'));
  
  // Static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(path.join(__dirname, 'public')));

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/jobs', require('./routes/jobs'));
  app.use('/api/applications', require('./routes/applications'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/ai', require('./routes/ai'));
  app.use('/api/chat', require('./routes/chat'));
  app.use('/api/assistant', require('./routes/assistant'));
  app.use('/api/posts', require('./routes/posts'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/support', require('./routes/support'));
  app.use('/api/notifications', require('./routes/notifications'));

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Smart Recruitment Platform API',
      version: '3.0.0',
      status: 'running'
    });
  });

  // Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: `خطأ داخلي في الخادم (${err.message})`,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.set('io', io);

  // Initialize Socket Handlers
  const { interviewHandler } = require('./socket/interviewHandler');
  interviewHandler(io);

  // Socket.IO general logic
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their private room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  const serverInstance = server.listen(PORT, () => {
    console.log(`PORT value is: ${PORT}`);
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1));
  });
}
