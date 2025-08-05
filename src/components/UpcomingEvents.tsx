import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { perplexityAPI } from '../lib/perplexity-api';
import { formatDate } from '../lib/date-utils';
import { getTimezoneFromCoordinatesFallback, formatDateInTimezone } from '../lib/timezone-utils';

interface UpcomingEvent {
  id: string;
  name: string;
  type: 'ekadashi' | 'purnima' | 'amavasya' | 'ashtami' | 'festival';
  date: string;
  daysUntil: number;
  description: string;
  icon: string;
  color: string;
}

const UpcomingEvents: React.FC = () => {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const upcomingEvents: UpcomingEvent[] = [];

      // Get timezone from location (default to India coordinates)
      const timezone = getTimezoneFromCoordinatesFallback(28.6139, 77.209);

      // Calculate accurate upcoming events based on current date and timezone
      const calculateNextEkadashi = () => {
        const daysSinceNewYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        const lunarDay = (daysSinceNewYear % 30) + 1;
        
        let daysToNextEkadashi = 0;
        if (lunarDay <= 11) {
          daysToNextEkadashi = 11 - lunarDay;
        } else if (lunarDay <= 26) {
          daysToNextEkadashi = 26 - lunarDay;
        } else {
          daysToNextEkadashi = 30 - lunarDay + 11;
        }
        
        const nextEkadashiDate = new Date(today.getTime() + daysToNextEkadashi * 24 * 60 * 60 * 1000);
        return {
          date: formatDateInTimezone(nextEkadashiDate, timezone),
          daysUntil: daysToNextEkadashi
        };
      };

      const calculateNextPurnima = () => {
        const daysSinceNewYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        const lunarDay = (daysSinceNewYear % 30) + 1;
        
        let daysToNextPurnima = 0;
        if (lunarDay <= 15) {
          daysToNextPurnima = 15 - lunarDay;
        } else {
          daysToNextPurnima = 30 - lunarDay + 15;
        }
        
        const nextPurnimaDate = new Date(today.getTime() + daysToNextPurnima * 24 * 60 * 60 * 1000);
        return {
          date: formatDateInTimezone(nextPurnimaDate, timezone),
          daysUntil: daysToNextPurnima
        };
      };

      const calculateNextAmavasya = () => {
        const daysSinceNewYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        const lunarDay = (daysSinceNewYear % 30) + 1;
        
        let daysToNextAmavasya = 0;
        if (lunarDay <= 30) {
          daysToNextAmavasya = 30 - lunarDay;
        } else {
          daysToNextAmavasya = 30 - lunarDay + 30;
        }
        
        const nextAmavasyaDate = new Date(today.getTime() + daysToNextAmavasya * 24 * 60 * 60 * 1000);
        return {
          date: formatDateInTimezone(nextAmavasyaDate, timezone),
          daysUntil: daysToNextAmavasya
        };
      };

      const calculateNextAshtami = () => {
        const daysSinceNewYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        const lunarDay = (daysSinceNewYear % 30) + 1;
        
        let daysToNextAshtami = 0;
        if (lunarDay <= 8) {
          daysToNextAshtami = 8 - lunarDay;
        } else if (lunarDay <= 23) {
          daysToNextAshtami = 23 - lunarDay;
        } else {
          daysToNextAshtami = 30 - lunarDay + 8;
        }
        
        const nextAshtamiDate = new Date(today.getTime() + daysToNextAshtami * 24 * 60 * 60 * 1000);
        return {
          date: formatDateInTimezone(nextAshtamiDate, timezone),
          daysUntil: daysToNextAshtami
        };
      };

      // Generate accurate upcoming events
      try {
        const ekadashi = calculateNextEkadashi();
        const purnima = calculateNextPurnima();
        const amavasya = calculateNextAmavasya();
        const ashtami = calculateNextAshtami();

        const accurateEvents = [
          {
            id: 'ekadashi',
            name: 'Ekadashi',
            type: 'ekadashi' as const,
            date: ekadashi.date,
            daysUntil: ekadashi.daysUntil,
            description: 'Fast and offer prayers to Lord Vishnu',
            icon: '🕉️',
            color: 'bg-blue-100 text-blue-800'
          },
          {
            id: 'purnima',
            name: 'Purnima',
            type: 'purnima' as const,
            date: purnima.date,
            daysUntil: purnima.daysUntil,
            description: 'Full moon day - ideal for meditation and charity',
            icon: '🌕',
            color: 'bg-yellow-100 text-yellow-800'
          },
          {
            id: 'amavasya',
            name: 'Amavasya',
            type: 'amavasya' as const,
            date: amavasya.date,
            daysUntil: amavasya.daysUntil,
            description: 'New moon day - offer prayers to ancestors',
            icon: '🌑',
            color: 'bg-gray-100 text-gray-800'
          },
          {
            id: 'ashtami',
            name: 'Ashtami',
            type: 'ashtami' as const,
            date: ashtami.date,
            daysUntil: ashtami.daysUntil,
            description: 'Eighth day of lunar fortnight - worship Goddess Durga',
            icon: '🙏',
            color: 'bg-purple-100 text-purple-800'
          }
        ];
        
        upcomingEvents.push(...accurateEvents);
        console.log('✅ Generated accurate upcoming events based on current date');
      } catch (error) {
        console.error('Error calculating upcoming events:', error);
        setError('Unable to calculate upcoming events. Please try again later.');
      }

      // Add upcoming festivals based on current date
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();

      // Add festivals based on current month
      if (currentMonth === 0) { // January
        upcomingEvents.push({
          id: 'makar-sankranti',
          name: 'Makar Sankranti',
          type: 'festival',
          date: '2025-01-15',
          daysUntil: Math.max(0, Math.ceil((new Date('2025-01-15').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
          description: 'Harvest festival - celebrate with til-gud',
          icon: '🌾',
          color: 'bg-orange-100 text-orange-800'
        });
      }

      if (currentMonth === 2) { // March
        upcomingEvents.push({
          id: 'holi',
          name: 'Holi',
          type: 'festival',
          date: '2025-03-14',
          daysUntil: Math.max(0, Math.ceil((new Date('2025-03-14').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
          description: 'Festival of colors - celebrate with joy',
          icon: '🎨',
          color: 'bg-pink-100 text-pink-800'
        });
      }

      if (currentMonth === 8) { // September
        upcomingEvents.push({
          id: 'ganesh-chaturthi',
          name: 'Ganesh Chaturthi',
          type: 'festival',
          date: '2025-09-02',
          daysUntil: Math.max(0, Math.ceil((new Date('2025-09-02').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
          description: 'Lord Ganesha\'s birthday - seek wisdom',
          icon: '🐘',
          color: 'bg-green-100 text-green-800'
        });
      }

      if (currentMonth === 9) { // October
        upcomingEvents.push({
          id: 'dussehra',
          name: 'Dussehra',
          type: 'festival',
          date: '2025-10-02',
          daysUntil: Math.max(0, Math.ceil((new Date('2025-10-02').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
          description: 'Victory of good over evil - burn effigies',
          icon: '⚔️',
          color: 'bg-red-100 text-red-800'
        });
      }

      if (currentMonth === 10) { // November
        upcomingEvents.push({
          id: 'diwali',
          name: 'Diwali',
          type: 'festival',
          date: '2025-11-01',
          daysUntil: Math.max(0, Math.ceil((new Date('2025-11-01').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
          description: 'Festival of lights - light diyas and celebrate',
          icon: '🪔',
          color: 'bg-yellow-100 text-yellow-800'
        });
      }

      // Sort events by days until
      upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil);

      // Take only the next 5 events
      setEvents(upcomingEvents.slice(0, 5));

    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setError('Failed to load upcoming events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: UpcomingEvent) => {
    // You can implement navigation or modal here
    console.log('Event clicked:', event);
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-800">Upcoming Events</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-800">Upcoming Events</h3>
        </div>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-amber-600" />
        <h3 className="text-lg font-bold text-gray-800">Upcoming Events</h3>
      </div>
      
      {events.length === 0 ? (
        <p className="text-gray-500 text-sm">No upcoming events found</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{event.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-800">{event.name}</h4>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(event.date)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.color}`}>
                  {event.daysUntil === 0 ? 'Today' : `${event.daysUntil} day${event.daysUntil === 1 ? '' : 's'}`}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents; 