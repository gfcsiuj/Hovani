const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars if not already loaded (e.g., when running scripts directly)
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '../../.env' }); // Adjust path if necessary, assuming .env is in root
}

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in your environment variables. Please check your .env file.');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6 always behaves as if useNewUrlParser, useUnifiedTopology,
      // and useCreateIndex are true, and useFindAndModify is false.
      // So, they are not strictly necessary but don't hurt.
    });
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
