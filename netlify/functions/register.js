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

// Function to generate a unique 8-digit user ID
const generateUniqueUserID = async () => {
  let userID;
  let isUnique = false;
  while (!isUnique) {
    const randomPart = Math.floor(100000 + Math.random() * 900000).toString(); // 6 random digits
    userID = `90${randomPart}`;
    const existingUser = await User.findOne({ userId: userID });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return userID;
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
    const { username, password, profilePicture } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Please provide username and password' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    await connectToDatabase();

    // Check if username (display name) is already taken, if you want it to be unique.
    // For this implementation, we assume username (display name) does not need to be unique,
    // as `userId` is the primary unique identifier.
    // If username needs to be unique, add:
    // const existingUsername = await User.findOne({ username });
    // if (existingUsername) {
    //   return {
    //     statusCode: 400,
    //     body: JSON.stringify({ message: `Username '${username}' is already taken.` }),
    //     headers: { 'Content-Type': 'application/json' },
    //   };
    // }

    const userId = await generateUniqueUserID();

    const user = new User({
      userId,
      username,
      password,
      profilePicture: profilePicture || '', // Use provided URL or default to empty
    });
    await user.save();

    const token = generateToken(user._id); // Still using MongoDB's _id for JWT internal reference

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id, // Mongo's internal ID
          userId: user.userId, // The new 8-digit ID
          username: user.username,
          profilePicture: user.profilePicture,
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
        message = "Server configuration error: Could not generate token.";
    } else if (error.code === 11000 && error.keyPattern && error.keyPattern.userId) { // Handle duplicate userId, though generateUniqueUserID should prevent this
        statusCode = 500; // Should be rare, indicates an issue with ID generation or race condition
        message = "Failed to generate a unique User ID. Please try again.";
    }


    return {
      statusCode,
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
