const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route for testing
app.get('/', (req, res) => {
    // This will be replaced by serving index.html from public
    res.send('Chat Server Up and Running');
});

// Socket.io connection handling (very basic for now)
io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Future:
// - Connect to MongoDB
// - Setup API routes (auth, messages, users)
// - More sophisticated socket handling
// - Error handling middleware
// - Security headers (helmet)
// - CORS configuration if frontend is on a different domain/port during development
// - Logging (morgan)
