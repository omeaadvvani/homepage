import React, { useState, useEffect } from 'react';

interface PerformanceStats {
  apiCalls: number;
  cacheHits: number;
  totalQueries: number;
  averageResponseTime: number;
}

const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    apiCalls: 0,
    cacheHits: 0,
    totalQueries: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    // Monitor console logs for performance data
    const originalLog = console.log;
    let apiCalls = 0;
    let cacheHits = 0;
    let totalQueries = 0;
    let responseTimes: number[] = [];

    console.log = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('🌐 Making API request')) {
        apiCalls++;
      }
      
      if (message.includes('📦 Using cached data')) {
        cacheHits++;
      }
      
      if (message.includes('🚀 Starting query')) {
        totalQueries++;
      }
      
      originalLog.apply(console, args);
    };

    // Update stats every 2 seconds
    const interval = setInterval(() => {
      setStats({
        apiCalls,
        cacheHits,
        totalQueries,
        averageResponseTime: responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0
      });
    }, 2000);

    return () => {
      console.log = originalLog;
      clearInterval(interval);
    };
  }, []);

  const cacheHitRate = stats.totalQueries > 0 
    ? ((stats.cacheHits / stats.totalQueries) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
      <h4 className="text-sm font-semibold text-blue-800 mb-2">Performance Monitor</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-600">API Calls:</span>
          <span className="ml-1 font-semibold text-blue-600">{stats.apiCalls}</span>
        </div>
        <div>
          <span className="text-gray-600">Cache Hits:</span>
          <span className="ml-1 font-semibold text-green-600">{stats.cacheHits}</span>
        </div>
        <div>
          <span className="text-gray-600">Total Queries:</span>
          <span className="ml-1 font-semibold text-purple-600">{stats.totalQueries}</span>
        </div>
        <div>
          <span className="text-gray-600">Cache Hit Rate:</span>
          <span className="ml-1 font-semibold text-orange-600">{cacheHitRate}%</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        💡 Lower API calls = Better performance
      </div>
    </div>
  );
};

export default PerformanceMonitor; 