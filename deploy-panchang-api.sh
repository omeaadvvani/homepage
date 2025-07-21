#!/bin/bash

echo "🚀 Deploying Panchang API Integration..."

# Deploy the panchang-guidance Edge Function
echo "📦 Deploying panchang-guidance Edge Function..."
supabase functions deploy panchang-guidance --project-ref lsreburdljvhqksbrckc

echo "✅ Panchang API Integration deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Supabase dashboard:"
echo "   - PANCHANG_USER_ID: Your Panchang.Click user ID"
echo "   - PANCHANG_AUTH_CODE: Your Panchang.Click auth code"
echo "   - OPENAI_API_KEY: Your OpenAI API key"
echo ""
echo "2. Test the API endpoint:"
echo "   POST https://lsreburdljvhqksbrckc.supabase.co/functions/v1/panchang-guidance"
echo ""
echo "3. Add the PanchangScreen component to your app navigation"
echo ""
echo "🔗 Panchang API Documentation: https://panchang.click/" 