const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- 1. CREATE OFFER ---
router.post('/add', async (req, res) => {
  const { cropId, buyerId, offerPrice, quantity, totalAmount } = req.body;
  try {
    const newRequest = await prisma.buyerRequest.create({
      data: {
        cropId, buyerId, offerPrice: parseFloat(offerPrice), quantity: parseFloat(quantity),
        message: `Offer: ₹${totalAmount} for ${quantity} kg.`, // Updated text to kg
        status: 'PENDING'
      }
    });
    res.status(201).json({ message: "Offer sent!", request: newRequest });
  } catch (err) {
    res.status(500).json({ error: "Failed to send offer" });
  }
});

// --- 2. FARMER RESPOND (UPDATED FOR PARTIAL SALES) ---
router.put('/status/:requestId', async (req, res) => {
  const { status } = req.body; 
  const { requestId } = req.params;

  try {
    const request = await prisma.buyerRequest.findUnique({
      where: { id: requestId },
      include: { crop: true }
    });

    if (!request) return res.status(404).json({ error: "Request not found" });

    // DATABASE TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Update Request Status
      const updatedReq = await tx.buyerRequest.update({
        where: { id: requestId },
        data: { status }
      });

      // B. IF ACCEPTED: Handle Inventory Deduction
      if (status === 'ACCEPTED') {
        const currentQty = request.crop.quantity;
        const requestedQty = request.quantity;
        const newQuantity = currentQty - requestedQty;
        
        // 1. Validation
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock. You only have ${currentQty} kg left.`);
        }

        // 2. Update Crop Inventory
        await tx.crop.update({
          where: { id: request.cropId },
          data: { 
            quantity: newQuantity,
            status: newQuantity <= 0 ? 'SOLD' : 'ACTIVE' 
          }
        });

        // 3. Create the Official Order 
        await tx.order.create({
          data: {
            displayId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
            cropId: request.cropId,
            buyerId: request.buyerId,
            sellerId: request.crop.farmerId,
            quantity: requestedQty,
            unit: "kg", // Standardized
            totalPrice: request.offerPrice * requestedQty,
            status: 'CONFIRMED' 
          }
        });
        
        // 4. Clean up if out of stock
        if (newQuantity <= 0) {
             await tx.buyerRequest.updateMany({
                 where: { cropId: request.cropId, status: 'PENDING' },
                 data: { status: 'REJECTED' }
             });
        }
      }
      
      return updatedReq;
    });

    res.json({ message: "Status updated successfully", result });

  } catch (err) {
    console.error("Status Update Error:", err.message);
    res.status(400).json({ error: err.message || "Update failed" });
  }
});

// --- 3. GET PENDING REQUESTS FOR A FARMER ---
router.get('/farmer/:farmerId', async (req, res) => {
  const { farmerId } = req.params;
  try {
    const requests = await prisma.buyerRequest.findMany({
      where: {
        crop: { farmerId: farmerId },
        status: 'PENDING'
      },
      include: {
        buyer: { select: { name: true, businessName: true, phone: true, profileImage: true } },
        crop: { select: { name: true, imageUrl: true, quantityUnit: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    console.error("Fetch Requests Error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// 4. GET REQUEST HISTORY (Accepted / Rejected)
router.get('/history/:farmerId', async (req, res) => {
  const { farmerId } = req.params;
  try {
    const requests = await prisma.buyerRequest.findMany({
      where: {
        crop: { farmerId },
        status: { in: ['ACCEPTED', 'REJECTED'] }
      },
      include: {
        buyer: { select: { id: true, name: true, businessName: true, phone: true, profileImage: true } },
        crop: { select: { id: true, name: true, imageUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enhancedRequests = await Promise.all(requests.map(async (req) => {
        if (req.status === 'ACCEPTED') {
            const order = await prisma.order.findFirst({
                where: {
                    cropId: req.cropId,
                    buyerId: req.buyerId
                },
                select: { status: true } 
            });
            return { ...req, orderStatus: order ? order.status : 'CONFIRMED' };
        }
        return req;
    }));

    res.json(enhancedRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;