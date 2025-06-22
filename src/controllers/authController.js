const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Only needed here if we re-hash or directly compare, but good for consistency
const dotenv = require('dotenv');

// Load env vars if not already loaded (e.g. if run in a different context)
if (!process.env.JWT_SECRET) {
    dotenv.config({ path: '../../.env' }); // Adjust path if necessary
}


// Utility function to generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined. Cannot generate token.");
        throw new Error("JWT_SECRET_not_defined"); // Or handle more gracefully
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d', // Default to 1 day if not set
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if all fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide username, email, and password' });
        }

        // Check if user already exists (by username or email)
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            if (user.email === email) {
                return res.status(400).json({ message: `User already exists with email: ${email}` });
            }
            if (user.username === username) {
                return res.status(400).json({ message: `User already exists with username: ${username}` });
            }
        }

        // Create new user instance (password will be hashed by pre-save hook in User model)
        user = new User({
            username,
            email,
            password,
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            // Mongoose validation error
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        console.error('Register User Error:', error.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};


// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body; // Or login with username: const { loginIdentifier, password } = req.body;

    try {
        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials (user not found)' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (password incorrect)' });
        }

        // User authenticated, generate token
        const token = generateToken(user._id);

        res.status(200).json({
            message: 'User logged in successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        console.error('Login User Error:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Optional: Add a route to get current user info based on token (e.g., for client to verify token)
// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private (requires token)
// exports.getMe = async (req, res) => {
//     // This would require authentication middleware to be set up first to extract user from token
//     try {
//         // Assuming auth middleware adds user to req object (e.g., req.user)
//         const user = await User.findById(req.user.id).select('-password'); // Exclude password
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.status(200).json(user);
//     } catch (error) {
//         console.error('GetMe Error:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };
