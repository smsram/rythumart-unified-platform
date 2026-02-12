const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET REQUESTS FOR A FARMER
// We find requests where the *Crop* belongs to this Farmer ID
router.get('/farmer/:farmerId', async (req, res) => {
  const { farmerId } = req.params;

  try {
    const requests = await prisma.buyerRequest.findMany({
      where: {
        crop: {
          farmerId: farmerId // Deep filter: Request -> Crop -> Farmer
        },
        status: 'PENDING'
      },
      include: {
        buyer: { // Get Buyer Details
          select: { name: true, businessName: true, phone: true, profileImage: true }
        },
        crop: { // Get Crop Details
          select: { name: true, imageUrl: true, quantityUnit: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(requests);
  } catch (err) {
    console.error("Fetch Requests Error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// 2. RESPOND (ACCEPT/REJECT)
router.put('/respond/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'ACCEPTED' or 'REJECTED'

  try {
    await prisma.buyerRequest.update({
      where: { id },
      data: { status }
    });
    res.json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// GET REQUEST HISTORY (Accepted / Rejected)
router.get('/history/:farmerId', async (req, res) => {
  const { farmerId } = req.params;
  try {
    const requests = await prisma.buyerRequest.findMany({
      where: {
        crop: { farmerId },
        status: { in: ['ACCEPTED', 'REJECTED'] } // <--- Filter for history
      },
      include: {
        buyer: { select: { name: true, businessName: true, phone: true, profileImage: true } },
        crop: { select: { name: true, imageUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// MARK CROP AS SOLD
router.put('/sold/:id', async (req, res) => {
  try {
    const updatedCrop = await prisma.crop.update({
      where: { id: req.params.id },
      data: { status: 'SOLD' }
    });
    res.json(updatedCrop);
  } catch (err) {
    res.status(500).json({ error: "Failed to update crop status" });
  }
});

// --- MAKE AN OFFER (For Retailer) ---
router.post('/add', async (req, res) => {
  const { cropId, buyerId, offerPrice, quantity, message } = req.body;

  if (!cropId || !buyerId || !offerPrice) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newRequest = await prisma.buyerRequest.create({
      data: {
        cropId,
        buyerId,
        offerPrice: parseFloat(offerPrice),
        quantity: parseFloat(quantity || 0),
        message: message || "I am interested in your crop.",
        status: 'PENDING'
      }
    });
    
    res.status(201).json({ message: "Offer sent successfully!", request: newRequest });
  } catch (err) {
    console.error("Make Offer Error:", err);
    res.status(500).json({ error: "Failed to send offer" });
  }
});

module.exports = router;