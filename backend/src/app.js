const express = require("express");
const bodyParser = require("body-parser"); // Optional: Can be replaced with express.json()
const dreamsRoutes = require("./api/dreams/route");
const statisticsRoutes = require('./api/statistics/routes');
const cors = require('cors');
const userRoutes = require('./api/routes/users');
const monitoringService = require('./services/monitoringService');

const app = express();

// Use custom CORS configuration
const corsOptions = require("./config/cors");
app.use(corsOptions);

// Use body parser (or replace with express.json())
app.use(bodyParser.json());

// Routes
app.use("/api/dreams", dreamsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/users', userRoutes);

// Start monitoring service
monitoringService.startMonitoring();

module.exports = app;