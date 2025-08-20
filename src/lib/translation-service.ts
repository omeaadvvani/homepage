// Google Translate Service - Industry Standard Translation
// Veteran Developer Approach: Reliable, battle-tested, with proper error handling

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

export interface TranslationError {
  error: string;
  originalText: string;
  fallbackText?: string;
}

export class GoogleTranslateService {
  private apiKey: string;
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2';
  
  // Cache for common translations (performance optimization)
  private translationCache = new Map<string, TranslationResult>();
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Main translation method with robust error handling
  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult> {
    
    // Check cache first (veteran optimization)
    const cacheKey = `${text}:${sourceLanguage}:${targetLanguage}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    try {
      // Prepare language codes for Google Translate API
      const sourceLang = this.normalizeLanguageCode(sourceLanguage);
      const targetLang = this.normalizeLanguageCode(targetLanguage);
      
      // If source and target are the same, return original text
      if (sourceLang === targetLang) {
        return {
          translatedText: text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          confidence: 1.0
        };
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'auto' ? undefined : sourceLang,
          target: targetLang,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const translation = data.data.translations[0];
      
      const result: TranslationResult = {
        translatedText: translation.translatedText,
        sourceLanguage: translation.detectedSourceLanguage || sourceLang,
        targetLanguage: targetLang,
        confidence: 0.95 // Google Translate is generally very reliable
      };

      // Cache the result (veteran optimization)
      this.translationCache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('Translation error:', error);
      
      // Return fallback with original text (fail-safe approach)
      return {
        translatedText: text, // Fallback to original text
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        confidence: 0.0
      };
    }
  }

  // Normalize language codes for Google Translate API
  private normalizeLanguageCode(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en-IN': 'en',
      'hi-IN': 'hi', 
      'kn-IN': 'kn',
      'en': 'en',
      'hi': 'hi',
      'kn': 'kn',
      'auto': 'auto'
    };
    
    return languageMap[languageCode] || 'en';
  }

  // Batch translation for multiple texts (performance optimization)
  async translateBatch(
    texts: string[], 
    targetLanguage: string, 
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult[]> {
    
    const sourceLang = this.normalizeLanguageCode(sourceLanguage);
    const targetLang = this.normalizeLanguageCode(targetLanguage);

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: texts,
          source: sourceLang === 'auto' ? undefined : sourceLang,
          target: targetLang,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data.translations.map((translation: {translatedText: string; detectedSourceLanguage?: string}) => ({
        translatedText: translation.translatedText,
        sourceLanguage: translation.detectedSourceLanguage || sourceLang,
        targetLanguage: targetLang,
        confidence: 0.95
      }));

    } catch (error) {
      console.error('Batch translation error:', error);
      
      // Return fallback with original texts
      return texts.map(text => ({
        translatedText: text,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        confidence: 0.0
      }));
    }
  }

  // Clear translation cache (memory management)
  clearCache(): void {
    this.translationCache.clear();
  }

  // Get cache statistics (debugging)
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.translationCache.size,
      keys: Array.from(this.translationCache.keys())
    };
  }
}

// React Hook for Google Translate Service
export function useGoogleTranslate() {
  // Get API key from environment
  const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Translate API key not configured');
    return null;
  }

  const translateService = new GoogleTranslateService(apiKey);

  return {
    translateText: translateService.translateText.bind(translateService),
    translateBatch: translateService.translateBatch.bind(translateService),
    clearCache: translateService.clearCache.bind(translateService),
    getCacheStats: translateService.getCacheStats.bind(translateService)
  };
}

// Spiritual Terms Dictionary (fallback for common terms)
export const SpiritualTermsDictionary = {
  'hi-IN': {
    'When is Diwali': 'दिवाली कब है',
    'Diwali': 'दिवाली',
    'festival': 'त्योहार',
    'today': 'आज',
    'tomorrow': 'कल',
    'Amavasya': 'अमावस्या',
    'Purnima': 'पूर्णिमा',
    'Ekadashi': 'एकादशी',
    'Panchang': 'पंचांग',
    'Rahu Kaal': 'राहु काल',
    'Brahma Muhurtham': 'ब्रह्म मुहूर्त'
  },
  'kn-IN': {
    'When is Diwali': 'ದೀಪಾವಳಿ ಯಾವಾಗ',
    'Diwali': 'ದೀಪಾವಳಿ',
    'festival': 'ಹಬ್ಬ',
    'today': 'ಇಂದು',
    'tomorrow': 'ನಾಳೆ',
    'Amavasya': 'ಅಮಾವಾಸ್ಯೆ',
    'Purnima': 'ಪೂರ್ಣಿಮೆ',
    'Ekadashi': 'ಏಕಾದಶಿ',
    'Panchang': 'ಪಂಚಾಂಗ',
    'Rahu Kaal': 'ರಾಹು ಕಾಲ',
    'Brahma Muhurtham': 'ಬ್ರಹ್ಮ ಮುಹೂರ್ತ'
  }
};

// Utility function to translate using dictionary first, then Google Translate
export async function translateWithFallback(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto',
  apiKey?: string
): Promise<string> {
  
  // Try dictionary first for common spiritual terms
  if (targetLanguage in SpiritualTermsDictionary) {
    const dictionary = SpiritualTermsDictionary[targetLanguage as keyof typeof SpiritualTermsDictionary];
    if (text in dictionary) {
      return dictionary[text as keyof typeof dictionary];
    }
  }
  
  // Use Google Translate for complex translations
  if (apiKey) {
    try {
      const translateService = new GoogleTranslateService(apiKey);
      const result = await translateService.translateText(text, targetLanguage, sourceLanguage);
      return result.translatedText;
    } catch (error) {
      console.warn('Google Translate failed, returning original text:', error);
    }
  }
  
  // Final fallback: return original text
  return text;
}
