const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load .env variables if running locally (Netlify build/functions often handle this)
// This path assumes functions are in netlify/functions and .env is at project root
if (process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI) {
  dotenv.config({ path: '../../../.env' });
}

if (!process.env.MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined.');
  // In a serverless function, throwing an error might be better than process.exit(1)
  // However, this check runs at module load time. If MONGODB_URI isn't set,
  // functions will fail. Netlify environment variables should be used for deployment.
}

/**
 * Mongoose connection state:
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    // console.log('=> using cached database instance');
    return { client: cachedClient, db: cachedDb };
  }

  try {
    // console.log('=> connecting to new database instance');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined. Cannot connect to database.');
    }

    // Mongoose connection options.
    // useNewUrlParser and useUnifiedTopology are default in Mongoose 6+
    // but including them doesn't hurt and might be useful for older setups.
    const opts = {
      bufferCommands: false, // Disable command buffering if you want immediate errors on connection failure
      // useNewUrlParser: true, // default in Mongoose 6+
      // useUnifiedTopology: true, // default in Mongoose 6+
    };

    if (!cachedClient) {
        cachedClient = mongoose.connect(process.env.MONGODB_URI, opts);
    }

    await cachedClient;
    cachedDb = mongoose.connection; // The default connection object

    // console.log('MongoDB connected via Mongoose');
    return { client: cachedClient, db: cachedDb };

  } catch (error) {
    console.error('MongoDB connection error:', error);
    // In a serverless function, you might want to return an error response
    // rather than letting the whole process crash, if connectToDatabase is called per request.
    // However, if it fails at the start, the function won't work anyway.
    throw error; // Re-throw error to be caught by the function handler
  }
}

module.exports = connectToDatabase;
