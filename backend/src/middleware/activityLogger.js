const { ActivityLog } = require('../models');

const activityLogger = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      res.locals.responseData = data;
      return originalJson.call(this, data);
    };

    try {
      await next();

      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || res.locals.responseData?.id;
        
        if (entityId) {
          await ActivityLog.create({
            userId: req.user.id,
            action,
            entityType,
            entityId,
            details: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode
            }
          });
        }
      }
    } catch (error) {
      next(error);
    }
  };
};

module.exports = activityLogger; 