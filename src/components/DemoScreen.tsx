import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Sparkles, RotateCcw, Volume2 } from 'lucide-react';

interface DemoScreenProps {
  onBack: () => void;
}

const DemoScreen: React.FC<DemoScreenProps> = ({ onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSacredText, setShowSacredText] = useState(false);

  const demoQuestions = [
    {
      question: "When is Amavasya this month?",
      response: {
        line1: "Amavasya falls on Sunday, June 30.",
        line2: "It marks the new moon and is ideal for spiritual cleansing.",
        line3: "A good day for silence, prayers, and ancestral offerings."
      }
    },
    {
      question: "When is Pradosham this week?",
      response: {
        line1: "Pradosham falls on Friday, June 28.",
        line2: "It's a time to honor Lord Shiva and seek forgiveness.",
        line3: "Fasting and evening prayer are recommended."
      }
    },
    {
      question: "What is Rahukalam today?",
      response: {
        line1: "Today's Rahukalam is from 1:30 PM to 3:00 PM.",
        line2: "Avoid starting new tasks during this period.",
        line3: "Used in Vedic astrology for timing awareness."
      }
    }
  ];

  const currentDemo = demoQuestions[currentQuestionIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-show response after question appears
    const timer = setTimeout(() => {
      handleAskQuestion();
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  const handleAskQuestion = () => {
    setIsTyping(true);
    setShowResponse(false);
    
    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      setShowResponse(true);
    }, 2000);
  };

  const handleTryAnother = () => {
    setShowResponse(false);
    setIsTyping(false);
    
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => (prev + 1) % demoQuestions.length);
    }, 300);
  };

  const handleReset = () => {
    setShowResponse(false);
    setIsTyping(false);
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="min-h-screen bg-spiritual-gradient relative overflow-hidden">
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-saffron-400/10 via-transparent to-maroon-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-saffron-200/60 hover:bg-white hover:shadow-xl hover:border-saffron-300 transition-all duration-300 text-maroon-800 font-medium font-soft-sans"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 text-saffron-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm tracking-spiritual">Back</span>
        </button>
      </div>

      {/* Reset Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleReset}
          className="group flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-saffron-200/60 hover:bg-white hover:shadow-xl hover:border-saffron-300 transition-all duration-300 text-maroon-800 font-medium font-soft-sans"
          title="Reset Demo"
        >
          <RotateCcw className="w-4 h-4 text-saffron-600 group-hover:rotate-180 transition-transform duration-300" />
          <span className="text-sm tracking-spiritual">Reset</span>
        </button>
      </div>
      
      {/* Sacred Beginning Text - Bottom Right */}
      <div className={`absolute bottom-8 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-3xl md:text-4xl font-spiritual text-maroon-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ fontFamily: '"Noto Serif Devanagari", "Tiro Devanagari", serif' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative z-10">
        
        {/* Header Section - Enhanced Typography */}
        <div className="text-center mb-18 max-w-3xl" style={{ marginTop: '72px' }}>
          <h1 className="text-5xl md:text-6xl font-spiritual font-bold text-maroon-900 mb-6 leading-spiritual tracking-spiritual">
            Ask VoiceVedic
          </h1>
          
          <p className="text-2xl text-maroon-800/80 font-medium font-soft-sans mb-4 tracking-wide-spiritual leading-relaxed-spiritual">
            Try how it works — no login needed
          </p>
          
          <div className="flex items-center justify-center gap-3 text-maroon-700/70">
            <Volume2 className="w-6 h-6" />
            <span className="text-lg font-soft-sans tracking-spiritual">Experience our spiritual AI assistant</span>
          </div>
        </div>

        {/* Demo Chat Interface */}
        <div className="w-full max-w-3xl space-y-8">
          
          {/* User Question Bubble */}
          <div className="flex justify-end">
            <div className="max-w-lg">
              <div className="bg-gradient-to-r from-saffron-400 to-saffron-500 text-white px-8 py-6 rounded-3xl rounded-tr-lg shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium font-soft-sans opacity-90 tracking-spiritual">You asked:</span>
                </div>
                <p className="text-xl font-medium font-soft-sans tracking-spiritual">
                  {currentDemo.question}
                </p>
              </div>
            </div>
          </div>

          {/* VoiceVedic Response Bubble */}
          <div className="flex justify-start">
            <div className="max-w-lg">
              {/* Typing Indicator */}
              {isTyping && (
                <div className="bg-white/95 backdrop-blur-sm border border-saffron-200/60 px-8 py-6 rounded-3xl rounded-tl-lg shadow-xl mb-6">
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-6 h-6 text-saffron-600 animate-pulse" />
                    <span className="text-maroon-800 font-medium font-soft-sans text-lg tracking-spiritual">VoiceVedic is thinking...</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-saffron-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actual Response */}
              {showResponse && (
                <div className={`bg-white/95 backdrop-blur-sm border border-saffron-200/60 px-8 py-6 rounded-3xl rounded-tl-lg shadow-xl transition-all duration-500 transform ${
                  showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-saffron-600" />
                    <span className="text-lg font-medium font-soft-sans text-maroon-800 tracking-spiritual">VoiceVedic says:</span>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">
                      {currentDemo.response.line1}
                    </p>
                    <p className="text-lg text-maroon-800 font-soft-sans leading-relaxed-spiritual">
                      {currentDemo.response.line2}
                    </p>
                    <p className="text-lg text-maroon-700/80 font-soft-sans leading-relaxed-spiritual">
                      {currentDemo.response.line3}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Try Another Button */}
          {showResponse && (
            <div className="flex justify-center pt-8">
              <button
                onClick={handleTryAnother}
                className="group relative overflow-hidden flex items-center justify-center gap-4 px-10 py-5 bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-500 hover:to-yellow-500 text-white font-semibold font-soft-sans rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-saffron-600/30 hover:border-yellow-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-200/50"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-saffron-400 to-yellow-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
                
                <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
                <span className="text-xl tracking-spiritual">Try Another Question</span>
              </button>
            </div>
          )}

          {/* Demo Progress Indicator */}
          <div className="flex justify-center pt-6">
            <div className="flex gap-3">
              {demoQuestions.map((_, index) => (
                <div
                  key={index}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === currentQuestionIndex
                      ? 'bg-saffron-500 w-8'
                      : 'bg-saffron-200 w-3'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Call to Action */}
          {showResponse && (
            <div className="text-center pt-12">
              <div className="bg-gradient-to-r from-cream-50 to-saffron-50 border border-saffron-200/60 rounded-3xl p-8 shadow-lg">
                <h3 className="text-2xl font-semibold font-spiritual text-maroon-900 mb-4 tracking-spiritual">
                  Ready to start your spiritual journey?
                </h3>
                <p className="text-maroon-700/80 mb-6 font-soft-sans text-lg leading-relaxed-spiritual tracking-spiritual">
                  Sign up to get personalized daily guidance, ritual reminders, and access to our complete spiritual calendar.
                </p>
                <button
                  onClick={onBack}
                  className="group relative overflow-hidden inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-maroon-500 to-maroon-600 hover:from-maroon-600 hover:to-red-600 text-white font-semibold font-soft-sans rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-maroon-700/30 hover:border-red-600/50 focus:outline-none focus:ring-4 focus:ring-maroon-200/50"
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-maroon-500 to-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
                  
                  <span className="text-lg tracking-spiritual">Get Started</span>
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoScreen;