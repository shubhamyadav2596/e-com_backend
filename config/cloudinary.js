const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const cloudinaryUrl = process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME.trim();
const apiKey = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.trim();

if (cloudinaryUrl) {
  cloudinary.config({ cloudinary_url: cloudinaryUrl, secure: true });
} else if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
} else {
  throw new Error('Missing Cloudinary env variables: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET');
}

module.exports = cloudinary;
