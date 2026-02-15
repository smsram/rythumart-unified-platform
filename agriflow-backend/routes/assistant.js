const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { createClient } = require('@deepgram/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

// Initialize Clients
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- HELPER: CONVERT STREAM TO BUFFER ---
const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};

// --- HELPER: GET FARMER CONTEXT ---
async function getFarmerContext(farmerId) {
    if (!farmerId) return "User is anonymous.";

    try {
        const pendingOrders = await prisma.order.count({
            where: { sellerId: farmerId, status: 'PENDING' }
        });

        const activeCrops = await prisma.crop.findMany({
            where: { farmerId, status: 'ACTIVE' },
            select: { name: true, quantity: true, quantityUnit: true }
        });

        const recentSales = await prisma.order.findMany({
            where: { sellerId: farmerId, status: 'CONFIRMED' },
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { crop: { select: { name: true } } }
        });

        const cropSummary = activeCrops.length > 0 
            ? activeCrops.map(c => `${c.name} (${c.quantity} ${c.quantityUnit})`).join(', ')
            : 'No active crops';

        const salesSummary = recentSales.length > 0
            ? recentSales.map(s => s.crop.name).join(', ')
            : 'No recent sales';

        return `
        You are an AI assistant for a farmer on AgriFlow.
        
        LIVE DATA:
        - Pending Orders: ${pendingOrders}
        - Selling Now: ${cropSummary}
        - Just Sold: ${salesSummary}
        
        Answer the user's question clearly and concisely in a spoken style.
        `;
    } catch (e) {
         console.error("Context Error:", e);
        return "Could not fetch farmer data.";
    }
}

// --- INTELLIGENCE: GEMINI 2.5 STRATEGY ---
async function generateResponse(prompt) {
    // 1. Try Gemini 2.5 Flash (Current Standard)
    try {
        console.log("Attempting Gemini 2.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.warn(`Gemini 2.5 Flash failed (${err.status || err.message}). Switching to Lite...`);
        
        // 2. Fallback: Gemini 2.5 Flash-Lite (High Efficiency / Lower Limits)
        try {
            const liteModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const result = await liteModel.generateContent(prompt);
            return result.response.text();
        } catch (liteErr) {
            console.error("All AI models failed:", liteErr.message);
            
            // Handle specific errors gracefully for voice
            if (liteErr.message.includes("429")) {
                return "I'm a bit overwhelmed right now. Please ask again in a few seconds.";
            }
            if (liteErr.message.includes("404")) {
                // Should not happen with 2.5, but just in case
                return "My brain models are currently updating. Please try again later.";
            }
            return "I'm having trouble connecting. Please check your internet.";
        }
    }
}

// --- MAIN ROUTE ---
router.post('/chat', upload.single('audio'), async (req, res) => {
    const { farmerId } = req.body;
    const audioFile = req.file;

    try {
        if (!audioFile) return res.status(400).json({ error: "No audio provided" });

        // 1. STT: Transcribe (Deepgram Nova-2)
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            fs.createReadStream(audioFile.path),
            { model: 'nova-2', smart_format: true }
        );

        if (error) throw new Error("Transcription failed");
        
        const userQuery = result.results?.channels[0]?.alternatives[0]?.transcript;
        console.log("User Asked:", userQuery);

        // Cleanup audio file immediately
        if (fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); 

        if (!userQuery) {
            return res.json({ text: "I didn't hear anything.", audio: null });
        }

        // 2. LLM: Intelligence (Gemini 2.5)
        const context = await getFarmerContext(farmerId);
        const replyText = await generateResponse(`${context}\n\nUser: "${userQuery}"`);

        // 3. TTS: Speak (Deepgram Aura)
        const ttsResponse = await deepgram.speak.request(
            { text: replyText },
            { model: 'aura-asteria-en' }
        );

        const stream = await ttsResponse.getStream();
        const buffer = await streamToBuffer(stream);
        const audioBase64 = buffer.toString('base64');

        res.json({
            userText: userQuery,
            botText: replyText,
            audioBase64: `data:audio/mp3;base64,${audioBase64}`
        });

    } catch (err) {
        console.error("Server Pipeline Error:", err);
        if (audioFile && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);
        res.status(500).json({ error: "Processing failed" });
    }
});

module.exports = router;