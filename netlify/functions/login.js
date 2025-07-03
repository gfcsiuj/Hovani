const dotenv = require('dotenv');
const connectToDatabase = require('./_utils/db');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: require('path').resolve(__dirname, '../../../.env') });
}

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined. Cannot generate token.");
    throw new Error("Server configuration error: JWT_SECRET not found.");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const { userId, password } = JSON.parse(event.body); // Changed from email to userId

    if (!userId || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Please provide User ID and password' }), // Updated message
        headers: { 'Content-Type': 'application/json' },
      };
    }

    await connectToDatabase();

    const user = await User.findOne({ userId }); // Find user by userId
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials (user not found)' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials (password incorrect)' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const token = generateToken(user._id); // Still using MongoDB's _id for JWT

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User logged in successfully',
        token,
        user: {
          id: user._id, // Mongo's internal ID
          userId: user.userId, // The 8-digit ID
          username: user.username,
          profilePicture: user.profilePicture,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('Login Error:', error);
    let message = 'Server error during login';
    if (error.message.includes("JWT_SECRET")) {
        message = "Server configuration error: Could not generate token.";
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
