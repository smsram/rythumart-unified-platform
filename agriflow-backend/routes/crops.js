// agriflow-backend/routes/crops.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper for 6-char ID
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// CREATE CROP
router.post('/add', async (req, res) => {
  // Add location, latitude, longitude to destructuring
  const { name, price, quantity, farmerId, imageUrl, aiGrade, qualityScore, location, latitude, longitude } = req.body;
  
  try {
    const newCrop = await prisma.crop.create({
      data: {
        id: generateId(),
        name,
        price: parseFloat(price),
        unit: "/Quintal",
        quantity: parseFloat(quantity),
        quantityUnit: "Tons",
        imageUrl: imageUrl, 
        aiGrade: aiGrade || "Pending",
        qualityScore: parseInt(qualityScore) || 0,
        
        // --- NEW FIELDS ---
        location: location || "Unknown Location",
        latitude: parseFloat(latitude) || 0.0,
        longitude: parseFloat(longitude) || 0.0,
        
        farmerId: farmerId,
        status: 'ACTIVE'
      }
    });
    res.status(201).json(newCrop);
  } catch (err) {
    console.error("Add Crop Error:", err);
    res.status(500).json({ error: "Database error while adding crop" });
  }
});

// GET FARMER CROPS
router.get('/farmer/:id', async (req, res) => {
  try {
    const crops = await prisma.crop.findMany({
      where: { farmerId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(crops);
  } catch (err) {
    console.error("Fetch Crops Error:", err);
    res.status(500).json({ error: "Failed to fetch crops" });
  }
});

// --- GET MARKETPLACE LISTINGS (For Retailer Home) ---
router.get('/market', async (req, res) => {
  try {
    const crops = await prisma.crop.findMany({
      where: { 
        status: 'ACTIVE' // Only show active crops
      },
      include: { 
        farmer: { 
          // We only need specific details, not the password!
          select: { 
            id: true,
            name: true, 
            location: true, 
            phone: true, 
            isVerified: true,
            rating: true 
          } 
        } 
      }, 
      orderBy: { createdAt: 'desc' }
    });
    res.json(crops);
  } catch (err) {
    console.error("Market Data Error:", err);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

module.exports = router;