const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET ALL ADDRESSES FOR A USER
router.get('/:userId', async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// ADD NEW ADDRESS
router.post('/add', async (req, res) => {
  const { userId, label, addressLine, latitude, longitude, isDefault } = req.body;
  
  try {
    // If setting as default, unset others first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label,
        addressLine,
        latitude,
        longitude,
        isDefault: isDefault || false
      }
    });
    res.status(201).json(newAddress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add address" });
  }
});

// DELETE ADDRESS
router.delete('/:id', async (req, res) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete address" });
  }
});

module.exports = router;