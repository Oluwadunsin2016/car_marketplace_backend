const mongoose = require('mongoose');

const creatorSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    appUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    image: { type: String, default: null },
    imageUrl: { type: String, default: null },
    role: { type: String, default: 'user' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    dealerName: { type: String, default: null },
  },
  { _id: false }
);

const carSchema = new mongoose.Schema(
  {
    creator: { type: creatorSchema, required: true },
    carImages: [{ type: String, required: true }],
    listingTitle: { type: String, required: true, trim: true },
    tagLine: { type: String, default: '', trim: true },
    originalPrice: { type: String, default: '', trim: true },
    sellingPrice: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    condition: { type: String, required: true, trim: true },
    make: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    driveType: { type: String, required: true, trim: true },
    transmission: { type: String, required: true, trim: true },
    fuelType: { type: String, required: true, trim: true },
    mileage: { type: String, required: true, trim: true },
    engineSize: { type: String, default: '', trim: true },
    cylinder: { type: String, default: '', trim: true },
    color: { type: String, required: true, trim: true },
    door: { type: String, required: true, trim: true },
    offerType: { type: String, default: '', trim: true },
    vin: { type: String, default: '', trim: true },
    listingDescription: { type: String, required: true, trim: true },
    features: { type: Map, of: Boolean, default: {} },
    status: { type: String, enum: ['active', 'sold'], default: 'active', index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

carSchema.index({ createdAt: -1 });
carSchema.index({ sellingPrice: 1 });

module.exports = mongoose.model('Car', carSchema);
