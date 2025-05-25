const express = require("express");
const cors = require("./config/cors");
const dreamsRouter = require("./api/dreams/route");
const statisticsRouter = require("./api/statistics/routes");
const usersRouter = require("./api/users/route");
const WebSocket = require('ws');
const http = require('http');
const sequelize = require('./config/database');
const { Dream, Tag, User, ActivityLog } = require('./models/associations');

const app = express();
const PORT = 5000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    // Send initial data
    const sendInitialData = async () => {
        try {
            // You can implement this function to get initial data
            const initialData = { type: 'initial', data: [] };
            ws.send(JSON.stringify(initialData));
        } catch (error) {
            console.error('Error sending initial data:', error);
        }
    };

    sendInitialData();

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast to all connected clients
const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Make broadcast available globally
global.wsBroadcast = broadcast;

// Enable CORS
app.use(cors);

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running!" });
});

// Use the dreams router for /api/dreams
app.use("/api/dreams", dreamsRouter);

// Use the statistics router for /api/statistics
app.use("/api/statistics", statisticsRouter);

// Use the users router for /api/users
app.use("/api/users", usersRouter);

// Sync database and start server
async function startServer() {
  try {
    // Sync all models with database
    await sequelize.sync();
    console.log('Database synchronized successfully');

    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created');
    }

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();