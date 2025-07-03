const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    userId: { // New field for the 8-digit ID
        type: String,
        required: [true, 'User ID is required'],
        unique: true,
        trim: true,
        // Potentially add a regex match for format '90xxxxxx' if needed
        // match: [/^90\d{6}$/, 'User ID must be in the format 90xxxxxx']
    },
    username: { // This will now be the display name
        type: String,
        required: [true, 'Username is required'],
        // unique: true, // Username (display name) might not need to be unique if userId is the primary identifier
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    profilePicture: { // New field for profile picture URL
        type: String,
        trim: true,
        default: '' // Default to an empty string or a placeholder URL
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare entered password with hashed password in database
UserSchema.methods.comparePassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw error;
    }
};

UserSchema.index({ userId: 1 }); // Index for the new userId field
UserSchema.index({ username: 1 }); // Keep index on username if it's frequently searched

const User = mongoose.model('User', UserSchema);

module.exports = User;
