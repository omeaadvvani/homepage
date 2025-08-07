// VoiceVedic WhatsApp Backend - Simplest Test Version
import express from "express";

const app = express();

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    message: "VoiceVedic WhatsApp Backend is running!",
    status: "healthy"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Simple webhook test
app.post("/api/whatsapp", (req, res) => {
  console.log("Received webhook request");
  res.json({ message: "Webhook received", body: req.body });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VoiceVedic WhatsApp webhook running on port ${PORT}`));