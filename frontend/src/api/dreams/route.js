const express = require("express");
const { validateDream } = require("./validateDream");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// In-memory storage for dreams
let dreams = [];

// CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// GET: Fetch all dreams with filtering and sorting
router.get("/", (req, res) => {
    const { tag, date, lucid, nightmare, sort, page = 1, limit = 10 } = req.query;

    let filteredDreams = [...dreams];

    // Filtering logic
    if (tag) {
        filteredDreams = filteredDreams.filter((dream) => dream.tags.includes(tag));
    }
    if (date) {
        filteredDreams = filteredDreams.filter((dream) => dream.date === date);
    }
    if (lucid === "true") {
        filteredDreams = filteredDreams.filter((dream) => dream.tags.includes("Lucid"));
    }
    if (nightmare === "true") {
        filteredDreams = filteredDreams.filter((dream) => dream.tags.includes("Nightmare"));
    }

    // Sorting logic
    if (sort === "asc") {
        filteredDreams.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "desc") {
        filteredDreams.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === "dateAsc") {
        filteredDreams.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === "dateDesc") {
        filteredDreams.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedDreams = filteredDreams.slice(startIndex, endIndex);

    // Return paginated results with metadata
    res.status(200).json({
        dreams: paginatedDreams,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(filteredDreams.length / limitNum),
            totalItems: filteredDreams.length,
            hasMore: endIndex < filteredDreams.length
        }
    });
});

// POST: Add a new dream
router.post("/", (req, res) => {
    const newDream = req.body;
    const validation = validateDream(newDream);

    if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
    }

    // Ensure unique ID
    newDream.id = (dreams.length + 1).toString();
    if (dreams.some((dream) => dream.id === newDream.id)) {
        return res.status(400).json({ error: "Duplicate dream ID" });
    }

    dreams.push(newDream);
    res.status(201).json(newDream);
});

// PATCH: Update an existing dream
router.patch("/", (req, res) => {
    const id = req.query.id;
    const updatedDream = req.body;

    const dreamIndex = dreams.findIndex((dream) => dream.id === id);
    if (dreamIndex === -1) {
        return res.status(404).json({ error: "Dream not found" });
    }

    dreams[dreamIndex] = { ...dreams[dreamIndex], ...updatedDream };
    res.status(200).json(dreams[dreamIndex]);
});

// DELETE: Remove an existing dream
router.delete("/", (req, res) => {
    const id = req.query.id;

    const dreamIndex = dreams.findIndex((dream) => dream.id === id);
    if (dreamIndex === -1) {
        return res.status(404).json({ error: "Dream not found" });
    }

    dreams.splice(dreamIndex, 1);
    res.status(204).end();
});

// OPTIONS: Handle preflight requests
router.options("/", (req, res) => {
    res.set(corsHeaders).status(204).end();
});

// Health check endpoint
router.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

// Remove the duplicate download route and replace with this enhanced version
router.get('/download/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

module.exports = router; 