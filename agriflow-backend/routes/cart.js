const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET CART ITEMS
router.get('/:buyerId', async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { buyerId: req.params.buyerId },
      include: {
        crop: {
          include: { farmer: { select: { name: true, location: true } } }
        }
      }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// 2. ADD TO CART
router.post('/add', async (req, res) => {
  const { buyerId, cropId, quantity, price } = req.body;
  try {
    const item = await prisma.cartItem.upsert({
      where: { buyerId_cropId: { buyerId, cropId } },
      update: { quantity: { increment: parseFloat(quantity) } }, // Add to existing qty
      create: { buyerId, cropId, quantity: parseFloat(quantity), price: parseFloat(price) }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// 3. UPDATE QUANTITY
router.put('/:id', async (req, res) => {
  const { quantity } = req.body;
  try {
    const updated = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity: parseFloat(quantity) }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// 4. REMOVE ITEM
router.delete('/:id', async (req, res) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: "Remove failed" });
  }
});

// 5. CHECKOUT (Convert Cart -> Orders/Requests)
router.post('/checkout', async (req, res) => {
  const { buyerId, items, paymentMethod } = req.body; // items = [{cartId, cropId, qty, price, total}]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create Requests for each item
      for (const item of items) {
        await tx.buyerRequest.create({
          data: {
            cropId: item.cropId,
            buyerId: buyerId,
            offerPrice: item.price,
            quantity: item.quantity,
            message: `Checkout via Cart (${paymentMethod}).`,
            status: 'PENDING'
          }
        });
        
        // Remove from Cart table
        await tx.cartItem.delete({ where: { id: item.id } });
      }
    });
    
    res.json({ message: "Checkout successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

module.exports = router;