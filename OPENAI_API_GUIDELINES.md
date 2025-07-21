# VoiceVedic API Guidelines - OpenAI Best Practices

This document outlines how VoiceVedic APIs follow OpenAI's best practices for API development, ensuring reliability, security, and optimal user experience.

## 🎯 Overview

VoiceVedic APIs are built following OpenAI's comprehensive guidelines for:
- **Error Handling**: Proper HTTP status codes and meaningful error messages
- **Rate Limiting**: Protection against API abuse
- **Retry Logic**: Exponential backoff with jitter for resilience
- **Request Validation**: Input sanitization and validation
- **Response Formatting**: Consistent, structured responses
- **Monitoring**: Usage tracking and performance metrics

## 🏗️ Architecture

### API Structure
```
supabase/functions/
├── api-utils.ts              # Shared utilities and OpenAI integration
├── spiritual-guidance/       # Spiritual guidance API
├── calendar-events/          # Calendar events API
├── match-similar-questions/  # Question similarity matching
├── askvoicevedic-enhanced/   # Enhanced Q&A API
└── generate-faq-embeddings/  # FAQ embeddings generator
```

### Frontend Integration
```
src/lib/
└── voicevedic-api.ts         # TypeScript client with retry logic
```

## 🔧 OpenAI Guidelines Implementation

### 1. Error Handling

**Backend (api-utils.ts):**
```typescript
// Specific error codes following OpenAI patterns
if (response.status === 429) {
  throw new Error(`Rate limit exceeded: ${errorMessage}`);
} else if (response.status === 401) {
  throw new Error(`Authentication failed: ${errorMessage}`);
} else if (response.status === 400) {
  throw new Error(`Invalid request: ${errorMessage}`);
} else if (response.status >= 500) {
  throw new Error(`OpenAI server error: ${errorMessage}`);
}
```

**Frontend (voicevedic-api.ts):**
```typescript
// Consistent error handling with retry logic
private async makeRequest<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // API call with proper error handling
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

### 2. Rate Limiting

**Implementation:**
- **Client-side**: 20 requests per minute per IP
- **Server-side**: OpenAI API rate limits respected
- **Graceful degradation**: Fallback responses when limits exceeded

```typescript
// Rate limiting in API functions
const clientIp = req.headers.get("x-forwarded-for") || "unknown";
if (!checkRateLimit(clientIp, 20, 60000)) {
  return errorResponse("Rate limit exceeded. Please try again later.", 429);
}
```

### 3. Request Validation

**Input Sanitization:**
```typescript
// Validate required fields
const missingFields = validateRequiredFields(body, ["question"]);
if (missingFields.length > 0) {
  return errorResponse(`Missing required fields: ${missingFields.join(", ")}`, 400);
}

