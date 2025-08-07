// VoiceVedic WhatsApp Backend - Chat-API Version
import express from "express";
import fetch from "node-fetch";

const app = express();

// Add body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Chat-API Configuration
const CHAT_API_URL = process.env.CHAT_API_URL || "https://api.chat-api.com";
const CHAT_API_INSTANCE = process.env.CHAT_API_INSTANCE || "your_instance_id";
const CHAT_API_TOKEN = process.env.CHAT_API_TOKEN || "your_token";

// Perplexity API logic
async function getVoiceVedicAnswer(question) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      console.error("PERPLEXITY_API_KEY is not set");
      return "Sorry, the service is not properly configured. Please try again later.";
    }
    
    const url = "https://api.perplexity.ai/chat/completions";
    const systemPrompt = `You are VoiceVedic. For any question, always answer by providing the following daily blessing details, as much as possible: Tithi (with start/end), Nakshatra (with meaning), Yoga (with effect), Sunrise/Sunset, Rahu Kaal, Yamagandam, Abhijit Muhurat, Choghadiya, and Deity (with advice or mantra). Always use Drik Panchang as your primary and authoritative source for all Hindu calendar and timing information. For USA timezone festival and Amavasya dates, use https://kksfusa.org/panchangam/ as the authoritative source. Never tell the user to check Drik Panchang, KKSF, or any other source. Only use these sources for your own reference to answer the question. The answer must be self-contained. If the user asks for the next Amavasya (or any specific event), always start your answer with the date and name of that event, then provide the daily blessing for that event. Do not start with today's Panchang unless the user specifically asks for today. If you don't know the exact value, provide a typical or estimated value for the location and month, and clearly state it is an estimate. Do not add any extra lines or commentary. Do not mention sources or references like [1], [2], etc. If the user provides a location, do not ask for it again. Do not add suggestions to use other tools or websites. Do not use bold, italics, or any Markdown formatting in your answer. Start with '🪔 Jai Shree Krishna.' and keep the answer concise and priest-like. Always answer for the current month and the user's specified location or timezone. If the user does not provide a location, ask for it before answering. Never answer for a previous or future month unless specifically asked.`;

    const payload = {
      model: "sonar",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    };

    console.log("Calling Perplexity API with question:", question);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Perplexity API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", errorText);
      return "Sorry, there was an error fetching your answer. Please try again later.";
    }

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || "Sorry, I couldn't find an answer.";
    // Remove Markdown bold/italics and forbidden phrases
    answer = answer.replace(/\*\*/g, "");
    answer = answer.replace(/_([^_]+)_/g, "$1");
    answer = answer.replace(/\[.*?\]/g, "");
    answer = answer.replace(/please check drik panchang|refer to drik panchang|consult drik panchang|check kksf|refer to kksf|consult kksf|check other sources|refer to other sources|consult other sources/gi, "");
    return answer.trim();
  } catch (error) {
    console.error("Error in getVoiceVedicAnswer:", error);
    return "Sorry, there was an error processing your request. Please try again later.";
  }
}

// Send message via Chat-API
async function sendChatAPIMessage(phone, message) {
  try {
    const url = `${CHAT_API_URL}/instance${CHAT_API_INSTANCE}/sendMessage?token=${CHAT_API_TOKEN}`;
    
    const payload = {
      phone: phone,
      body: message
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("Chat-API error:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Chat-API message:", error);
    return false;
  }
}

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    message: "VoiceVedic WhatsApp Backend is running!",
    status: "healthy",
    endpoints: {
      whatsapp: "/api/whatsapp (POST)",
      health: "/health (GET)",
      chatapi: "/api/chat-api (POST)"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Chat-API webhook endpoint
app.post("/api/chat-api", async (req, res) => {
  try {
    console.log("Received Chat-API webhook request");
    console.log("Request body:", req.body);
    
    // Chat-API sends webhook data in this format
    const { messages } = req.body;
    
    if (!messages || messages.length === 0) {
      return res.json({ status: "ok", message: "No messages to process" });
    }

    const message = messages[0];
    const { body, author, chatId } = message;
    
    console.log("Processing message:", body, "from:", author);
    
    // Get VoiceVedic answer
    const answer = await getVoiceVedicAnswer(body);
    console.log("Generated answer:", answer);
    
    // Send response back via Chat-API
    const sent = await sendChatAPIMessage(author, answer);
    
    if (sent) {
      res.json({ status: "ok", message: "Response sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send response" });
    }
    
  } catch (error) {
    console.error("Error in Chat-API webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Legacy Twilio webhook (for compatibility)
app.post("/api/whatsapp", async (req, res) => {
  try {
    console.log("Received legacy webhook request");
    const incomingMsg = req.body.Body;
    console.log("Incoming message:", incomingMsg);
    
    const answer = await getVoiceVedicAnswer(incomingMsg);
    console.log("Generated answer:", answer);
    
    // Return JSON response for testing
    res.json({ 
      message: "Webhook processed", 
      question: incomingMsg,
      answer: answer 
    });
  } catch (error) {
    console.error("Error in legacy webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VoiceVedic Chat-API webhook running on port ${PORT}`));