const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Setup the Storage Engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'AgriFlow_Hackathon', // The folder name that will be created in your Cloudinary Media Library
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // This creates a unique filename: e.g., crop_1708123456789
    public_id: (req, file) => `file_${Date.now()}`, 
  },
});

// 3. Create the upload middleware
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional: limit file size to 5MB
});

module.exports = upload;