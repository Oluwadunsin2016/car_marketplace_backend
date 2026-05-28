const { v2: cloudinary } = require('cloudinary');
const { cloudinary: cloudinaryConfig } = require('./env');

cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
  secure: true,
});

module.exports = cloudinary;
