const express = require('express');
const router = express.Router();
const { getDreamStats, getTagStats } = require('./controller');

router.get('/dreams', getDreamStats);
router.get('/tags', getTagStats);

module.exports = router; 