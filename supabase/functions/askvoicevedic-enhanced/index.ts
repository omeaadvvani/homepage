import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import {
  handleCors,
  successResponse,
  errorResponse,
  callOpenAI,
  validateRequiredFields,
  checkRateLimit,
  logRequest,
} from "../api-utils.ts";

// VoiceVedic system prompt
const VOICE_VEDIC_SYSTEM_PROMPT = `You are a voice-based Hindu calendar assistant named VoiceVedic. Your job is to respond to spiritual and religious timing questions asked by users in simple, calm, spiritual English.

Your response must always follow this 3-line format:

1. Give the exact timing or date.
2. Explain the spiritual or Vedic significance of the event.
3. Suggest what the user should do or observe (e.g., fast, pray, meditate, chant, or rest).

Tone: Peaceful, respectful, and aligned with Indian spiritual traditions. Use clear, non-technical English. Keep responses short and focused.

Do not include greetings, emojis, or unnecessary explanations. Only answer what is asked, in 3 lines maximum.

---

Example Question:  
When is Amavasya this month?

Example Output:  
Amavasya falls on Sunday, June 30.  
It marks the new moon and is ideal for spiritual cleansing and honoring ancestors.  
Observe silence, offer water to your elders, or perform a simple prayer at home.

---`;

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp, 50, 60000)) { // 50 requests per minute
      return errorResponse(
        "Rate limit exceeded. Please try again later.",
        429,
        "Too many requests"
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (_e) {
      return errorResponse(
        "Invalid JSON in request body",
        400,
        "Bad Request"
      );
    }

    // Validate required fields
    const missingFields = validateRequiredFields(body, ["question"]);
    if (missingFields.length > 0) {
      return errorResponse(
        `Missing required fields: ${missingFields.join(", ")}`,
        400,
        "Bad Request"
      );
    }

    const { question, location, calendar, userPreferences } = body;

    // Build context-aware system prompt
    let contextBlock = '';
    if (location && calendar) {
      contextBlock = `The user is located in ${location}. They follow the ${calendar} calendar.`;
    } else if (location) {
      contextBlock = `The user is located in ${location}.`;
    } else if (calendar) {
      contextBlock = `The user follows the ${calendar} calendar.`;
    }

    // Add user preferences if provided
    if (userPreferences) {
      contextBlock += `\nUser preferences: ${JSON.stringify(userPreferences)}`;
    }

    const fullSystemPrompt = contextBlock
      ? `${contextBlock}\n\n${VOICE_VEDIC_SYSTEM_PROMPT}`
      : VOICE_VEDIC_SYSTEM_PROMPT;

    // Call OpenAI with enhanced configuration
    const response = await callOpenAI(
      [
        {
          role: "system",
          content: fullSystemPrompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
      {
        temperature: 0.8, // Slightly higher for more creative responses
        maxTokens: 150, // Shorter responses for voice
        model: "gpt-4o-mini", // Use faster model for voice responses
      }
    );

    // Log successful request
    logRequest(req, startTime);

    // Return structured response
    return successResponse(
      {
        answer: response,
        question: question,
        context: {
          location,
          calendar,
          userPreferences,
        },
        model: "gpt-4o-mini",
        tokens: response.length, // Approximate token count
      },
      "Spiritual guidance provided successfully"
    );

  } catch (error) {
    console.error("Error in askvoicevedic-enhanced function:", error);
    
    // Log failed request
    logRequest(req, startTime);
    
    return errorResponse(
      "I'm unable to respond right now. Please try again in a moment. Your spiritual journey continues with patience and devotion.",
      500,
      error.message
    );
  }
}); 