const { User, ActivityLog } = require('../models/associations');

// Configuration for monitoring thresholds
const THRESHOLDS = {
  requestsPerMinute: 5,  // Lowered for testing purposes
  windowSize: 60000,      // Time window in milliseconds (1 minute)
};

// Store request counts for each user
const requestCounts = new Map();

// Clean up old request counts periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of requestCounts.entries()) {
    const recentRequests = timestamps.filter(time => now - time < THRESHOLDS.windowSize);
    if (recentRequests.length === 0) {
      requestCounts.delete(userId);
    } else {
      requestCounts.set(userId, recentRequests);
    }
  }
}, THRESHOLDS.windowSize);

// Track user activity
const trackActivity = async (userId, action, entityType = 'API', entityId = 'request') => {
  try {
    // Log the activity
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      timestamp: new Date()
    });

    // Update request count
    const now = Date.now();
    const userRequests = requestCounts.get(userId) || [];
    userRequests.push(now);
    requestCounts.set(userId, userRequests);

    // Check if user exceeds threshold
    const recentRequests = userRequests.filter(time => now - time < THRESHOLDS.windowSize);
    if (recentRequests.length >= THRESHOLDS.requestsPerMinute) {
      // Mark user for monitoring
      await User.update(
        { isMonitored: true },
        { where: { id: userId } }
      );
      console.log(`User ${userId} marked for monitoring due to suspicious activity`);
    }
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
};

module.exports = {
  trackActivity
}; 