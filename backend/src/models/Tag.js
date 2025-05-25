const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define('Tag', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Tag;