// OpenAI message validation
for (const message of messages) {
  if (!message.role || !message.content) {
    throw new Error("Each message must have 'role' and 'content' fields");
  }
  if (!['system', 'user', 'assistant'].includes(message.role)) {
    throw new Error(`Invalid role: ${message.role}`);
  }
}
```

### 4. Parameter Clamping

**OpenAI Parameter Validation:**
```typescript
const payload = {
  temperature: Math.max(0, Math.min(2, finalConfig.temperature)), // 0-2
  max_tokens: Math.max(1, Math.min(4096, finalConfig.maxTokens)), // 1-4096
  top_p: Math.max(0, Math.min(1, finalConfig.topP)), // 0-1
  frequency_penalty: Math.max(-2, Math.min(2, finalConfig.frequencyPenalty)), // -2 to 2
  presence_penalty: Math.max(-2, Math.min(2, finalConfig.presencePenalty)), // -2 to 2
};
```

### 5. Retry Logic with Exponential Backoff

**Implementation:**
```typescript
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // API call
  } catch (error) {
    if (attempt < maxRetries) {
      const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 6. Structured Responses

**Standard Response Format:**
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}
```

**Success Response:**
```typescript
return successResponse(
  {
    guidance: response,
    question: question,
    context: { userProfile, spiritualLevel },
    model: "gpt-4o-mini",
    sessionId: crypto.randomUUID(),
  },
  "Spiritual guidance provided with compassion and wisdom"
);
```

### 7. Usage Monitoring

**Token Usage Tracking:**
```typescript
// Log usage for monitoring
const usage = data.usage;
if (usage) {
  console.log(`OpenAI API usage - Tokens: ${usage.total_tokens}, Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}`);
}
```

## 🚀 Deployment

### Quick Deployment
```bash
# Make script executable
chmod +x deploy-improved-apis.sh

# Deploy all APIs
./deploy-improved-apis.sh
```

### Manual Deployment
```bash
# Deploy utilities first
supabase functions deploy api-utils --no-verify-jwt

# Deploy individual APIs
supabase functions deploy spiritual-guidance --no-verify-jwt
supabase functions deploy calendar-events --no-verify-jwt
supabase functions deploy match-similar-questions --no-verify-jwt
supabase functions deploy askvoicevedic-enhanced --no-verify-jwt
supabase functions deploy generate-faq-embeddings --no-verify-jwt
```

## 🔐 Environment Variables

**Required Variables:**
```bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Setting in Supabase Dashboard:**
1. Go to Settings > API
2. Add environment variables in the Functions section
3. Ensure all required variables are set

## 📊 API Endpoints

### Spiritual Guidance
- **Endpoint**: `/functions/v1/spiritual-guidance`
- **Method**: POST
- **Purpose**: Provide personalized spiritual guidance
- **Features**: User context, related wisdom, embedding storage

### Calendar Events
- **Endpoint**: `/functions/v1/calendar-events`
- **Method**: POST
- **Purpose**: Hindu calendar information and auspicious timings
- **Features**: Location-aware, multiple calendar types

### Match Similar Questions
- **Endpoint**: `/functions/v1/match-similar-questions`
- **Method**: POST
- **Purpose**: Find similar questions for suggestions
- **Features**: Embedding-based similarity search

### Ask VoiceVedic Enhanced
- **Endpoint**: `/functions/v1/askvoicevedic-enhanced`
- **Method**: POST
- **Purpose**: General spiritual Q&A
- **Features**: Context-aware responses, user preferences

### FAQ Embeddings Generator
- **Endpoint**: `/functions/v1/generate-faq-embeddings`
- **Method**: POST
- **Purpose**: Generate embeddings for FAQ database
- **Features**: Batch processing, similarity search preparation

## 🧪 Testing

### Frontend Testing
```typescript
// Using the improved API client
const { getSpiritualGuidance } = useVoiceVedicAPI();

try {
  const response = await getSpiritualGuidance({
    question: "How do I perform morning prayers?",
    spiritualLevel: "beginner",
    includeRelatedWisdom: true
  });
  console.log("Response:", response.guidance);
} catch (error) {
  console.error("API Error:", error.message);
}
```

### API Testing
```bash
# Test spiritual guidance API
curl -X POST https://your-project.supabase.co/functions/v1/spiritual-guidance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_anon_key" \
  -d '{"question": "How do I start my spiritual journey?"}'
```

## 📈 Monitoring and Analytics

### Key Metrics
- **API Response Times**: Track performance
- **Error Rates**: Monitor reliability
- **Token Usage**: Track OpenAI costs
- **Rate Limit Hits**: Monitor usage patterns

### Logging
- **Request Logging**: All API calls logged with timestamps
- **Error Logging**: Detailed error information for debugging
- **Usage Logging**: Token consumption and API metrics

## 🔄 Best Practices Checklist

- ✅ **Error Handling**: Specific error codes and messages
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Retry Logic**: Exponential backoff with jitter
- ✅ **Input Validation**: Sanitization and validation
- ✅ **Response Formatting**: Consistent structure
- ✅ **Monitoring**: Usage tracking and metrics
- ✅ **CORS**: Proper cross-origin handling
- ✅ **Authentication**: Secure API access
- ✅ **Documentation**: Clear API documentation
- ✅ **Testing**: Comprehensive test coverage

## 🚨 Troubleshooting

### Common Issues

**1. Rate Limit Exceeded**
- **Solution**: Implement exponential backoff
- **Prevention**: Monitor usage and adjust limits

**2. Authentication Errors**
- **Solution**: Check API keys and permissions
- **Prevention**: Validate environment variables

**3. Network Timeouts**
- **Solution**: Increase timeout values
- **Prevention**: Implement retry logic

**4. Invalid Requests**
- **Solution**: Validate input parameters
- **Prevention**: Use TypeScript interfaces

## 📚 Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/best-practices)

---

**Last Updated**: July 2024
**Version**: 1.0.0
**Status**: Production Ready ✅ 