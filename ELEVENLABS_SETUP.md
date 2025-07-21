# ElevenLabs Voice Integration Setup Guide

## 🎤 Overview

VoiceVedic now includes high-quality AI voice synthesis using ElevenLabs for the AskVoiceVedic screen. This provides a soothing, natural female voice for spiritual guidance responses.

## 📋 Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io)
2. **API Key**: Get your API key from the ElevenLabs dashboard
3. **Supabase Setup**: Ensure your Supabase project is configured

## 🚀 Setup Steps

### 1. Get ElevenLabs API Key

1. Go to [elevenlabs.io](https://elevenlabs.io) and create an account
2. Navigate to your Profile section
3. Copy your API key from the "API Key" section

### 2. Add API Key to Environment

Add your ElevenLabs API key to the `.env` file in the homepage directory:

```bash
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 3. Deploy Database Migration

Run the deployment script to create the voice settings table:

```bash
./deploy-voice-settings.sh
```

Or manually deploy the migration:

```bash
supabase db push
```

### 4. Restart Development Server

```bash
npm run dev
```

## 🎯 Features

### Voice Settings Panel
- **Access**: Click the "Voice" button in the AskVoiceVedic screen header
- **Voice Selection**: Choose from available ElevenLabs voices
- **Voice Controls**: Play, pause, and stop audio playback
- **Settings Persistence**: Your voice preferences are saved to Supabase

### Available Voices
The system automatically filters for soothing female voices including:
- Rachel (default)
- Sarah
- Emily
- Anna
- Lisa
- And other premade voices

### Voice Quality
- **High Fidelity**: 44.1kHz audio output
- **Natural Speech**: AI-generated with emotional expression
- **Customizable**: Adjust stability, similarity, and style settings
- **Fallback**: Browser speech synthesis if ElevenLabs fails

## 🔧 Technical Details

### Files Added
- `src/lib/elevenlabs.ts` - ElevenLabs API service
- `src/hooks/useVoice.ts` - Voice management hook
- `supabase/migrations/20250102000001_add_voice_settings.sql` - Database schema
- `deploy-voice-settings.sh` - Deployment script

### Database Schema
```sql
voice_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  stability DECIMAL(3,2) DEFAULT 0.5,
  similarity_boost DECIMAL(3,2) DEFAULT 0.5,
  style DECIMAL(3,2) DEFAULT 0.0,
  use_speaker_boost BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### API Integration
- **Text-to-Speech**: Converts spiritual guidance text to speech
- **Voice Streaming**: Real-time audio streaming for better UX
- **Error Handling**: Graceful fallback to browser speech synthesis
- **Rate Limiting**: Respects ElevenLabs API limits

## 🎵 Usage

1. **Ask a Question**: Type or speak your spiritual question
2. **Voice Response**: The AI responds with ElevenLabs voice synthesis
3. **Voice Controls**: Use the voice settings panel to customize
4. **Replay**: Click "Replay" on any message to hear it again

## 🔍 Troubleshooting

### Common Issues

**"Failed to load voices"**
- Check your ElevenLabs API key is correct
- Verify your ElevenLabs account has available credits
- Ensure internet connection is stable

**"Voice synthesis error"**
- The system will automatically fallback to browser speech
- Check browser console for detailed error messages
- Verify ElevenLabs service status

**"Database connection error"**
- Ensure Supabase is properly configured
- Check the voice settings migration was deployed
- Verify RLS policies are active

### Debug Mode
Open browser console to see detailed logs:
- Voice loading status
- API request/response details
- Error messages and fallbacks

## 📚 Resources

- [ElevenLabs Documentation](https://docs.vapi.ai/customization/custom-voices/elevenlabs)
- [ElevenLabs API Reference](https://docs.elevenlabs.io/api-reference)
- [Supabase Documentation](https://supabase.com/docs)

## 🎉 Success Indicators

✅ Voice settings panel appears in AskVoiceVedic screen  
✅ Available voices load successfully  
✅ Spiritual guidance responses use ElevenLabs voice  
✅ Voice preferences persist between sessions  
✅ Audio controls work properly  

---

**Note**: ElevenLabs requires a paid subscription for production use. The free tier includes limited monthly characters. 