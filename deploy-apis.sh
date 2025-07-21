#!/bin/bash

# VoiceVedic API Deployment Script
# This script deploys all VoiceVedic APIs to Supabase Edge Functions

set -e  # Exit on any error

echo "🚀 Starting VoiceVedic API Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_error "Please run this script from the project root directory (where supabase/config.toml exists)"
    exit 1
fi

# Check if user is logged in to Supabase
if ! supabase status &> /dev/null; then
    print_error "You are not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

# List of APIs to deploy
APIS=(
    "askvoicevedic-enhanced"
    "calendar-events"
    "spiritual-guidance"
    "match-similar-questions"
    "generate-faq-embeddings"
)

# Deploy each API
for api in "${APIS[@]}"; do
    print_status "Deploying $api..."
    
    if supabase functions deploy "$api" --no-verify-jwt; then
        print_success "$api deployed successfully!"
    else
        print_error "Failed to deploy $api"
        exit 1
    fi
done

print_success "🎉 All VoiceVedic APIs deployed successfully!"

# Display deployment information
echo ""
print_status "Deployment Summary:"
echo "======================"

for api in "${APIS[@]}"; do
    echo "✅ $api"
done

echo ""
print_status "Next Steps:"
echo "=============="
echo "1. Set up environment variables in Supabase dashboard:"
echo "   - OPENAI_API_KEY"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "2. Test your APIs using the provided client library"
echo ""
echo "3. Monitor API usage in the Supabase dashboard"
echo ""
echo "4. Set up database tables if not already created:"
echo "   - vedic_faqs"
echo "   - calendar_queries"
echo "   - spiritual_guidance_sessions"

print_success "Deployment complete! 🎉" 