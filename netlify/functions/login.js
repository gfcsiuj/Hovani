const dotenv = require('dotenv'); // For JWT_SECRET if not set by Netlify build/env
const connectToDatabase = require('./_utils/db');
const User = require('../../src/models/User'); // Adjust path as necessary
const jwt = require('jsonwebtoken');

// Load .env variables for local development (netlify dev)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../../../.env' });
}

// Utility to generate JWT - ensure JWT_SECRET and JWT_EXPIRES_IN are available
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
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Please provide email and password' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials (user not found)' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const isMatch = await user.comparePassword(password); // Uses method from User model
    if (!isMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials (password incorrect)' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const token = generateToken(user._id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User logged in successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
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
