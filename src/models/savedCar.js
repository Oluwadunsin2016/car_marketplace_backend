const mongoose = require('mongoose');

const savedCarSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

savedCarSchema.index({ user: 1, car: 1 }, { unique: true });
savedCarSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SavedCar', savedCarSchema);
