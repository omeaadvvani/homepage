import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PanchangData {
  slon: number;
  mlon: number;
  tithinum: number;
  tithi: string;
  paksha: string;
  tithiStart: string;
  tithiTill: string;
  nakshatra_number: number;
  nakshatra: string;
  nakshatraStart: string;
  nakshatraTill: string;
  yoga: string;
  yogTill: string;
  karana: string;
  karanTill: string;
  rashi: string;
  sunrise: string;
  sunset: string;
  maasa: string;
  requestsremaining: number;
  requeststotal: number;
  plan: string;
  status: string;
  reqdate: string;
  reqtime: string;
  reqtz: string;
  reqlat: string;
  reqlon: string;
}

function getFormattedLocalDate(dateString: string, timezoneOffset: number) {
  // dateString: "19/07/2025" or "9/7/2025"
  const [day, month, year] = dateString.split('/');
  // Pad day and month to 2 digits
  const dayPadded = day.padStart(2, '0');
  const monthPadded = month.padStart(2, '0');
  const dateObj = new Date(`${year}-${monthPadded}-${dayPadded}T00:00:00.000Z`);
  // Adjust for timezone offset in hours
  const localTime = new Date(dateObj.getTime() + timezoneOffset * 60 * 60 * 1000);
  return localTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Function to fix incorrect years in Panchang data
function fixIncorrectYears(panchangData: PanchangData): PanchangData {
  const currentYear = new Date().getFullYear().toString();
  
  // Helper function to fix year in datetime string
  const fixYearInDateTime = (dateTimeString: string): string => {
    if (!dateTimeString || typeof dateTimeString !== 'string') return dateTimeString;
    
    // Handle various date formats
    // Format 1: "02-08-1909 15:37:00" (DD-MM-YYYY HH:MM:SS)
    // Format 2: "15-02-1910 03:37:00" (DD-MM-YYYY HH:MM:SS)
    // Format 3: "2025-08-02 15:37:00" (YYYY-MM-DD HH:MM:SS)
    
    const parts = dateTimeString.split(' ');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const dateComponents = datePart.split('-');
      
      if (dateComponents.length === 3) {
        let day, month, year;
        
        // Determine format based on first component length
        if (dateComponents[0].length === 4) {
          // Format: YYYY-MM-DD
          [year, month, day] = dateComponents;
        } else {
          // Format: DD-MM-YYYY
          [day, month, year] = dateComponents;
        }
        
        // Always use current year (2025) regardless of what the API returns
        const correctedYear = currentYear;
        const correctedMonth = month.padStart(2, '0');
        const correctedDay = day.padStart(2, '0');
        
        return `${correctedYear}-${correctedMonth}-${correctedDay} ${timePart}`;
      }
    }
    
    return dateTimeString;
  };
  
  // Fix years in all datetime fields
  return {
    ...panchangData,
    tithiStart: fixYearInDateTime(panchangData.tithiStart),
    tithiTill: fixYearInDateTime(panchangData.tithiTill),
    nakshatraStart: fixYearInDateTime(panchangData.nakshatraStart),
    nakshatraTill: fixYearInDateTime(panchangData.nakshatraTill),
    yogTill: fixYearInDateTime(panchangData.yogTill),
    karanTill: fixYearInDateTime(panchangData.karanTill)
  };
}

function buildTodayMessage(panchang: PanchangData, timezone: string) {
  const tz = parseFloat(timezone) || 5.5;
  const normalDate = getFormattedLocalDate(panchang.reqdate, tz);
  const sunrise = panchang.sunrise?.slice(0,5) || '';
  const tithiEnd = panchang.tithiTill?.slice(11,16) || '';
  return `🪔 Jai Shree Krishna.\nToday is ${normalDate} – ${panchang.tithi}, ${panchang.paksha} Paksha, ${panchang.maasa} Maasa.\nSunrise at ${sunrise}. You may pray peacefully till ${tithiEnd}.`;
}

