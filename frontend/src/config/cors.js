const cors = require("cors");

const corsOptions = {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true, // Allow credentials
    maxAge: 86400, // Cache preflight requests for 24 hours
    optionsSuccessStatus: 204 // Return 204 for OPTIONS requests
};

module.exports = cors(corsOptions); 