// /agriflow-backend/routes/ai.js

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

// POST /api/ai/predict
// Expects JSON: { "cropName": "Tomato", "location": "Guntur" }
router.post('/predict', (req, res) => {
  const { cropName, location } = req.body;

  if (!cropName || !location) {
    return res.status(400).json({ error: "Missing cropName or location" });
  }

  // 1. Spawn Python Process
  // We pass arguments to the script: python ai_engine.py "Tomato" "Guntur"
  const pythonProcess = spawn('python', ['ai_engine.py', cropName, location]);

  let dataString = '';

  // 2. Collect Data from Python (stdout)
  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  // 3. Handle Errors from Python (stderr)
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  // 4. Send Result back to Frontend when Python finishes
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "AI Engine Failed", details: "Process exited with code " + code });
    }

    try {
      // Parse the JSON string printed by Python
      // Example output from Python: {"crop": "Tomato", "price": 2500, ...}
      const result = JSON.parse(dataString);
      res.json(result);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      res.status(500).json({ error: "Failed to parse AI response", rawData: dataString });
    }
  });
});

module.exports = router;