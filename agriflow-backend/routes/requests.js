const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- 1. CREATE OFFER (No changes needed here) ---
router.post('/add', async (req, res) => {
  const { cropId, buyerId, offerPrice, quantity, totalAmount } = req.body;
  try {
    const newRequest = await prisma.buyerRequest.create({
      data: {
        cropId, buyerId, offerPrice: parseFloat(offerPrice), quantity: parseFloat(quantity),
        message: `Offer: ₹${totalAmount} for ${quantity} tons.`,
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
  const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
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
        
        // 1. Validation: Ensure enough stock exists
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock. You only have ${currentQty} ${request.crop.quantityUnit} left.`);
        }

        // 2. Update Crop Inventory
        // We only deduct quantity. Unit price remains the same.
        await tx.crop.update({
          where: { id: request.cropId },
          data: { 
            quantity: newQuantity,
            // Only mark SOLD if strictly 0 left. Otherwise keep ACTIVE for other buyers.
            status: newQuantity <= 0 ? 'SOLD' : 'ACTIVE' 
          }
        });

        // 3. Create the Official Order 
        // This makes it visible in Retailer's "My Orders" to mark Delivered later
        await tx.order.create({
          data: {
            displayId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
            cropId: request.cropId,
            buyerId: request.buyerId,
            sellerId: request.crop.farmerId,
            quantity: requestedQty,
            unit: request.crop.quantityUnit,
            totalPrice: request.offerPrice * requestedQty,
            status: 'CONFIRMED' // Retailer can change this to DELIVERED later
          }
        });
        
        // 4. Clean up: If stock is 0, reject other PENDING requests for this crop
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
// UPDATED: Now fetches Order Status to see if deal is Completed/Cancelled
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

    // Enhance requests with Order Status
    const enhancedRequests = await Promise.all(requests.map(async (req) => {
        if (req.status === 'ACCEPTED') {
            // Find the order created from this request
            const order = await prisma.order.findFirst({
                where: {
                    cropId: req.cropId,
                    buyerId: req.buyerId
                },
                select: { status: true } // e.g. 'DELIVERED', 'CANCELLED', 'CONFIRMED'
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