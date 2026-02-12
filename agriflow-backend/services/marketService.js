const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

async function updateMarketPrices() {
  try {
    // Fetch 100 records to ensure we get a good variety
    const response = await axios.get(
      `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=100`
    );
    
    const records = response.data.records;

    if (!records || records.length === 0) return;

    for (const record of records) {
      const cropName = record.commodity;
      const marketName = `${record.market}, ${record.state}`;
      
      // FIX: Convert Price per Quintal (100kg) -> Price per KG
      const rawPrice = parseFloat(record.modal_price);
      const pricePerKg = rawPrice / 100; 

      // Standardize Unit
      const unit = "kg"; 

      const existing = await prisma.mandiPrice.findFirst({
        where: { cropName, marketName }
      });

      let trend = "stable";
      if (existing) {
        if (pricePerKg > existing.price) trend = "up";
        else if (pricePerKg < existing.price) trend = "down";

        await prisma.mandiPrice.update({
          where: { id: existing.id },
          data: { price: pricePerKg, trend, unit, updatedAt: new Date() }
        });
      } else {
        await prisma.mandiPrice.create({
          data: {
            cropName,
            marketName,
            price: pricePerKg,
            unit, 
            trend: "stable"
          }
        });
      }
    }
    console.log("Market prices updated (Converted to kg).");
  } catch (error) {
    console.error("Market Sync Error:", error.message);
  }
}

module.exports = { updateMarketPrices };