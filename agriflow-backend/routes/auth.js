const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- HELPER: Generate 6-Char Random ID ---
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 1. SIGNUP
router.post('/signup', async (req, res) => {
  const { name, phone, email, password, role, location, mainCrops, businessName } = req.body;

  if (!name || !phone || !password || !role || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Check duplicate phone
    const existingUser = await prisma.user.findUnique({ 
      where: { phone: phone } 
    });

    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // 2. Create User
    // We manually generate ID to keep it short (6 chars)
    const newId = generateId(); 

    const newUser = await prisma.user.create({
      data: {
        id: newId, 
        name,
        phone,
        email,
        password,
        role: role === 'FARMER' ? 'FARMER' : 'RETAILER', // Ensure Enum match
        location,
        
        // This field was missing in DB, but now we added it back in Step 1
        mainCrops: role === 'FARMER' ? mainCrops : null, 
        
        businessName: role === 'RETAILER' ? businessName : null
      }
    });

    res.status(201).json({ message: "User created successfully", user: newUser });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Internal Server Error. Check console." });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ 
      message: "Login successful", 
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        location: user.location
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;