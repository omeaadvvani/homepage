import React, { useMemo, useState } from 'react';

interface SectionedAssistantMessageProps {
  content: string;
}

// Renders assistant content in easy-to-scan sections when markers are present.
// Falls back to plain text rendering in the parent if markers are missing.
const SectionedAssistantMessage: React.FC<SectionedAssistantMessageProps> = ({ content }) => {
  const [showAllGuidance, setShowAllGuidance] = useState(false);

  const parsed = useMemo(() => {
    // Normalize incoming content: sometimes AI returns a single line with `-` bullets
    const normalized = content
      // Ensure section headers start on their own lines
      .replace(/(TIMING DETAILS\s*:)/gi, '\n$1')
      .replace(/(GUIDANCE\s*:)/gi, '\n$1')
      // Turn hyphen bullets into line-start bullets
      .replace(/\s[-–—]\s/g, '\n• ')
      // Ensure any existing bullets start on new lines
      .replace(/\s•\s/g, '\n• ')
      // Collapse extra newlines
      .replace(/\n{2,}/g, '\n');

    // Also normalize numbered lists to bullets
    const lines = normalized
      .replace(/\s\d+\.\s/g, '\n• ')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const greetingLines: string[] = [];
    const timingItems: string[] = [];
    const guidanceItems: string[] = [];
    const generalBullets: string[] = [];

    let current: 'none' | 'timing' | 'guidance' = 'none';

    const isTimingHeader = (line: string) => {
      const lower = line.toLowerCase();
      return (
        /📅|🗓|🚩/.test(line) ||
        lower.includes('timing details') ||
        // Hindi common phrase for timing details
        (lower.includes('समय') && lower.includes('विवरण')) ||
        // Kannada common phrase
        (lower.includes('ಸಮಯ') && (lower.includes('ವಿವರ') || lower.includes('ವಿವರಗಳು')))
      );
    };

    const isGuidanceHeader = (line: string) => {
      const lower = line.toLowerCase();
      return (
        /✨|🙏/.test(line) ||
        lower.includes('guidance') ||
        lower.includes('मार्गदर्शन') ||
        lower.includes('ಮಾರ್ಗದರ್ಶನ') ||
        lower.includes('ಉಪದೇಶ')
      );
    };

    for (const line of lines) {
      // Greeting
      if (line.includes('Jai Shree Krishna')) {
        greetingLines.push(line);
        continue;
      }

      // Section markers
      if (isTimingHeader(line)) {
        current = 'timing';
        continue;
      }
      if (isGuidanceHeader(line)) {
        current = 'guidance';
        continue;
      }

      // Items: prioritize bullet format, but allow raw text too
      const asBullet = line.startsWith('•') ? line.slice(1).trim() : line;
      if (current === 'timing') {
        timingItems.push(asBullet);
      } else if (current === 'guidance') {
        guidanceItems.push(asBullet);
      } else {
        // If it looks like a bullet but no section yet, collect as general bullets
        if (line.startsWith('•')) {
          generalBullets.push(asBullet);
        } else {
          // Unsectioned text goes to greeting for a soft intro
          greetingLines.push(line);
        }
      }
    }

    return { greetingLines, timingItems, guidanceItems, generalBullets };
  }, [content]);

  const { greetingLines, timingItems, guidanceItems, generalBullets } = parsed;

  const visibleGuidance = useMemo(() => {
    if (showAllGuidance) return guidanceItems;
    return guidanceItems.length > 8 ? guidanceItems.slice(0, 8) : guidanceItems;
  }, [guidanceItems, showAllGuidance]);

  // If nothing structured is detected, fall back to plain text rendering
  if (timingItems.length === 0 && guidanceItems.length === 0 && generalBullets.length === 0) {
    return (
      <div className="leading-relaxed tracking-spiritual whitespace-pre-line">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {greetingLines.length > 0 && (
        <div className="text-spiritual-900 font-semibold tracking-spiritual">
          {greetingLines[0]}
        </div>
      )}

      {timingItems.length > 0 && (
        <div className="bg-spiritual-50/60 rounded-lg p-4 border-l-4 border-spiritual-400">
          <div className="flex items-center mb-2">
            <h3 className="text-base font-semibold text-spiritual-900 tracking-spiritual">Timing Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 md:max-h-96 overflow-y-auto pr-1">
            {timingItems.map((item, idx) => (
              <div key={`timing-${idx}`} className="flex items-start gap-2 text-spiritual-800 leading-relaxed break-words whitespace-pre-wrap">
                <span className="text-spiritual-600 font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {guidanceItems.length > 0 && (
        <div className="bg-amber-50/60 rounded-lg p-4 border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-2">
            <span role="img" aria-label="sparkles">✨</span>
            <h3 className="text-base font-semibold text-spiritual-900 tracking-spiritual">Guidance</h3>
          </div>
          <div className="space-y-2">
            {visibleGuidance.map((item, idx) => (
              <div key={`guidance-${idx}`} className="flex items-start gap-2 text-spiritual-800 leading-relaxed break-words whitespace-pre-wrap">
                <span className="text-spiritual-600 font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          {guidanceItems.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllGuidance((v) => !v)}
              className="mt-3 text-sm font-medium text-spiritual-700 hover:text-spiritual-800 transition-colors"
            >
              {showAllGuidance ? 'Show less' : `Show ${guidanceItems.length - 8} more`}
            </button>
          )}
        </div>
      )}

      {/* Generic bulleted content when no sections detected */}
      {timingItems.length === 0 && guidanceItems.length === 0 && generalBullets.length > 0 && (
        <div className="bg-white/70 rounded-lg p-4 border border-spiritual-200/60">
          <div className="space-y-2">
            {generalBullets.map((item, idx) => (
              <div key={`general-${idx}`} className="flex items-start gap-2 text-spiritual-800 leading-relaxed break-words whitespace-pre-wrap">
                <span className="text-spiritual-600 font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionedAssistantMessage;


