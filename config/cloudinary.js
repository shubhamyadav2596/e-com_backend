const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(
  CLOUDINARY_URL ||
  (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
);

let cloudinaryConfig = null;
if (isConfigured) {
  if (CLOUDINARY_URL) {
    cloudinaryConfig = { cloudinary_url: CLOUDINARY_URL, secure: true };
    if (!CLOUDINARY_URL.startsWith('cloudinary://')) {
      console.warn('CLOUDINARY_URL should use the cloudinary:// scheme. Example: cloudinary://API_KEY:API_SECRET@CLOUD_NAME');
    }
  } else {
    cloudinaryConfig = {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    };
  }
  cloudinary.config(cloudinaryConfig);
  cloudinary.config({ secure: true });
  console.info('Cloudinary configuration loaded. Cloud name:', cloudinaryConfig.cloud_name || 'from CLOUDINARY_URL');
} else {
  console.warn('Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
}

module.exports = { cloudinary, isConfigured, cloudinaryConfig };
