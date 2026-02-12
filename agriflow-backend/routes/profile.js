const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get User Details
    const user = await prisma.user.findUnique({
      where: { id },
      // FIXED: Added 'id: true' below
      select: { 
        id: true, // <--- IMPORTANT: THIS WAS MISSING
        name: true, 
        location: true, 
        profileImage: true, 
        isVerified: true, 
        rating: true,
        bankAccount: true
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // 2. Calculate Earnings
    const allOrders = await prisma.order.findMany({
      where: { sellerId: id, status: { not: 'CANCELLED' } }
    });

    const totalEarnings = allOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = allOrders.filter(order => new Date(order.createdAt) >= startOfMonth);
    const monthEarnings = monthlyOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    res.json({
      user,
      stats: { total: totalEarnings, month: monthEarnings }
    });

  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update Profile Route
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location, profileImage } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, location, profileImage }
    });
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;