const User = require('./User');
const Dream = require('./Dream');
const Tag = require('./Tag');
const ActivityLog = require('./ActivityLog');

Dream.belongsToMany(Tag, { through: 'DreamTags' });
Tag.belongsToMany(Dream, { through: 'DreamTags' });

User.hasMany(ActivityLog);
ActivityLog.belongsTo(User);

module.exports = {
  User,
  Dream,
  Tag,
  ActivityLog
};