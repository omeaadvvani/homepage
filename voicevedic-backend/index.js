// VoiceVedic WhatsApp Backend - Minimal Test Version
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// Root route for health check and basic info
app.get("/", (req, res) => {
  res.json({
    message: "VoiceVedic WhatsApp Backend is running!",
    status: "healthy",
    endpoints: {
      whatsapp: "/api/whatsapp (POST)",
      health: "/health (GET)"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/whatsapp", async (req, res) => {
  try {
    console.log("Received WhatsApp webhook request");
    const incomingMsg = req.body.Body;
    console.log("Incoming message:", incomingMsg);
    
    // Simple XML response for testing
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>🪔 Jai Shree Krishna. This is a test response from VoiceVedic. Your message was: ${incomingMsg}</Message>
</Response>`;
    
    console.log("Generated response:", xmlResponse);
    
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(xmlResponse);
  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VoiceVedic WhatsApp webhook running on port ${PORT}`));