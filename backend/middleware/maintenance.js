const SystemSettings = require('../models/SystemSettings');

/**
 * Middleware to check if the server is in maintenance mode
 * Allows admins to bypass maintenance mode
 */
const maintenance = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne();
    
    // If no settings yet, or maintenance is off, continue
    if (!settings || !settings.serverMaintenance) {
      return next();
    }

    // Bypass for admins - we need to check if user is admin
    // Note: this middleware should usually be placed after 'protect' if we want to check roles
    // But if we want to block even the login page, we need a different approach.
    // Let's allow access to /api/auth/login and /api/admin routes for maintenance bypass
    
    const isLoginRoute = req.path.includes('/login');
    const isAuthRoute = req.path.includes('/auth');
    
    // If it's a login or auth route, allow it so admin can log in to turn off maintenance
    if (isLoginRoute || isAuthRoute) {
        return next();
    }

    // If it's a regular user and maintenance is ON
    if (settings.serverMaintenance) {
        // If user is logged in and is admin, let them through
        if (req.user && req.user.role === 'admin') {
            return next();
        }

        // Return maintenance mode response
        return res.status(503).json({
            success: false,
            message: 'المنصة في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.',
            maintenance: true
        });
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = maintenance;
