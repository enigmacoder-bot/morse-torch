import { MorseTiming, TimingConfig } from '../types/morse';

// International Morse Code lookup table
const MORSE_CODE_MAP: Record<string, string> = {
  // Letters A-Z
  'A': '.-',
  'B': '-...',
  'C': '-.-.',
  'D': '-..',
  'E': '.',
  'F': '..-.',
  'G': '--.',
  'H': '....',
  'I': '..',
  'J': '.---',
  'K': '-.-',
  'L': '.-..',
  'M': '--',
  'N': '-.',
  'O': '---',
  'P': '.--.',
  'Q': '--.-',
  'R': '.-.',
  'S': '...',
  'T': '-',
  'U': '..-',
  'V': '...-',
  'W': '.--',
  'X': '-..-',
  'Y': '-.--',
  'Z': '--..',
  
  // Numbers 0-9
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  
  // Punctuation
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  '_': '..--.-',
  '"': '.-..-.',
  '$': '...-..-',
  '@': '.--.-.',
  
  // Space (handled separately)
  ' ': '/'
};

class MorseConverterService {
  private defaultTimingConfig: TimingConfig = {
    timeUnit: 120,
    ditDuration: 120,      // 1 time unit
    dahDuration: 360,      // 3 time units
    symbolGap: 120,        // 1 time unit
    letterGap: 360,        // 3 time units
    wordGap: 840,          // 7 time units
    frequency: 600
  };

  /**
   * Convert text to Morse code
   * @param text - Input text to convert
   * @returns Morse code string with dots, dashes, and forward slashes for word separation
   */
  textToMorse(text: string): string {
    if (!text || text.trim().length === 0) {
      return '';
    }

    const upperText = text.toUpperCase();
    const words = upperText.split(' ');
    
    const morseWords = words.map(word => {
      const letters = word.split('');
      const morseLetters = letters
        .map(char => MORSE_CODE_MAP[char] || '')
        .filter(morse => morse.length > 0);
      
      return morseLetters.join(' ');
    }).filter(word => word.length > 0);

    return morseWords.join(' / ');
  }

  /**
   * Convert Morse code string to timing sequences for audio/flashlight
   * @param morse - Morse code string (dots, dashes, spaces, slashes)
   * @param timeUnit - Base time unit in milliseconds (default: 120)
   * @returns Array of timing objects
   */
  morseToTiming(morse: string, timeUnit: number = 120): MorseTiming[] {
    if (!morse || morse.trim().length === 0) {
      return [];
    }

    const timings: MorseTiming[] = [];
    const config: TimingConfig = {
      ...this.defaultTimingConfig,
      timeUnit,
      ditDuration: timeUnit,
      dahDuration: timeUnit * 3,
      symbolGap: timeUnit,
      letterGap: timeUnit * 3,
      wordGap: timeUnit * 7
    };

    let i = 0;
    while (i < morse.length) {
      const char = morse[i];

      if (char === '.') {
        // Dit (dot)
        timings.push({ type: 'dit', duration: config.ditDuration });
        
        // Add symbol gap if next character is a symbol (not space or slash)
        if (i + 1 < morse.length && morse[i + 1] !== ' ' && morse[i + 1] !== '/') {
          timings.push({ type: 'symbolGap', duration: config.symbolGap });
        }
      } else if (char === '-') {
        // Dah (dash)
        timings.push({ type: 'dah', duration: config.dahDuration });
        
        // Add symbol gap if next character is a symbol (not space or slash)
        if (i + 1 < morse.length && morse[i + 1] !== ' ' && morse[i + 1] !== '/') {
          timings.push({ type: 'symbolGap', duration: config.symbolGap });
        }
      } else if (char === ' ') {
        // Check if this is a letter gap or word gap
        if (i + 1 < morse.length && morse[i + 1] === '/') {
          // Skip this space, word gap will be added when we hit '/'
        } else if (i > 0 && morse[i - 1] === '/') {
          // Skip space after '/', word gap already added
        } else {
          // Letter gap (space between letters)
          timings.push({ type: 'letterGap', duration: config.letterGap });
        }
      } else if (char === '/') {
        // Word gap
        timings.push({ type: 'wordGap', duration: config.wordGap });
      }

      i++;
    }

    return timings;
  }

  /**
   * Get list of all supported characters
   * @returns String containing all supported characters
   */
  getSupportedCharacters(): string[] {
    return Object.keys(MORSE_CODE_MAP).filter(char => char !== ' ');
  }

  /**
   * Validate if text contains only supported characters
   * @param text - Text to validate
   * @returns Object with validation result and unsupported characters
   */
  validateText(text: string): { isValid: boolean; unsupportedChars: string[] } {
    const upperText = text.toUpperCase();
    const unsupportedChars: string[] = [];
    
    for (const char of upperText) {
      if (char !== ' ' && !MORSE_CODE_MAP[char]) {
        if (!unsupportedChars.includes(char)) {
          unsupportedChars.push(char);
        }
      }
    }

    return {
      isValid: unsupportedChars.length === 0,
      unsupportedChars
    };
  }
}

// Export singleton instance
export default new MorseConverterService();
