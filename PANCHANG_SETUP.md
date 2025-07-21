# Panchang API Integration Setup

This guide will help you integrate the Panchang.Click API into your VoiceVedic project for Hindu calendar data and spiritual guidance.

## What is Panchang?

Panchang is the traditional Hindu calendar system that provides:
- **Tithi**: Lunar day (1-30)
- **Nakshatra**: Lunar mansion (27 constellations)
- **Yoga**: Solar-lunar combination
- **Karana**: Half tithi
- **Rashi**: Zodiac sign
- **Maasa**: Lunar month
- **Sunrise/Sunset**: Solar timings

## Setup Steps

### 1. Get Panchang.Click API Credentials

1. Visit [panchang.click](https://panchang.click/)
2. Sign up for an account
3. Get your `userid` and `authcode` from your dashboard
4. Note your API plan limits

### 2. Environment Variables

Add these to your Supabase project environment variables:

```bash
PANCHANG_USER_ID=your_user_id_here
PANCHANG_AUTH_CODE=your_auth_code_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Deploy the Edge Function

```bash
# Make the script executable
chmod +x deploy-panchang-api.sh

# Run the deployment
./deploy-panchang-api.sh
```

### 4. Add to Your App

Import and use the PanchangScreen component:

```tsx
import PanchangScreen from './components/PanchangScreen';

// Add to your routing
<Route path="/panchang" element={<PanchangScreen />} />
```

## API Endpoints

### Panchang Guidance API
- **URL**: `https://your-project-ref.supabase.co/functions/v1/panchang-guidance`
- **Method**: POST
- **Body**:
```json
{
  "question": "What should I focus on today?",
  "date": "19/07/2025",
  "time": "14:30:00",
  "timezone": "5.5",
  "latitude": "28.6139",
  "longitude": "77.2090"
}
```

### Response Format
```json
{
  "guidance": "Based on today's Panchang...",
  "panchang": {
    "tithi": "Ekadashi",
    "nakshatra": "Rohini",
    "yoga": "Shiva",
    "karana": "Bava",
    "rashi": "Cancer",
    "maasa": "Shravana",
    "sunrise": "05:30:00",
    "sunset": "19:15:00"
  },
  "timestamp": "2025-07-19T14:30:00.000Z"
}
```

## Features

### 1. PanchangScreen Component
- Beautiful UI displaying all Panchang elements
- Date selector for historical data
- Real-time location integration
- Responsive design with emojis and colors

### 2. usePanchang Hook
- Automatic data fetching
- Error handling and loading states
- Refresh functionality
- Location-aware requests

### 3. Panchang API Service
- Type-safe API calls
- Automatic date/time formatting
- Error handling and retries
- Environment variable management

### 4. Spiritual Guidance Integration
- Combines Panchang data with OpenAI
- Contextual spiritual advice
- Auspicious timing suggestions
- Respectful and inclusive guidance

## Usage Examples

### Basic Panchang Data
```tsx
import { usePanchang } from '../hooks/usePanchang';

const MyComponent = () => {
  const { panchangData, loading, error } = usePanchang();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Today's Tithi: {panchangData?.tithi}</h2>
      <p>Nakshatra: {panchangData?.nakshatra}</p>
    </div>
  );
};
```

### Spiritual Guidance with Panchang
```tsx
import { panchangApi } from '../lib/panchang-api';

const getGuidance = async (question: string) => {
  const response = await fetch('/functions/v1/panchang-guidance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      date: '19/07/2025',
      time: '14:30:00',
      timezone: '5.5'
    })
  });
  
  const data = await response.json();
  return data.guidance;
};
```

## Error Handling

### Common Issues

1. **API Rate Limits**
   - Check your Panchang.Click plan limits
   - Implement caching for repeated requests
   - Monitor `requestsremaining` in responses

2. **Authentication Errors**
   - Verify `PANCHANG_USER_ID` and `PANCHANG_AUTH_CODE`
   - Check API key validity in Panchang.Click dashboard

3. **Location Issues**
   - Ensure location permissions are granted
   - Provide fallback coordinates for India (default)

4. **Date/Time Format**
   - Use DD/MM/YYYY format for dates
   - Use HH:MM:SS format for times
   - Use decimal hours for timezone (e.g., 5.5 for IST)

## Best Practices

1. **Caching**: Cache Panchang data for the same date/time
2. **Error Recovery**: Provide fallback data when API fails
3. **User Experience**: Show loading states and helpful error messages
4. **Accessibility**: Ensure screen reader compatibility
5. **Performance**: Optimize API calls and minimize requests

## Support

- **Panchang API Docs**: https://panchang.click/
- **API Status**: Check Panchang.Click dashboard
- **Rate Limits**: Monitor your plan usage
- **Technical Issues**: Check Supabase function logs

## Integration with VoiceVedic

The Panchang integration enhances your spiritual guidance app by:

1. **Contextual Advice**: Providing guidance based on current astrological influences
2. **Auspicious Timing**: Suggesting best times for spiritual practices
3. **Cultural Relevance**: Connecting users with traditional Hindu wisdom
4. **Personalization**: Using location data for accurate calculations
5. **Educational Value**: Teaching users about Panchang elements

This creates a more authentic and meaningful spiritual experience for your users. 