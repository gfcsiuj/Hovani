const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
// const { protect } = require('../middleware/authMiddleware'); // Placeholder for auth middleware

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginUser);

// Example of a protected route (would require authMiddleware)
// @route   GET /api/auth/me
// @desc    Get current logged in user profile
// @access  Private
// router.get('/me', protect, getMe); // getMe would need to be imported from authController

module.exports = router;
