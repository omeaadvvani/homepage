// VoiceVedic WhatsApp Backend - Environment Test Version
import express from "express";

const app = express();

// Add body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Root route for health check
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

// Environment test endpoint
app.get("/test-env", (req, res) => {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  res.json({ 
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : "none"
  });
});

// WhatsApp webhook - Environment test
app.post("/api/whatsapp", async (req, res) => {
  try {
    console.log("Received WhatsApp webhook request");
    const incomingMsg = req.body.Body;
    console.log("Incoming message:", incomingMsg);
    
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return res.json({ 
        error: "PERPLEXITY_API_KEY is not set",
        message: "Please configure the environment variable"
      });
    }
    
    // Return success for now
    res.json({ 
      message: "Environment test successful", 
      question: incomingMsg,
      hasApiKey: true
    });
  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VoiceVedic WhatsApp webhook running on port ${PORT}`));