const globalInstruction = `
Respond only in 3 lines, use respectful Hindu tone, and never start with date/time — always begin with a greeting (e.g., Jai Shree Krishna).
`;

function buildTodayPrompt(panchang: PanchangData, timezone: string) {
  const tz = parseFloat(timezone) || 5.5;
  const normalDate = getFormattedLocalDate(panchang.reqdate, tz);
  const sunrise = panchang.sunrise?.slice(0,5) || '';
  const tithiEnd = panchang.tithiTill?.slice(11,16) || '';
  return `You're VoiceVedic, a peaceful Hindu calendar assistant.\n\nWhen a user asks "What day is today", your answer must be:\n1. A warm spiritual greeting (e.g., Jai Shree Krishna)\n2. The weekday and Gregorian date in full\n3. Panchang elements: Tithi, Paksha, Maasa\n4. Tithi end time (if available)\n5. A closing suggestion only if relevant (e.g., fast, rest, or pray)\n\nAvoid giving extra spiritual context unless the day is a known event or festival. Use only 3 calm and clear lines in your response.\n\n🪔 Jai Shree Krishna.\nToday is ${normalDate} – ${panchang.tithi}, ${panchang.paksha} Paksha, ${panchang.maasa} Maasa.\nTithi ends at ${tithiEnd || 'unknown'}.`;
}

function buildEventPrompt(eventName: string, eventDate: string, tithiStart: string, tithiEnd: string) {
  return `You are VoiceVedic, a spiritual calendar assistant.\n\nWhen a user asks about the next festival or event (like Amavasya, Ekadashi, Poornima), respond with:\n1. The name of the event\n2. The full date (weekday + date)\n3. The start and end time of the tithi\n4. Ask if they'd like to know what to do on that day\n\nDo not give spiritual meaning unless the user asks. Be calm and clear.\n\n🪔 Jai Shree Krishna.\nThe next ${eventName} falls on ${eventDate}.\nIt begins at ${tithiStart} and ends at ${tithiEnd}. Would you like to know what to do on this day?`;
}

