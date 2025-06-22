const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config(); // Ensures .env is loaded

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route for testing
// app.get('/', (req, res) => {
//     // This will be replaced by serving index.html from public
//     res.send('Chat Server Up and Running');
// });

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
// Future: app.use('/api/users', require('./src/routes/userRoutes'));
// Future: app.use('/api/messages', require('./src/routes/messageRoutes'));


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
