// VoiceVedic WhatsApp Backend - Fixed Twilio Import for Render Deployment
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "twilio/lib/twiml/MessagingResponse.js";
const { MessagingResponse } = pkg;
import fetch from "node-fetch";

// Perplexity API logic
async function getVoiceVedicAnswer(question) {
  // Replace with your actual Perplexity API key
  const apiKey = process.env.PERPLEXITY_API_KEY;
  const url = "https://api.perplexity.ai/chat/completions";
  const systemPrompt = `You are VoiceVedic. For any question, always answer by providing the following daily blessing details, as much as possible: Tithi (with start/end), Nakshatra (with meaning), Yoga (with effect), Sunrise/Sunset, Rahu Kaal, Yamagandam, Abhijit Muhurat, Choghadiya, and Deity (with advice or mantra). Always use Drik Panchang as your primary and authoritative source for all Hindu calendar and timing information. For USA timezone festival and Amavasya dates, use https://kksfusa.org/panchangam/ as the authoritative source. Never tell the user to check Drik Panchang, KKSF, or any other source. Only use these sources for your own reference to answer the question. The answer must be self-contained. If the user asks for the next Amavasya (or any specific event), always start your answer with the date and name of that event, then provide the daily blessing for that event. Do not start with today’s Panchang unless the user specifically asks for today. If you don't know the exact value, provide a typical or estimated value for the location and month, and clearly state it is an estimate. Do not add any extra lines or commentary. Do not mention sources or references like [1], [2], etc. If the user provides a location, do not ask for it again. Do not add suggestions to use other tools or websites. Do not use bold, italics, or any Markdown formatting in your answer. Start with '🪔 Jai Shree Krishna.' and keep the answer concise and priest-like. Always answer for the current month and the user's specified location or timezone. If the user does not provide a location, ask for it before answering. Never answer for a previous or future month unless specifically asked.`;

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

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
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
}

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
  const incomingMsg = req.body.Body;
  const answer = await getVoiceVedicAnswer(incomingMsg);
  const twiml = new MessagingResponse();
  twiml.message(answer);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VoiceVedic WhatsApp webhook running on port ${PORT}`));