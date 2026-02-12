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
      const currentPrice = parseFloat(record.modal_price);
      
      // FIX: Agmarknet usually doesn't send a 'unit' field, it implies Quintal (100kg)
      // If the API sends it, use it; otherwise default to "Quintal"
      const unit = record.unit || "Quintal"; 

      const existing = await prisma.mandiPrice.findFirst({
        where: { cropName, marketName }
      });

      let trend = "stable";
      if (existing) {
        if (currentPrice > existing.price) trend = "up";
        else if (currentPrice < existing.price) trend = "down";

        await prisma.mandiPrice.update({
          where: { id: existing.id },
          data: { price: currentPrice, trend, unit, updatedAt: new Date() }
        });
      } else {
        await prisma.mandiPrice.create({
          data: {
            cropName,
            marketName,
            price: currentPrice,
            unit, // Save the unit
            trend: "stable"
          }
        });
      }
    }
    console.log("Market prices updated.");
  } catch (error) {
    console.error("Market Sync Error:", error.message);
  }
}

module.exports = { updateMarketPrices };