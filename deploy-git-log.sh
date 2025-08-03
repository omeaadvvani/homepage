#!/bin/bash

echo "🚀 Deploying Git Log API Integration..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g @supabase/cli"
    echo "   or"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "📦 Deploying git-log Edge Function..."
supabase functions deploy git-log

if [ $? -eq 0 ]; then
    echo "✅ Git Log API Integration deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test the API endpoint:"
    echo "   POST https://lsreburdljvhqksbrckc.supabase.co/functions/v1/git-log"
    echo ""
    echo "2. The GitLogTest component will now work in the browser"
    echo ""
    echo "🔗 Git Log API Documentation:"
    echo "   - number: Number of commits to retrieve (default: 10)"
    echo "   - fields: Array of fields to include"
    echo ""
    echo "💡 Example usage:"
    echo "   { \"number\": 5, \"fields\": [\"hash\", \"authorName\", \"subject\", \"authorDate\"] }"
else
    echo "❌ Deployment failed. Please check your Supabase configuration."
    exit 1
fi 