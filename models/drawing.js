const mongoose = require('mongoose');

const drawingSchema = new mongoose.Schema({
    strokes: [{
        points: [{
            x: Number,
            y: Number
        }],
        color: String,
        username: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Drawing', drawingSchema);