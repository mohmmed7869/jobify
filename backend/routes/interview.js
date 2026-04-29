const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * GET /api/interview/ice-servers
 * يوفر إعداد ICE servers للـ WebRTC
 * يدعم Metered.ca TURN API إذا كان METERED_API_KEY موجوداً
 */
router.get('/ice-servers', async (req, res) => {
  try {
    // STUN servers الاحتياطية (تعمل دائماً)
    const baseStunServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ];

    // ===================================================
    // محاولة الحصول على TURN servers من Metered.ca API
    // (يعمل على الأندرويد والأجهزة خلف NAT الصارم)
    // ===================================================
    const meteredApiKey = process.env.METERED_API_KEY;
    if (meteredApiKey) {
      try {
        const response = await axios.get(
          `https://jobify.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`,
          { timeout: 3000 }
        );
        if (response.data && Array.isArray(response.data)) {
          const iceServers = [...baseStunServers, ...response.data];
          console.log(`✅ Metered TURN servers loaded: ${response.data.length} servers`);
          return res.json({ success: true, data: { iceServers } });
        }
      } catch (meteredErr) {
        console.warn('⚠️ Metered API failed, using fallback TURN:', meteredErr.message);
      }
    }

    // ===================================================
    // Fallback: TURN servers من Custom ENV أو Open Relay
    // ===================================================
    const iceServers = [...baseStunServers];

    // إذا كان هناك TURN server مخصص في الـ environment variables
    if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
      iceServers.push({
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      });
    }

    // Open Relay servers (مجانية لكن غير مضمونة للإنتاج)
    iceServers.push(
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
    );

    res.json({ success: true, data: { iceServers } });
  } catch (error) {
    console.error('ICE servers error:', error);
    // Minimal fallback إذا فشل كل شيء
    res.json({
      success: true,
      data: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
        ]
      }
    });
  }
});

module.exports = router;
