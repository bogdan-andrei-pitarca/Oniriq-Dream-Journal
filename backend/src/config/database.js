const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('Dreams', 'postgres', 'macaroane13', {
    host: 'localhost',
    dialect: 'postgres', // Change to your database dialect (e.g., mysql, sqlite)
    logging: false, // Disable logging for cleaner output
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3, // Maximum amount of connection retries
        timeout: 30000 // Timeout before a retry (in milliseconds)
    }
});

// Test the connection immediately
sequelize
    .authenticate()
    .then(() => {
        console.log('Connection to database has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    });

module.exports = sequelize;