async function findNextEvent(event: string, startDate: string, timezone: string, lat?: string, lon?: string, userId?: string, authCode?: string): Promise<{date: string, panchang: PanchangData} | null> {
  // Map event names to Tithi and Paksha
  const eventMap: Record<string, { tithi: string, paksha?: string }> = {
    amavasya: { tithi: 'Amavasya' },
    poornima: { tithi: 'Purnima' },
    purnima: { tithi: 'Purnima' },
    ekadashi: { tithi: 'Ekadashi' },
    pradosh: { tithi: 'Trayodashi' },
    sankashti: { tithi: 'Chaturthi', paksha: 'Krishna' },
    chaturthi: { tithi: 'Chaturthi' },
    ashtami: { tithi: 'Ashtami' },
    dwadashi: { tithi: 'Dwadashi' },
    trayodashi: { tithi: 'Trayodashi' },
    navami: { tithi: 'Navami' },
    dashami: { tithi: 'Dashami' },
    saptami: { tithi: 'Saptami' },
    shashti: { tithi: 'Shashthi' },
    panchami: { tithi: 'Panchami' },
    tithi: { tithi: 'Tithi' },
    pratipada: { tithi: 'Pratipada' },
    dwitiya: { tithi: 'Dwitiya' },
    tritiya: { tithi: 'Tritiya' },
    chaturdashi: { tithi: 'Chaturdashi' }
  };
  const eventKey = event.toLowerCase();
  const eventCriteria = eventMap[eventKey];
  if (!eventCriteria) return null;

  // Parse start date
  const [day, month, year] = startDate.split('/');
  let dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
  const tz = parseFloat(timezone) || 5.5;

  for (let i = 0; i < 60; i++) {
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    const timeStr = '06:00:00';
    const panchang = await fetchPanchangData(dateStr, timeStr, timezone, lat, lon, userId, authCode);
    if (panchang) {
      // Check if tithi matches at 6:00 AM
      const tithiMatch = panchang.tithi && panchang.tithi.toLowerCase() === eventCriteria.tithi.toLowerCase();
      const pakshaMatch = !eventCriteria.paksha || (panchang.paksha && panchang.paksha.toLowerCase() === eventCriteria.paksha.toLowerCase());
      // Check if tithiStart or tithiTill for this tithi falls within this day
      let tithiStartMatch = false;
      let tithiTillMatch = false;
      if (panchang.tithiStart) {
        const [startDay, startMonth, startYearAndTime] = panchang.tithiStart.split('-');
        const [startYear] = startYearAndTime.split(' ');
        if (parseInt(startDay) === dateObj.getDate() && parseInt(startMonth) === (dateObj.getMonth() + 1) && parseInt(startYear) === dateObj.getFullYear()) {
          tithiStartMatch = true;
        }
      }
      if (panchang.tithiTill) {
        const [tillDay, tillMonth, tillYearAndTime] = panchang.tithiTill.split('-');
        const [tillYear] = tillYearAndTime.split(' ');
        if (parseInt(tillDay) === dateObj.getDate() && parseInt(tillMonth) === (dateObj.getMonth() + 1) && parseInt(tillYear) === dateObj.getFullYear()) {
          tithiTillMatch = true;
        }
      }
      if ((tithiMatch && pakshaMatch) || tithiStartMatch || tithiTillMatch) {
        // If any match, return this date
        return { date: dateStr, panchang };
      }
    }
    // Next day
    dateObj.setDate(dateObj.getDate() + 1);
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, question, date, time, timezone, latitude, longitude, userId, authCode, eventType } = body

    // Handle different actions
    if (action === 'validate_credentials') {
      // Use credentials from request body instead of environment variables
      const panchangUserId = userId || Deno.env.get('PANCHANG_USER_ID')
      const panchangAuthCode = authCode || Deno.env.get('PANCHANG_AUTH_CODE')
      
      if (!panchangUserId || !panchangAuthCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credentials not provided or configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Test credentials by making a simple API call
      const testParams = new URLSearchParams({
        userid: panchangUserId,
        authcode: panchangAuthCode,
        date: '27/07/2025',
        time: '06:00:00',
        tz: '5.5'
      })

      const testResponse = await fetch(`https://api.panchang.click/v0.4/panchangapip1?${testParams.toString()}`)
      
      if (!testResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const testData = await testResponse.json()
      
      if (testData.status !== 'ok') {
        return new Response(
          JSON.stringify({ success: false, error: 'API returned error status' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Credentials validated successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'get_panchang') {
      if (!date || !latitude || !longitude) {
        return new Response(
          JSON.stringify({ success: false, error: 'Date, latitude, and longitude are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Ensure we have the correct date format
      let formattedDate = date;
      let targetDate = date;
      
      // If date is in YYYY-MM-DD format, convert to DD/MM/YYYY
      if (date.includes('-')) {
        const [year, month, day] = date.split('-');
        formattedDate = `${day}/${month}/${year}`;
        targetDate = `${year}-${month}-${day}`;
      } else if (date.includes('/')) {
        // If date is already in DD/MM/YYYY format, convert to YYYY-MM-DD for internal use
        const [day, month, year] = date.split('/');
        targetDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      console.log('📅 Received date:', date);
      console.log('📅 Formatted date for API:', formattedDate);
      console.log('📅 Target date for response:', targetDate);
      
      const timeStr = time || '06:00:00'
      const tz = timezone || '5.5'

      const panchangData = await fetchPanchangData(formattedDate, timeStr, tz, latitude.toString(), longitude.toString(), userId, authCode)
      
      if (!panchangData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch Panchang data' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Transform the data to match frontend expectations
      const transformedData = {
        tithi: panchangData.tithi || '',
        nakshatra: panchangData.nakshatra || '',
        yoga: panchangData.yoga || '',
        karana: panchangData.karana || '',
        rashi: panchangData.rashi || '',
        maasa: panchangData.maasa || '',
        paksha: panchangData.paksha || '',
        sunrise: panchangData.sunrise || '',
        sunset: panchangData.sunset || '',
        date: targetDate, // Use the exact requested date
        time: timeStr,
        location: `${latitude}, ${longitude}`,
        tithiTill: panchangData.tithiTill || '',
        tithinum: panchangData.tithinum,
        tithiStart: panchangData.tithiStart || '',
        nakshatraStart: panchangData.nakshatraStart || '',
        nakshatraTill: panchangData.nakshatraTill || '',
        yogaStart: panchangData.yoga || '',
        yogaTill: panchangData.yogTill || '',
        karanaStart: panchangData.karana || '',
        karanaTill: panchangData.karanTill || '',
        vaar: new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' }),
        vaar_number: new Date(targetDate).getDay()
      }

      return new Response(
        JSON.stringify({ success: true, data: transformedData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'find_next_event') {
      if (!eventType || !latitude || !longitude) {
        return new Response(
          JSON.stringify({ success: false, error: 'Event type, latitude, and longitude are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const today = new Date()
      const startDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
      const tz = timezone || '5.5'

      const nextEvent = await findNextEvent(eventType, startDate, tz, latitude.toString(), longitude.toString(), userId, authCode)
      
      if (!nextEvent) {
        return new Response(
          JSON.stringify({ success: false, error: 'Could not find next event' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Transform the event data
      const eventData = {
        date: nextEvent.date,
        tithi: nextEvent.panchang.tithi,
        nakshatra: nextEvent.panchang.nakshatra,
        paksha: nextEvent.panchang.paksha,
        maasa: nextEvent.panchang.maasa,
        vaar: new Date(nextEvent.date.split('/').reverse().join('-')).toLocaleDateString('en-US', { weekday: 'long' }),
        startTime: nextEvent.panchang.tithiStart,
        endTime: nextEvent.panchang.tithiTill
      }

      return new Response(
        JSON.stringify({ success: true, event: eventData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Legacy support for the original question-based approach
    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required for legacy mode' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Panchang data
    const panchangData = await fetchPanchangData(date, time, timezone, latitude, longitude, userId, authCode)
    
    if (!panchangData) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Panchang data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Detect 'What day is today?' and similar queries
    const todayPatterns = [
      /what day is it/i,
      /what day is today/i,
      /today'?s? date/i,
      /which day is today/i,
      /aaj ka din/i,
      /today'?s? panchang/i,
      /today'?s? tithi/i,
      /today'?s? maasa/i,
      /today'?s? sunrise/i,
      /today'?s? details/i
    ];
    const isTodayQuery = todayPatterns.some((pat) => pat.test(question));

    // Detect event queries (e.g., next Amavasya, Ekadashi, Poornima)
    const eventPatterns = [
      /next\s+(amavasya|ekadashi|poornima|purnima|pradosh|sankashti|chaturthi|ashtami|dwadashi|trayodashi|navami|dashami|saptami|shashti|panchami|tithi)/i,
      /when is the next\s+(amavasya|ekadashi|poornima|purnima|pradosh|sankashti|chaturthi|ashtami|dwadashi|trayodashi|navami|dashami|saptami|shashti|panchami|tithi)/i,
      /kab hai next\s+(amavasya|ekadashi|poornima|purnima|pradosh|sankashti|chaturthi|ashtami|dwadashi|trayodashi|navami|dashami|saptami|shashti|panchami|tithi)/i
    ];
    const isEventQuery = eventPatterns.some((pat) => pat.test(question));

    if (isTodayQuery) {
      const tz = parseFloat(timezone) || 5.5;
      const message = buildTodayMessage(panchangData, timezone);
      
      return new Response(
        JSON.stringify({
          message,
          panchang: panchangData,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (isEventQuery) {
      const eventMatch = question.match(/next\s+(\w+)/i);
      if (eventMatch) {
        const eventName = eventMatch[1];
        const today = new Date();
        const startDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        const nextEvent = await findNextEvent(eventName, startDate, timezone, latitude, longitude, userId, authCode);
        
        if (nextEvent) {
          const tz = parseFloat(timezone) || 5.5;
          const normalDate = getFormattedLocalDate(nextEvent.date, tz);
          const tithiStart = nextEvent.panchang.tithiStart?.slice(11,16) || '';
          const tithiEnd = nextEvent.panchang.tithiTill?.slice(11,16) || '';
          
          const message = `🪔 Jai Shree Krishna.\nThe next ${eventName} falls on ${normalDate}.\nIt begins at ${tithiStart} and ends at ${tithiEnd}. Would you like to know what to do on this day?`;
          
          return new Response(
            JSON.stringify({
              message,
              event: {
                name: eventName,
                date: nextEvent.date,
                panchang: nextEvent.panchang
              },
              timestamp: new Date().toISOString()
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
    }

    // Generate spiritual guidance using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const guidancePrompt = createGuidancePrompt(question, panchangData)
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are VoiceVedic, a spiritual Hindu calendar assistant. Provide guidance based on Panchang (Hindu calendar) data. Be respectful, supportive, and practical in your advice.'
          },
          {
            role: 'user',
            content: guidancePrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    })

    if (!openaiResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate guidance' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiData = await openaiResponse.json()
    const guidance = openaiData.choices[0]?.message?.content || 'Unable to generate guidance at this time.'

    return new Response(
      JSON.stringify({
        guidance,
        panchang: panchangData,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in panchang-guidance function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchPanchangData(
  date: string,
  time: string,
  timezone: string,
  latitude?: string,
  longitude?: string,
  userId?: string,
  authCode?: string
): Promise<PanchangData | null> {
  try {
    // Use provided credentials or fall back to environment variables
    const panchangUserId = userId || Deno.env.get('PANCHANG_USER_ID')
    const panchangAuthCode = authCode || Deno.env.get('PANCHANG_AUTH_CODE')

    if (!panchangUserId || !panchangAuthCode) {
      console.error('Panchang API credentials not configured')
      return null
    }

    const params = new URLSearchParams({
      userid: panchangUserId,
      authcode: panchangAuthCode,
      date,
      time,
      tz: timezone
    })

    if (latitude && longitude) {
      params.append('lat', latitude)
      params.append('lon', longitude)
    }

    const response = await fetch(`https://api.panchang.click/v0.4/panchangapip1?${params.toString()}`)
    
    if (!response.ok) {
      console.error('Panchang API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data.status !== 'ok') {
      console.error('Panchang API returned error status:', data.status)
      return null
    }

    // Fix incorrect years in the response data
    const fixedData = fixIncorrectYears(data)
    
    return fixedData
  } catch (error) {
    console.error('Error fetching Panchang data:', error)
    return null
  }
}

function createGuidancePrompt(question: string, panchangData: PanchangData): string {
  return `Based on today's Panchang (Hindu calendar) data, please provide spiritual guidance for this question: "${question}"

Today's Panchang Information:
- Tithi (Lunar Day): ${panchangData.tithi} (${panchangData.paksha})
- Nakshatra (Lunar Mansion): ${panchangData.nakshatra}
- Yoga (Solar-Lunar Combination): ${panchangData.yoga}
- Karana (Half Tithi): ${panchangData.karana}
- Rashi (Zodiac Sign): ${panchangData.rashi}
- Maasa (Lunar Month): ${panchangData.maasa}
- Sunrise: ${panchangData.sunrise}
- Sunset: ${panchangData.sunset}

Please provide guidance that:
1. Acknowledges the current astrological influences
2. Offers practical spiritual advice
3. Suggests auspicious activities or practices for this time
4. Maintains a warm, supportive tone
5. Is respectful of all spiritual paths

Keep your response concise (2-3 paragraphs) and focus on practical wisdom that can help the person in their daily life.`
} 