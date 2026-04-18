/**
 * Enhanced File Upload Middleware
 * نظام تحميل الملفات المحسن مع الأمان والتحسينات المتقدمة
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const winston = require('winston');
const mime = require('mime-types');
const archiver = require('archiver');
const extract = require('extract-zip');

// Enhanced logging for file operations
const fileLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/file-upload.log' }),
    new winston.transports.File({ filename: 'logs/file-upload-error.log', level: 'error' })
  ]
});

class EnhancedFileUploadManager {
  constructor() {
    this.uploadsPath = process.env.UPLOADS_PATH || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB
    this.allowedMimeTypes = this.initializeAllowedMimeTypes();
    this.compressionSettings = this.initializeCompressionSettings();
    this.virusScanEnabled = process.env.VIRUS_SCAN_ENABLED === 'true';
    
    // Statistics
    this.stats = {
      uploaded: 0,
      processed: 0,
      failed: 0,
      totalSize: 0,
      virusDetected: 0
    };
    
    this.initializeStorage();
  }

  initializeAllowedMimeTypes() {
    return {
      images: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
      ],
      videos: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm'
      ],
      audio: [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4'
      ],
      archives: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ]
    };
  }

  initializeCompressionSettings() {
    return {
      images: {
        jpeg: { quality: 85, progressive: true },
        png: { compressionLevel: 8 },
        webp: { quality: 85 }
      },
      videos: {
        maxResolution: '1920x1080',
        bitrate: '2000k',
        codec: 'libx264'
      }
    };
  }

  async initializeStorage() {
    try {
      // Create upload directories
      const directories = ['temp', 'images', 'documents', 'videos', 'audio', 'processed'];
      
      for (const dir of directories) {
        const dirPath = path.join(this.uploadsPath, dir);
        try {
          await fs.access(dirPath);
        } catch {
          await fs.mkdir(dirPath, { recursive: true });
          fileLogger.info(`Created directory: ${dirPath}`);
        }
      }

      fileLogger.info('✅ File upload manager initialized');
    } catch (error) {
      fileLogger.error('❌ Failed to initialize storage:', error);
      throw error;
    }
  }

  /**
   * Create enhanced multer configuration
   */
  createMulterConfig(options = {}) {
    const {
      maxFiles = 10,
      allowedTypes = Object.keys(this.allowedMimeTypes),
      customPath = null,
      preserveOriginal = false
    } = options;

    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          let uploadPath = customPath || path.join(this.uploadsPath, 'temp');
          
          // Create directory if it doesn't exist
          try {
            await fs.access(uploadPath);
          } catch {
            await fs.mkdir(uploadPath, { recursive: true });
          }
          
          cb(null, uploadPath);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        try {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileExtension = path.extname(file.originalname);
          const baseName = path.basename(file.originalname, fileExtension);
          const safeBaseName = baseName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
          
          const filename = preserveOriginal 
            ? file.originalname
            : `${safeBaseName}-${uniqueSuffix}${fileExtension}`;
          
          // Store original filename for reference
          file.generatedFilename = filename;
          
          cb(null, filename);
        } catch (error) {
          cb(error);
        }
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: maxFiles
      },
      fileFilter: (req, file, cb) => {
        try {
          const isAllowed = this.validateFileType(file, allowedTypes);
          
          if (!isAllowed) {
            const error = new Error(`نوع الملف غير مدعوم: ${file.mimetype}`);
            error.code = 'UNSUPPORTED_FILE_TYPE';
            return cb(error);
          }
          
          // Additional security checks
          if (this.containsSuspiciousPatterns(file.originalname)) {
            const error = new Error('اسم الملف يحتوي على أحرف غير مسموحة');
            error.code = 'SUSPICIOUS_FILENAME';
            return cb(error);
          }
          
          cb(null, true);
        } catch (error) {
          cb(error);
        }
      }
    });
  }

  /**
   * Validate file type
   */
  validateFileType(file, allowedTypes) {
    const fileMimeType = file.mimetype.toLowerCase();
    
    for (const type of allowedTypes) {
      if (this.allowedMimeTypes[type] && 
          this.allowedMimeTypes[type].includes(fileMimeType)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for suspicious filename patterns
   */
  containsSuspiciousPatterns(filename) {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar)$/i,
      /\.\./,
      /[<>:"|?*]/,
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Enhanced file processing middleware
   */
  createProcessingMiddleware(processingOptions = {}) {
    return async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          return next();
        }

        const processedFiles = [];
        
        for (const file of req.files) {
          try {
            const processedFile = await this.processFile(file, processingOptions);
            processedFiles.push(processedFile);
            
            this.stats.uploaded++;
            this.stats.totalSize += file.size;
            
            fileLogger.info('File processed successfully:', {
              originalName: file.originalname,
              processedName: processedFile.filename,
              size: file.size,
              userId: req.user?.id
            });
            
          } catch (error) {
            this.stats.failed++;
            fileLogger.error('File processing failed:', {
              filename: file.originalname,
              error: error.message,
              userId: req.user?.id
            });
            
            // Clean up failed file
            try {
              await fs.unlink(file.path);
            } catch {}
            
            throw error;
          }
        }
        
        req.processedFiles = processedFiles;
        this.stats.processed += processedFiles.length;
        
        next();
        
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Process uploaded file with enhancements
   */
  async processFile(file, options = {}) {
    const {
      compress = true,
      generateThumbnails = true,
      extractMetadata = true,
      virusScan = this.virusScanEnabled,
      watermark = false,
      convertFormat = null
    } = options;

    try {
      let processedFile = { ...file };
      
      // Virus scanning
      if (virusScan) {
        const isClean = await this.scanForVirus(file.path);
        if (!isClean) {
          this.stats.virusDetected++;
          await fs.unlink(file.path);
          throw new Error('تم اكتشاف فيروس في الملف');
        }
      }

      // Extract metadata
      if (extractMetadata) {
        processedFile.metadata = await this.extractMetadata(file);
      }

      // Determine file category
      const fileCategory = this.determineFileCategory(file.mimetype);
      processedFile.category = fileCategory;

      // Process based on file type
      if (fileCategory === 'image') {
        processedFile = await this.processImage(processedFile, {
          compress,
          generateThumbnails,
          watermark,
          convertFormat
        });
      } else if (fileCategory === 'video') {
        processedFile = await this.processVideo(processedFile, options);
      } else if (fileCategory === 'document') {
        processedFile = await this.processDocument(processedFile, options);
      }

      // Move to appropriate directory
      const finalPath = await this.moveToFinalLocation(processedFile, fileCategory);
      processedFile.finalPath = finalPath;
      processedFile.url = this.generateFileUrl(finalPath);

      // Generate file hash for integrity checking
      processedFile.hash = await this.generateFileHash(finalPath);

      return processedFile;

    } catch (error) {
      fileLogger.error('File processing error:', error);
      throw error;
    }
  }

  /**
   * Process image files
   */
  async processImage(file, options = {}) {
    const { compress, generateThumbnails, watermark, convertFormat } = options;
    
    try {
      let processedFile = { ...file };
      const inputPath = file.path;
      
      // Create Sharp instance
      let image = sharp(inputPath);
      const metadata = await image.metadata();
      
      processedFile.dimensions = {
        width: metadata.width,
        height: metadata.height
      };

      // Compression and optimization
      if (compress) {
        const outputPath = inputPath.replace(/\.(jpg|jpeg|png|webp)$/i, '_compressed.$1');
        
        if (file.mimetype.includes('jpeg') || file.mimetype.includes('jpg')) {
          await image
            .jpeg(this.compressionSettings.images.jpeg)
            .toFile(outputPath);
        } else if (file.mimetype.includes('png')) {
          await image
            .png(this.compressionSettings.images.png)
            .toFile(outputPath);
        } else if (file.mimetype.includes('webp')) {
          await image
            .webp(this.compressionSettings.images.webp)
            .toFile(outputPath);
        }
        
        // Replace original with compressed version
        await fs.unlink(inputPath);
        processedFile.path = outputPath;
      }

      // Generate thumbnails
      if (generateThumbnails) {
        const thumbnails = await this.generateThumbnails(processedFile.path);
        processedFile.thumbnails = thumbnails;
      }

      // Add watermark
      if (watermark && watermark.enabled) {
        await this.addWatermark(processedFile.path, watermark);
      }

      // Format conversion
      if (convertFormat) {
        processedFile = await this.convertImageFormat(processedFile, convertFormat);
      }

      return processedFile;

    } catch (error) {
      fileLogger.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Process video files
   */
  async processVideo(file, options = {}) {
    try {
      const processedFile = { ...file };
      
      // Extract video metadata
      const metadata = await this.extractVideoMetadata(file.path);
      processedFile.videoMetadata = metadata;
      
      // Generate video thumbnail
      const thumbnailPath = await this.generateVideoThumbnail(file.path);
      processedFile.thumbnail = thumbnailPath;
      
      // Compress video if needed
      if (options.compressVideo && metadata.filesize > 100 * 1024 * 1024) { // 100MB
        const compressedPath = await this.compressVideo(file.path);
        processedFile.compressedPath = compressedPath;
      }
      
      return processedFile;
      
    } catch (error) {
      fileLogger.error('Video processing error:', error);
      throw error;
    }
  }

  /**
   * Process document files
   */
  async processDocument(file, options = {}) {
    try {
      const processedFile = { ...file };
      
      // Extract document text content
      if (options.extractText) {
        const textContent = await this.extractDocumentText(file.path);
        processedFile.textContent = textContent;
      }
      
      // Generate document preview
      if (options.generatePreview) {
        const previewPath = await this.generateDocumentPreview(file.path);
        processedFile.previewPath = previewPath;
      }
      
      // Scan for sensitive information
      if (options.scanSensitiveInfo) {
        const sensitiveInfo = await this.scanForSensitiveInfo(processedFile.textContent || '');
        processedFile.sensitiveInfoDetected = sensitiveInfo.length > 0;
        processedFile.sensitiveInfo = sensitiveInfo;
      }
      
      return processedFile;
      
    } catch (error) {
      fileLogger.error('Document processing error:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnails for images
   */
  async generateThumbnails(imagePath) {
    const thumbnailSizes = [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 600, height: 600 }
    ];

    const thumbnails = {};
    const baseName = path.parse(imagePath).name;
    const baseDir = path.dirname(imagePath);

    for (const size of thumbnailSizes) {
      const thumbnailPath = path.join(baseDir, `${baseName}_thumb_${size.name}.jpg`);
      
      await sharp(imagePath)
        .resize(size.width, size.height, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      thumbnails[size.name] = {
        path: thumbnailPath,
        url: this.generateFileUrl(thumbnailPath),
        width: size.width,
        height: size.height
      };
    }

    return thumbnails;
  }

  /**
   * Add watermark to image
   */
  async addWatermark(imagePath, watermarkOptions) {
    const { text, position = 'bottom-right', opacity = 0.5 } = watermarkOptions;
    
    const watermarkedPath = imagePath.replace(/(\.[^.]+)$/, '_watermarked$1');
    
    const textSvg = `
      <svg width="200" height="50">
        <text x="10" y="30" font-family="Arial" font-size="20" fill="white" opacity="${opacity}">
          ${text}
        </text>
      </svg>
    `;
    
    const textBuffer = Buffer.from(textSvg);
    
    let composite = sharp(imagePath);
    const metadata = await composite.metadata();
    
    let left, top;
    if (position === 'bottom-right') {
      left = metadata.width - 210;
      top = metadata.height - 60;
    }
    
    await composite
      .composite([{ input: textBuffer, left, top }])
      .toFile(watermarkedPath);
    
    // Replace original with watermarked version
    await fs.unlink(imagePath);
    await fs.rename(watermarkedPath, imagePath);
  }

  /**
   * Extract metadata from various file types
   */
  async extractMetadata(file) {
    const metadata = {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      checksum: await this.generateFileHash(file.path)
    };

    try {
      if (file.mimetype.startsWith('image/')) {
        const imageMetadata = await sharp(file.path).metadata();
        metadata.image = {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
          hasAlpha: imageMetadata.hasAlpha,
          density: imageMetadata.density
        };
      }
    } catch (error) {
      fileLogger.warn('Metadata extraction failed:', error);
    }

    return metadata;
  }

  /**
   * Virus scanning (placeholder - integrate with actual antivirus)
   */
  async scanForVirus(filePath) {
    try {
      // This is a placeholder. In production, integrate with:
      // - ClamAV
      // - Windows Defender API
      // - Third-party virus scanning services
      
      // Simple check for common malicious patterns in filename
      const filename = path.basename(filePath).toLowerCase();
      const maliciousPatterns = [
        /\.exe$/,
        /\.scr$/,
        /\.bat$/,
        /\.cmd$/,
        /\.pif$/
      ];
      
      const hasMaliciousPattern = maliciousPatterns.some(pattern => 
        pattern.test(filename)
      );
      
      if (hasMaliciousPattern) {
        fileLogger.warn('Potential malicious file detected:', filename);
        return false;
      }
      
      return true; // File is clean
      
    } catch (error) {
      fileLogger.error('Virus scan error:', error);
      return false; // Err on the side of caution
    }
  }

  /**
   * Generate file hash for integrity checking
   */
  async generateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      fileLogger.error('Hash generation error:', error);
      return null;
    }
  }

  /**
   * Move file to final location
   */
  async moveToFinalLocation(file, category) {
    try {
      const finalDir = path.join(this.uploadsPath, category);
      const finalPath = path.join(finalDir, file.generatedFilename || file.filename);
      
      // Ensure directory exists
      try {
        await fs.access(finalDir);
      } catch {
        await fs.mkdir(finalDir, { recursive: true });
      }
      
      // Move file
      await fs.rename(file.path, finalPath);
      
      return finalPath;
      
    } catch (error) {
      fileLogger.error('File move error:', error);
      throw error;
    }
  }

  /**
   * Generate public URL for file
   */
  generateFileUrl(filePath) {
    const relativePath = path.relative(this.uploadsPath, filePath);
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Determine file category
   */
  determineFileCategory(mimetype) {
    if (this.allowedMimeTypes.images.includes(mimetype)) return 'images';
    if (this.allowedMimeTypes.documents.includes(mimetype)) return 'documents';
    if (this.allowedMimeTypes.videos.includes(mimetype)) return 'videos';
    if (this.allowedMimeTypes.audio.includes(mimetype)) return 'audio';
    if (this.allowedMimeTypes.archives.includes(mimetype)) return 'archives';
    return 'other';
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const tempDir = path.join(this.uploadsPath, 'temp');
      const files = await fs.readdir(tempDir);
      
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        fileLogger.info(`Cleaned up ${cleanedCount} temporary files`);
      }
      
    } catch (error) {
      fileLogger.error('Temp files cleanup error:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const stats = { ...this.stats };
      
      // Calculate directory sizes
      const directories = ['images', 'documents', 'videos', 'audio'];
      stats.directoryStats = {};
      
      for (const dir of directories) {
        const dirPath = path.join(this.uploadsPath, dir);
        stats.directoryStats[dir] = await this.getDirectorySize(dirPath);
      }
      
      return stats;
      
    } catch (error) {
      fileLogger.error('Storage stats error:', error);
      return this.stats;
    }
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      let fileCount = 0;
      
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          const subDirStats = await this.getDirectorySize(filePath);
          totalSize += subDirStats.totalSize;
          fileCount += subDirStats.fileCount;
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
      
      return { totalSize, fileCount };
      
    } catch (error) {
      return { totalSize: 0, fileCount: 0 };
    }
  }

  /**
   * Create file download middleware
   */
  createDownloadMiddleware() {
    return async (req, res, next) => {
      try {
        const { fileId, filename } = req.params;
        
        // Validate user permissions
        const hasPermission = await this.validateDownloadPermission(req.user, fileId);
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'غير مخول لتحميل هذا الملف'
          });
        }
        
        // Get file path
        const filePath = await this.getFilePath(fileId);
        if (!filePath) {
          return res.status(404).json({
            success: false,
            message: 'الملف غير موجود'
          });
        }
        
        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', mime.lookup(filePath) || 'application/octet-stream');
        
        // Stream file
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
        
        fileLogger.info('File download:', {
          fileId,
          filename,
          userId: req.user?.id
        });
        
      } catch (error) {
        fileLogger.error('Download error:', error);
        next(error);
      }
    };
  }

  // Placeholder methods for advanced features
  async validateDownloadPermission(user, fileId) {
    // Implement permission checking logic
    return true;
  }

  async getFilePath(fileId) {
    // Implement file path retrieval from database
    return null;
  }

  async extractVideoMetadata(filePath) {
    // Implement video metadata extraction
    return {};
  }

  async generateVideoThumbnail(filePath) {
    // Implement video thumbnail generation
    return null;
  }

  async compressVideo(filePath) {
    // Implement video compression
    return filePath;
  }

  async extractDocumentText(filePath) {
    // Implement document text extraction
    return '';
  }

  async generateDocumentPreview(filePath) {
    // Implement document preview generation
    return null;
  }

  async scanForSensitiveInfo(text) {
    // Implement sensitive information scanning
    return [];
  }

  async convertImageFormat(file, targetFormat) {
    // Implement image format conversion
    return file;
  }
}

// Export singleton instance
const fileUploadManager = new EnhancedFileUploadManager();

module.exports = {
  fileUploadManager,
  EnhancedFileUploadManager
};