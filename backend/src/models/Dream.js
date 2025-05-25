const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dream = sequelize.define('Dream', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    files: {
        type: DataTypes.JSONB,  // Store file metadata as JSON
        allowNull: true,
        defaultValue: []
    }
});

module.exports = Dream;