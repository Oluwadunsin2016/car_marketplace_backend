const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    profileImagePublicId: { type: String, default: null },
    authProvider: { type: String, required: true, default: 'email' },
    role: { type: String, enum: ['user', 'buyer', 'seller', 'dealer'], default: 'user' },
    phone: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    dealerName: { type: String, default: null, trim: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('User', userSchema);
