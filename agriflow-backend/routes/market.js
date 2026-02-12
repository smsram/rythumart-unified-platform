const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { spawn } = require('child_process');
const path = require('path'); 

// 1. GET LIVE MANDI PRICES (List for Selector)
router.get('/prices', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  try {
    const distinctPrices = await prisma.mandiPrice.findMany({
      distinct: ['cropName'],
      orderBy: { updatedAt: 'desc' },
      take: limit
    });
    res.json(distinctPrices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch market prices" });
  }
});

// 2. UNIFIED ANALYSIS ENDPOINT (History + Forecast)
router.post('/analyze', async (req, res) => {
  const { cropName, currentPrice } = req.body;

  try {
    const scriptPath = path.join(__dirname, '../ml/price_predictor.py');
    const pythonProcess = spawn('python', [scriptPath]);

    // Send data to Python (Stdin)
    pythonProcess.stdin.write(JSON.stringify({ cropName, currentPrice }));
    pythonProcess.stdin.end();

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      if (!msg.includes('UserWarning')) {
          console.error(`Python Logic Log: ${msg}`);
      }
    });

    pythonProcess.on('close', (code) => {
      try {
        if (!dataString) throw new Error("No data returned from Python script");
        
        const result = JSON.parse(dataString);
        
        if (result.error) {
            console.error("Python Script Error:", result.error);
            return res.status(500).json(result);
        }

        res.json(result); 
        
      } catch (e) {
        console.error("JSON Parse Error:", e);
        res.status(500).json({ 
            error: "Failed to analyze market", 
            details: "Prediction engine failed to return valid JSON." 
        });
      }
    });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;