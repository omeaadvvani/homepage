#!/bin/bash

# VoiceVedic ElevenLabs Voice Settings Deployment Script
# This script helps deploy the voice settings migration to Supabase

echo "🎤 VoiceVedic ElevenLabs Voice Settings Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the homepage directory"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one with your Supabase credentials."
    exit 1
fi

echo "📋 Steps to deploy voice settings:"
echo ""
echo "1. 📝 Add your ElevenLabs API key to .env file:"
echo "   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here"
echo ""
echo "2. 🗄️  Deploy the voice settings migration to Supabase:"
echo "   supabase db push"
echo ""
echo "3. 🔑 Get your ElevenLabs API key from:"
echo "   https://elevenlabs.io/profile"
echo ""
echo "4. 🎯 The voice settings will be available in the AskVoiceVedic screen"
echo ""

# Check if migration file exists
if [ -f "supabase/migrations/20250102000001_add_voice_settings.sql" ]; then
    echo "✅ Voice settings migration file found"
else
    echo "❌ Voice settings migration file not found"
    exit 1
fi

# Ask user if they want to proceed
read -p "Do you want to deploy the voice settings migration now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying voice settings migration..."
    supabase db push
    echo "✅ Voice settings migration deployed successfully!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Add your ElevenLabs API key to .env file"
    echo "2. Restart your development server"
    echo "3. Test the voice settings in the AskVoiceVedic screen"
else
    echo "⏸️  Deployment skipped. You can run 'supabase db push' manually later."
fi

echo ""
echo "📚 For more information about ElevenLabs integration:"
echo "   https://docs.vapi.ai/customization/custom-voices/elevenlabs"
echo "   https://docs.convai.com/api-docs/plugins-and-integrations/elevenlabs-api-integration" 