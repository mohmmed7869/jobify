const express = require('express');
const router = express.Router();

/**
 * GET /api/interview/ice-servers
 * يوفر إعداد ICE servers للـ WebRTC (STUN + TURN)
 * مسار عام - لا يحتاج مصادقة لضمان عمل مقابلات الفيديو
 */
router.get('/ice-servers', (req, res) => {
  try {
    const iceServers = [
      // STUN Servers - مجانية وموثوقة
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ];

    // TURN Servers - ضرورية للإنترنت
    // إذا كان هناك TURN server مخصص في الـ environment variables
    if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
      iceServers.push({
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      });
    }

    // TURN servers احتياطية (Open Relay - مجانية)
    const openRelayServers = [
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:80?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];

    iceServers.push(...openRelayServers);

    res.json({
      success: true,
      data: { iceServers },
    });
  } catch (error) {
    console.error('ICE servers error:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب ICE servers' });
  }
});

module.exports = router;
