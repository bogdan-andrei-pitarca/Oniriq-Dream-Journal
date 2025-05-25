const { trackActivity } = require('../services/monitoringService');

const activityTracker = (customAction) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // Use custom action if provided, otherwise determine from HTTP method
        const action = customAction || (
          req.method === 'GET' ? 'READ' : 
          req.method === 'POST' ? 'CREATE' :
          req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE' :
          req.method === 'DELETE' ? 'DELETE' : 'READ'
        );
        
        const entityType = req.baseUrl.split('/').pop() || 'request';
        const entityId = req.params.id || 'request';

        await trackActivity(req.user.id, action, entityType, entityId);
      }
      next();
    } catch (error) {
      console.error('Error tracking activity:', error);
      next();
    }
  };
};

module.exports = activityTracker; 