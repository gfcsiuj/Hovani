const dotenv = require('dotenv'); // For JWT_SECRET if not set by Netlify build/env
const connectToDatabase = require('./_utils/db');
const User = require('../../src/models/User'); // Adjust path as necessary
const jwt = require('jsonwebtoken');

// Load .env variables for local development (netlify dev)
// In production, Netlify environment variables should be used.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../../../.env' });
}

// Utility to generate JWT - ensure JWT_SECRET and JWT_EXPIRES_IN are available
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined. Cannot generate token.");
    // This should ideally not happen if environment variables are set up correctly.
    throw new Error("Server configuration error: JWT_SECRET not found.");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

exports.handler = async (event, context) => {
  // Ensure we only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const { username, email, password } = JSON.parse(event.body);

    if (!username || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Please provide username, email, and password' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Connect to DB
    await connectToDatabase();

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      let message = 'User already exists.';
      if (user.email === email) message = `User already exists with email: ${email}`;
      if (user.username === username) message = `User alreadyexists with username: ${username}`;
      return {
        statusCode: 400,
        body: JSON.stringify({ message }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    user = new User({ username, email, password });
    await user.save(); // Password hashing is handled by pre-save hook in User model

    const token = generateToken(user._id);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User registered successfully',
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
    console.error('Registration Error:', error);
    let statusCode = 500;
    let message = 'Server error during registration';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(error.errors).map(val => val.message).join(', ');
    } else if (error.message.includes("JWT_SECRET")) {
        // Specific error for JWT secret not being found
        message = "Server configuration error: Could not generate token.";
    }

    return {
      statusCode,
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
