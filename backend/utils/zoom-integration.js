/**
 * Zoom Integration Utility
 * Provides functions for integrating with Zoom API for video interviews
 */

const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

class ZoomIntegration {
  constructor() {
    this.apiKey = process.env.ZOOM_API_KEY;
    this.apiSecret = process.env.ZOOM_API_SECRET;
    this.userId = process.env.ZOOM_USER_ID;
    
    // Check if Zoom credentials are configured
    this.isConfigured = !!(this.apiKey && this.apiSecret && this.userId);
    
    if (!this.isConfigured) {
      console.warn('Zoom API credentials not fully configured. Some features may not work.');
    }
  }
  
  /**
   * Generate a JWT token for Zoom API authentication
   * @returns {string} JWT token
   */
  generateToken() {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    const payload = {
      iss: this.apiKey,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 // Token expires in 1 hour
    };
    
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
      .createHmac('sha256', this.apiSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  /**
   * Create a new Zoom meeting
   * @param {Object} options Meeting options
   * @returns {Promise<Object>} Meeting details
   */
  async createMeeting(options = {}) {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      const token = this.generateToken();
      
      const response = await axios.post(
        `https://api.zoom.us/v2/users/${this.userId}/meetings`,
        {
          topic: options.topic || 'Job Interview',
          type: 2, // Scheduled meeting
          start_time: options.startTime || new Date().toISOString(),
          duration: options.duration || 60,
          timezone: options.timezone || 'UTC',
          agenda: options.agenda || 'Job Interview Session',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: false,
            auto_recording: options.autoRecording || 'cloud',
            waiting_room: options.waitingRoom || false,
            contact_name: options.contactName || 'HR Department',
            contact_email: options.contactEmail || '',
            registrants_email_notification: options.emailNotification || true,
            meeting_authentication: false,
            alternative_hosts: options.alternativeHosts || ''
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        meeting: {
          id: response.data.id,
          joinUrl: response.data.join_url,
          startUrl: response.data.start_url,
          password: response.data.password,
          topic: response.data.topic,
          startTime: response.data.start_time,
          duration: response.data.duration,
          timezone: response.data.timezone,
          agenda: response.data.agenda,
          createdAt: new Date()
        }
      };
      
    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      
      return {
        success: false,
        error: 'Failed to create Zoom meeting',
        details: error.response?.data || error.message
      };
    }
  }
  
  /**
   * Get details of a Zoom meeting
   * @param {string} meetingId Meeting ID
   * @returns {Promise<Object>} Meeting details
   */
  async getMeeting(meetingId) {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      const token = this.generateToken();
      
      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        meeting: response.data
      };
      
    } catch (error) {
      console.error('Error getting Zoom meeting:', error.response?.data || error.message);
      
      return {
        success: false,
        error: 'Failed to get Zoom meeting',
        details: error.response?.data || error.message
      };
    }
  }
  
  /**
   * Update a Zoom meeting
   * @param {string} meetingId Meeting ID
   * @param {Object} options Meeting options to update
   * @returns {Promise<Object>} Update result
   */
  async updateMeeting(meetingId, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      const token = this.generateToken();
      
      const updateData = {};
      
      if (options.topic) updateData.topic = options.topic;
      if (options.agenda) updateData.agenda = options.agenda;
      if (options.startTime) updateData.start_time = options.startTime;
      if (options.duration) updateData.duration = options.duration;
      if (options.timezone) updateData.timezone = options.timezone;
      
      if (Object.keys(options.settings || {}).length > 0) {
        updateData.settings = {};
        
        const settings = options.settings;
        if (settings.hostVideo !== undefined) updateData.settings.host_video = settings.hostVideo;
        if (settings.participantVideo !== undefined) updateData.settings.participant_video = settings.participantVideo;
        if (settings.joinBeforeHost !== undefined) updateData.settings.join_before_host = settings.joinBeforeHost;
        if (settings.muteUponEntry !== undefined) updateData.settings.mute_upon_entry = settings.muteUponEntry;
        if (settings.autoRecording) updateData.settings.auto_recording = settings.autoRecording;
        if (settings.waitingRoom !== undefined) updateData.settings.waiting_room = settings.waitingRoom;
      }
      
      const response = await axios.patch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        updated: true
      };
      
    } catch (error) {
      console.error('Error updating Zoom meeting:', error.response?.data || error.message);
      
      return {
        success: false,
        error: 'Failed to update Zoom meeting',
        details: error.response?.data || error.message
      };
    }
  }
  
  /**
   * Delete a Zoom meeting
   * @param {string} meetingId Meeting ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteMeeting(meetingId) {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      const token = this.generateToken();
      
      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            schedule_for_reminder: false
          }
        }
      );
      
      return {
        success: true,
        deleted: true
      };
      
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
      
      return {
        success: false,
        error: 'Failed to delete Zoom meeting',
        details: error.response?.data || error.message
      };
    }
  }
  
  /**
   * End an ongoing Zoom meeting
   * @param {string} meetingId Meeting ID
   * @returns {Promise<Object>} End result
   */
  async endMeeting(meetingId) {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      const token = this.generateToken();
      
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
      
      return {
        success: true,
        ended: true
      };
      
    } catch (error) {
      console.error('Error ending Zoom meeting:', error.response?.data || error.message);
      
      return {
        success: false,
        error: 'Failed to end Zoom meeting',
        details: error.response?.data || error.message
      };
    }
  }
  
  /**
   * List recordings for a meeting
   * @param {string} meetingId Meeting ID
   * @returns {Promise<Object>} Recordings list
   */
  async listRecordings(meetingId) {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    try {
      const token = this.generateToken();
      
      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        recordings: response.data.recording_files || []
      };
      
    } catch (error) {
      console.error('Error listing Zoom recordings:', error.response?.data || error.message);
      
      return {
        success: false,
        error: 'Failed to list Zoom recordings',
        details: error.response?.data || error.message
      };
    }
  }
  
  /**
   * Generate a meeting SDK JWT token for client-side Zoom integration
   * @param {string} meetingNumber Meeting number
   * @param {string} role Role (0 for attendee, 1 for host)
   * @returns {string} JWT token for client SDK
   */
  generateSdkToken(meetingNumber, role = 0) {
    if (!this.isConfigured) {
      throw new Error('Zoom API credentials not configured');
    }
    
    const timestamp = new Date().getTime() - 30000;
    const payload = Buffer.from(this.apiKey + meetingNumber + timestamp + role).toString('base64');
    const hash = crypto.createHmac('sha256', this.apiSecret).update(payload).digest('base64');
    const signature = Buffer.from(`${this.apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
    
    return signature;
  }
  
  /**
   * Check if Zoom integration is properly configured
   * @returns {boolean} Configuration status
   */
  checkConfiguration() {
    return this.isConfigured;
  }
}

module.exports = ZoomIntegration;