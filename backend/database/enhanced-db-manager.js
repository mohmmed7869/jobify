/**
 * Enhanced Database Manager
 * مدير قاعدة البيانات المحسن مع إدارة متقدمة للأداء والأمان
 */

const mongoose = require('mongoose');
const redis = require('redis');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

// Enhanced logging for database operations
const dbLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/database.log' }),
    new winston.transports.File({ filename: 'logs/database-error.log', level: 'error' })
  ]
});

class EnhancedDatabaseManager {
  constructor() {
    this.mongoConnection = null;
    this.redisClient = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    
    // Performance monitoring
    this.performanceMetrics = {
      queryCount: 0,
      avgResponseTime: 0,
      slowQueries: [],
      errorCount: 0
    };
    
    // Query cache
    this.queryCache = new Map();
    this.cacheMaxSize = 1000;
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * Initialize database connections with enhanced configuration
   */
  async initialize() {
    try {
      dbLogger.info('🔄 Initializing database connections...');
      
      // Initialize MongoDB
      await this.connectMongoDB();
      
      // Initialize Redis (optional for caching)
      await this.connectRedis();
      
      // Setup database monitoring
      this.setupMonitoring();
      
      // Setup periodic maintenance
      this.setupMaintenance();
      
      dbLogger.info('✅ Database initialization completed successfully');
      return true;
      
    } catch (error) {
      dbLogger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced MongoDB connection with advanced options
   */
  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-recruitment';
      
      const options = {
        // Connection options
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Performance options
        maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 2,
        maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME) || 30000,
        
        // Timeout options
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        
        // Buffering options
        bufferMaxEntries: 0,
        bufferCommands: false,
        
        // Write concern
        writeConcern: {
          w: 'majority',
          j: true,
          wtimeout: 1000
        },
        
        // Read preference
        readPreference: 'primary',
        readConcern: { level: 'majority' },
        
        // Compression
        compressors: ['snappy', 'zlib'],
        
        // Authentication
        authSource: process.env.MONGO_AUTH_SOURCE || 'admin',
        
        // SSL/TLS
        ssl: process.env.MONGO_SSL === 'true',
        sslValidate: process.env.MONGO_SSL_VALIDATE !== 'false'
      };

      this.mongoConnection = await mongoose.connect(mongoUri, options);
      
      // Enhanced connection event handlers
      mongoose.connection.on('connected', () => {
        this.isConnected = true;
        this.connectionRetries = 0;
        dbLogger.info('✅ MongoDB connected successfully');
      });

      mongoose.connection.on('error', (error) => {
        dbLogger.error('❌ MongoDB connection error:', error);
        this.performanceMetrics.errorCount++;
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        dbLogger.warn('⚠️ MongoDB disconnected');
        this.handleReconnection();
      });

      mongoose.connection.on('reconnected', () => {
        this.isConnected = true;
        dbLogger.info('🔄 MongoDB reconnected');
      });

      // Setup indexes for better performance
      await this.createIndexes();
      
      return this.mongoConnection;
      
    } catch (error) {
      dbLogger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to Redis for caching
   */
  async connectRedis() {
    try {
      if (!process.env.REDIS_URL) {
        dbLogger.info('ℹ️ Redis URL not configured, skipping Redis connection');
        return null;
      }

      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            dbLogger.error('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            dbLogger.error('Redis retry time exhausted');
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            dbLogger.error('Redis max retry attempts reached');
            return new Error('Redis max retry attempts reached');
          }
          return Math.min(options.attempt * 100, 3000);
        },
        socket: {
          keepAlive: true,
          initialDelay: 0
        }
      });

      await this.redisClient.connect();
      
      this.redisClient.on('connect', () => {
        dbLogger.info('✅ Redis connected successfully');
      });

      this.redisClient.on('error', (error) => {
        dbLogger.error('❌ Redis error:', error);
      });

      this.redisClient.on('end', () => {
        dbLogger.warn('⚠️ Redis connection ended');
      });

      return this.redisClient;
      
    } catch (error) {
      dbLogger.warn('⚠️ Redis connection failed, continuing without cache:', error.message);
      return null;
    }
  }

  /**
   * Create optimized database indexes
   */
  async createIndexes() {
    try {
      dbLogger.info('📊 Creating database indexes...');
      
      // Users collection indexes
      const User = mongoose.model('User');
      await User.createIndexes([
        { email: 1 }, // Unique constraint handled in schema
        { role: 1, isActive: 1 },
        { createdAt: -1 },
        { 'profile.skills': 1 },
        { 'profile.location': 1 },
        { isVerified: 1, isActive: 1 }
      ]);

      // Jobs collection indexes
      const Job = mongoose.model('Job');
      await Job.createIndexes([
        { company: 1, status: 1 },
        { category: 1, location: 1 },
        { salaryRange: 1 },
        { experienceLevel: 1 },
        { skills_required: 1 },
        { createdAt: -1 },
        { isActive: 1, featured: -1 },
        { 'location.city': 1, 'location.country': 1 },
        // Compound indexes for common queries
        { category: 1, location: 1, salaryRange: 1 },
        { skills_required: 1, experienceLevel: 1 }
      ]);

      // Applications collection indexes
      const Application = mongoose.model('Application');
      await Application.createIndexes([
        { applicant: 1, job: 1 }, // Compound unique constraint
        { job: 1, status: 1 },
        { applicant: 1, status: 1 },
        { createdAt: -1 },
        { ai_match_score: -1 },
        { status: 1, createdAt: -1 }
      ]);

      // Messages collection indexes (if exists)
      try {
        const Message = mongoose.model('Message');
        await Message.createIndexes([
          { room: 1, createdAt: -1 },
          { sender: 1, recipient: 1 },
          { createdAt: -1 },
          { isRead: 1, recipient: 1 }
        ]);
      } catch (error) {
        dbLogger.info('Message model not found, skipping message indexes');
      }

      dbLogger.info('✅ Database indexes created successfully');
      
    } catch (error) {
      dbLogger.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  /**
   * Handle MongoDB reconnection logic
   */
  async handleReconnection() {
    if (this.connectionRetries >= this.maxRetries) {
      dbLogger.error('❌ Max reconnection attempts reached');
      return;
    }

    this.connectionRetries++;
    dbLogger.info(`🔄 Attempting reconnection (${this.connectionRetries}/${this.maxRetries})`);

    setTimeout(async () => {
      try {
        await this.connectMongoDB();
      } catch (error) {
        dbLogger.error('❌ Reconnection failed:', error);
      }
    }, this.retryDelay * this.connectionRetries);
  }

  /**
   * Enhanced query execution with performance monitoring and caching
   */
  async executeQuery(model, operation, query = {}, options = {}) {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(model, operation, query, options);
    
    try {
      // Check cache first for read operations
      if (['find', 'findOne', 'findById', 'count', 'aggregate'].includes(operation)) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          dbLogger.debug('Cache hit for query:', { model, operation });
          return cached;
        }
      }

      // Execute query
      const Model = mongoose.model(model);
      let result;

      switch (operation) {
        case 'find':
          result = await Model.find(query, null, options);
          break;
        case 'findOne':
          result = await Model.findOne(query, null, options);
          break;
        case 'findById':
          result = await Model.findById(query, null, options);
          break;
        case 'create':
          result = await Model.create(query);
          break;
        case 'updateOne':
          result = await Model.updateOne(query, options.update, options);
          break;
        case 'updateMany':
          result = await Model.updateMany(query, options.update, options);
          break;
        case 'deleteOne':
          result = await Model.deleteOne(query);
          break;
        case 'deleteMany':
          result = await Model.deleteMany(query);
          break;
        case 'aggregate':
          result = await Model.aggregate(query);
          break;
        case 'count':
          result = await Model.countDocuments(query);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const executionTime = Date.now() - startTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(executionTime, model, operation);
      
      // Cache result for read operations
      if (['find', 'findOne', 'findById', 'count', 'aggregate'].includes(operation)) {
        await this.setInCache(cacheKey, result);
      }
      
      // Clear related cache for write operations
      if (['create', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(operation)) {
        await this.clearRelatedCache(model);
      }

      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.performanceMetrics.errorCount++;
      
      dbLogger.error('Query execution error:', {
        model,
        operation,
        query,
        error: error.message,
        executionTime
      });
      
      throw error;
    }
  }

  /**
   * Generate cache key for queries
   */
  generateCacheKey(model, operation, query, options) {
    const keyData = {
      model,
      operation,
      query: JSON.stringify(query),
      options: JSON.stringify(options)
    };
    
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Get data from cache
   */
  async getFromCache(key) {
    try {
      // Try Redis first
      if (this.redisClient) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      // Fallback to in-memory cache
      const cached = this.queryCache.get(key);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
      
      return null;
      
    } catch (error) {
      dbLogger.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async setInCache(key, data, ttl = this.cacheTTL) {
    try {
      // Store in Redis
      if (this.redisClient) {
        await this.redisClient.setEx(key, Math.floor(ttl / 1000), JSON.stringify(data));
      }
      
      // Store in memory cache as fallback
      if (this.queryCache.size >= this.cacheMaxSize) {
        const firstKey = this.queryCache.keys().next().value;
        this.queryCache.delete(firstKey);
      }
      
      this.queryCache.set(key, {
        data,
        timestamp: Date.now()
      });
      
    } catch (error) {
      dbLogger.warn('Cache set error:', error);
    }
  }

  /**
   * Clear related cache entries
   */
  async clearRelatedCache(model) {
    try {
      // Clear Redis cache with pattern
      if (this.redisClient) {
        const keys = await this.redisClient.keys(`*${model}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
      
      // Clear memory cache
      for (const key of this.queryCache.keys()) {
        if (key.includes(model)) {
          this.queryCache.delete(key);
        }
      }
      
    } catch (error) {
      dbLogger.warn('Cache clear error:', error);
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(executionTime, model, operation) {
    this.performanceMetrics.queryCount++;
    
    // Update average response time
    const currentAvg = this.performanceMetrics.avgResponseTime;
    const newAvg = (currentAvg * (this.performanceMetrics.queryCount - 1) + executionTime) / this.performanceMetrics.queryCount;
    this.performanceMetrics.avgResponseTime = Math.round(newAvg * 100) / 100;
    
    // Track slow queries
    if (executionTime > 1000) { // Queries taking more than 1 second
      this.performanceMetrics.slowQueries.push({
        model,
        operation,
        executionTime,
        timestamp: new Date()
      });
      
      // Keep only last 100 slow queries
      if (this.performanceMetrics.slowQueries.length > 100) {
        this.performanceMetrics.slowQueries.shift();
      }
      
      dbLogger.warn('Slow query detected:', {
        model,
        operation,
        executionTime
      });
    }
  }

  /**
   * Setup database monitoring
   */
  setupMonitoring() {
    // Monitor connection status
    setInterval(() => {
      dbLogger.info('Database health check:', {
        mongoConnected: this.isConnected,
        redisConnected: this.redisClient?.isReady || false,
        performanceMetrics: this.performanceMetrics
      });
    }, 60000); // Every minute

    // Reset performance metrics periodically
    setInterval(() => {
      this.performanceMetrics = {
        queryCount: 0,
        avgResponseTime: 0,
        slowQueries: [],
        errorCount: 0
      };
    }, 3600000); // Every hour
  }

  /**
   * Setup periodic maintenance tasks
   */
  setupMaintenance() {
    // Clean expired cache entries
    setInterval(() => {
      this.cleanupCache();
    }, 300000); // Every 5 minutes

    // Database maintenance tasks
    setInterval(() => {
      this.performMaintenance();
    }, 86400000); // Daily
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.queryCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      dbLogger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Perform database maintenance
   */
  async performMaintenance() {
    try {
      dbLogger.info('🔧 Starting database maintenance...');
      
      // Compact collections (MongoDB specific)
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        try {
          await collection.compact();
        } catch (error) {
          dbLogger.warn(`Failed to compact collection ${collection.collectionName}:`, error);
        }
      }
      
      // Update collection statistics
      for (const collection of collections) {
        try {
          await mongoose.connection.db.command({
            collStats: collection.collectionName
          });
        } catch (error) {
          dbLogger.warn(`Failed to update stats for ${collection.collectionName}:`, error);
        }
      }
      
      dbLogger.info('✅ Database maintenance completed');
      
    } catch (error) {
      dbLogger.error('❌ Database maintenance failed:', error);
    }
  }

  /**
   * Backup database
   */
  async createBackup() {
    try {
      const backupPath = path.join(__dirname, '../backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupPath, `backup-${timestamp}.json`);
      
      // Ensure backup directory exists
      await fs.mkdir(backupPath, { recursive: true });
      
      // Get all collections
      const collections = await mongoose.connection.db.collections();
      const backup = {};
      
      for (const collection of collections) {
        const documents = await collection.find({}).toArray();
        backup[collection.collectionName] = documents;
      }
      
      // Write backup file
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      
      dbLogger.info('✅ Database backup created:', backupFile);
      return backupFile;
      
    } catch (error) {
      dbLogger.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics() {
    try {
      const stats = {
        mongodb: {
          connected: this.isConnected,
          serverStatus: null,
          collections: {}
        },
        redis: {
          connected: this.redisClient?.isReady || false,
          info: null
        },
        performance: this.performanceMetrics,
        cache: {
          size: this.queryCache.size,
          maxSize: this.cacheMaxSize
        }
      };
      
      // Get MongoDB server status
      if (this.isConnected) {
        try {
          stats.mongodb.serverStatus = await mongoose.connection.db.admin().serverStatus();
          
          // Get collection statistics
          const collections = await mongoose.connection.db.collections();
          for (const collection of collections) {
            try {
              const collStats = await mongoose.connection.db.command({
                collStats: collection.collectionName
              });
              stats.mongodb.collections[collection.collectionName] = {
                count: collStats.count,
                size: collStats.size,
                avgObjSize: collStats.avgObjSize
              };
            } catch (error) {
              // Collection might not exist or other error
            }
          }
        } catch (error) {
          dbLogger.warn('Failed to get MongoDB server status:', error);
        }
      }
      
      // Get Redis info
      if (this.redisClient?.isReady) {
        try {
          stats.redis.info = await this.redisClient.info();
        } catch (error) {
          dbLogger.warn('Failed to get Redis info:', error);
        }
      }
      
      return stats;
      
    } catch (error) {
      dbLogger.error('Error getting database statistics:', error);
      return null;
    }
  }

  /**
   * Close all connections gracefully
   */
  async close() {
    try {
      dbLogger.info('🔄 Closing database connections...');
      
      // Close MongoDB connection
      if (this.mongoConnection) {
        await mongoose.connection.close();
        this.mongoConnection = null;
      }
      
      // Close Redis connection
      if (this.redisClient) {
        await this.redisClient.quit();
        this.redisClient = null;
      }
      
      // Clear cache
      this.queryCache.clear();
      
      this.isConnected = false;
      dbLogger.info('✅ Database connections closed successfully');
      
    } catch (error) {
      dbLogger.error('❌ Error closing database connections:', error);
      throw error;
    }
  }
}

// Export singleton instance
const databaseManager = new EnhancedDatabaseManager();

module.exports = {
  databaseManager,
  EnhancedDatabaseManager
};