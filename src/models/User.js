const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
        // Consider adding maxlength or other password policies if needed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    // We can add more fields later, e.g., profilePicture, status, lastSeen, etc.
});

// Pre-save middleware to hash password before saving
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10); // 10 rounds is generally recommended
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass error to the next middleware/error handler
    }
});

// Method to compare entered password with hashed password in database
UserSchema.methods.comparePassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw error; // Or handle error as appropriate
    }
};

// Consider adding indexes for fields frequently queried, e.g., username, email
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
