const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET ORDERS FOR A SPECIFIC BUYER (RETAILER)
router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        buyerId: req.params.buyerId 
      },
      include: {
        crop: {
          include: {
            farmer: { 
              select: { name: true, phone: true, location: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    console.error("Fetch Orders Error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 2. UPDATE ORDER STATUS
router.put('/:orderId/status', async (req, res) => {
  const { status } = req.body; // Expecting 'DELIVERED' or 'CANCELLED'
  const { orderId } = req.params;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    res.json({ message: "Order status updated", order: updatedOrder });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;