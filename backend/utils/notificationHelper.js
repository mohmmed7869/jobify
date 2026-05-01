const Notification = require('../models/Notification');

/**
 * Send a notification to a user
 * @param {Object} options - Notification options
 * @param {String} options.recipient - User ID of the recipient
 * @param {String} options.sender - User ID of the sender (optional)
 * @param {String} options.type - Notification type (application, message, etc.)
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.link - Link to redirect the user
 * @param {String} options.route - Route to navigate to
 * @param {String} options.targetId - Target ID
 * @param {Object} io - Socket.io instance (optional)
 */
const sendNotification = async (options, io = null) => {
  try {
    const notification = await Notification.create({
      recipient: options.recipient,
      sender: options.sender,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link,
      route: options.route,
      targetId: options.targetId
    });

    if (io) {
      // Emit socket event to specific user room
      io.to(options.recipient.toString()).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

module.exports = { sendNotification };
