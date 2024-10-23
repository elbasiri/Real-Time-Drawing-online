const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const drawingRoutes = require('./routes/drawing');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Connect to MongoDB
connectDB();

// Routes
app.use('/auth', authRoutes);
app.use('/drawing', drawingRoutes);

// WebSocket handling
const connectedUsers = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {
            case 'draw':
                // Broadcast drawing data to all clients
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'draw',
                            points: data.points,
                            color: data.color,
                            username: data.username
                        }));
                    }
                });
                break;
                
            case 'cursor':
                // Broadcast cursor position
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'cursor',
                            x: data.x,
                            y: data.y,
                            username: data.username
                        }));
                    }
                });
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});