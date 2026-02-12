const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary'); 

// POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    res.json({ 
      message: "Image uploaded successfully", 
      imageUrl: req.file.path 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

module.exports = router;