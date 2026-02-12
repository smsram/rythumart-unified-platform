const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/add', async (req, res) => {
  const { reviewerId, targetId, rating } = req.body;

  try {
    // 1. Create the Review
    await prisma.review.create({
      data: {
        reviewerId,
        targetId,
        rating: parseInt(rating)
      }
    });

    // 2. Calculate New Average
    const aggregations = await prisma.review.aggregate({
      where: { targetId },
      _avg: { rating: true }
    });

    const newAverage = aggregations._avg.rating || 5.0;

    // 3. Update Farmer's Profile
    await prisma.user.update({
      where: { id: targetId },
      data: { rating: newAverage }
    });

    res.json({ message: "Rating submitted", newAverage });

  } catch (err) {
    console.error("Rating Error:", err);
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

module.exports = router;