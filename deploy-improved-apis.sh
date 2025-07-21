#!/bin/bash

# VoiceVedic Improved API Deployment Script
# Following OpenAI Guidelines for API Development

set -e

echo "🚀 Deploying VoiceVedic APIs with OpenAI Guidelines..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Not in a Supabase project directory. Please run this from the homepage directory.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking environment variables...${NC}"

# Check required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY not set. Please set it in your environment.${NC}"
    echo "export OPENAI_API_KEY=your_openai_api_key"
fi

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_URL not set. Please set it in your environment.${NC}"
    echo "export SUPABASE_URL=your_supabase_project_url"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Please set it in your environment.${NC}"
    echo "export SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key"
fi

echo -e "${BLUE}🔧 Deploying API utilities...${NC}"

# Deploy shared utilities first
supabase functions deploy api-utils --no-verify-jwt

echo -e "${BLUE}🧘 Deploying Spiritual Guidance API...${NC}"

# Deploy spiritual guidance API
supabase functions deploy spiritual-guidance --no-verify-jwt

echo -e "${BLUE}📅 Deploying Calendar Events API...${NC}"

# Deploy calendar events API
supabase functions deploy calendar-events --no-verify-jwt

echo -e "${BLUE}🔍 Deploying Match Similar Questions API...${NC}"

# Deploy match similar questions API
supabase functions deploy match-similar-questions --no-verify-jwt

echo -e "${BLUE}❓ Deploying Ask VoiceVedic Enhanced API...${NC}"

# Deploy ask voicevedic enhanced API
supabase functions deploy askvoicevedic-enhanced --no-verify-jwt

echo -e "${BLUE}📊 Deploying FAQ Embeddings Generator...${NC}"

# Deploy FAQ embeddings generator
supabase functions deploy generate-faq-embeddings --no-verify-jwt

echo -e "${GREEN}✅ All APIs deployed successfully!${NC}"

echo -e "${BLUE}📋 API Endpoints:${NC}"
echo "  • Spiritual Guidance: /functions/v1/spiritual-guidance"
echo "  • Calendar Events: /functions/v1/calendar-events"
echo "  • Match Similar Questions: /functions/v1/match-similar-questions"
echo "  • Ask VoiceVedic: /functions/v1/askvoicevedic-enhanced"
echo "  • FAQ Embeddings: /functions/v1/generate-faq-embeddings"

echo -e "${BLUE}🔧 OpenAI Guidelines Implemented:${NC}"
echo "  ✅ Proper error handling with specific error codes"
echo "  ✅ Retry logic with exponential backoff and jitter"
echo "  ✅ Rate limiting and request validation"
echo "  ✅ Structured API responses"
echo "  ✅ Request/response logging"
echo "  ✅ CORS handling"
echo "  ✅ Environment variable validation"
echo "  ✅ Token usage monitoring"

echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Test the APIs using the frontend application"
echo "2. Monitor API usage and performance"
echo "3. Set up proper environment variables in Supabase dashboard"
echo "4. Configure rate limiting as needed"

echo -e "${GREEN}🎉 Deployment complete! Your VoiceVedic APIs are now running with OpenAI best practices.${NC}" 