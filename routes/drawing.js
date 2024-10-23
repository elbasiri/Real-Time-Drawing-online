const express = require('express');
const router = express.Router();
const Drawing = require('../models/drawing');

// Save drawing
router.post('/save', async (req, res) => {
    try {
        const { strokes } = req.body;
        const drawing = new Drawing({ strokes });
        await drawing.save();
        res.status(201).json({ message: 'Drawing saved successfully' });
    } catch (error) {
        console.error('Save drawing error:', error);
        res.status(500).json({ error: 'Failed to save drawing' });
    }
});

// Get latest drawing
router.get('/latest', async (req, res) => {
    try {
        const drawing = await Drawing.findOne().sort({ createdAt: -1 });
        res.json(drawing);
    } catch (error) {
        console.error('Fetch drawing error:', error);
        res.status(500).json({ error: 'Failed to fetch drawing' });
    }
});

module.exports = router;