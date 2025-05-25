const cors = require("cors");

const corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:5000"], // Frontend URLs
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

module.exports = cors(corsOptions);