import MorseConverterService from '../MorseConverterService';

describe('MorseConverterService', () => {
  describe('textToMorse', () => {
    it('should convert simple text to Morse code', () => {
      const result = MorseConverterService.textToMorse('SOS');
      expect(result).toBe('... --- ...');
    });

    it('should convert text with spaces to Morse code with word separators', () => {
      const result = MorseConverterService.textToMorse('HELLO WORLD');
      expect(result).toBe('.... . .-.. .-.. --- / .-- --- .-. .-.. -..');
    });

    it('should handle numbers', () => {
      const result = MorseConverterService.textToMorse('123');
      expect(result).toBe('.---- ..--- ...--');
    });

    it('should handle punctuation', () => {
      const result = MorseConverterService.textToMorse('HELLO.');
      expect(result).toBe('.... . .-.. .-.. --- .-.-.-');
    });

    it('should handle lowercase by converting to uppercase', () => {
      const result = MorseConverterService.textToMorse('hello');
      expect(result).toBe('.... . .-.. .-.. ---');
    });

    it('should return empty string for empty input', () => {
      expect(MorseConverterService.textToMorse('')).toBe('');
      expect(MorseConverterService.textToMorse('   ')).toBe('');
    });
  });

  describe('morseToTiming', () => {
    it('should generate timing for a dit', () => {
      const timings = MorseConverterService.morseToTiming('.', 100);
      expect(timings).toHaveLength(1);
      expect(timings[0]).toEqual({ type: 'dit', duration: 100 });
    });

    it('should generate timing for a dah', () => {
      const timings = MorseConverterService.morseToTiming('-', 100);
      expect(timings).toHaveLength(1);
      expect(timings[0]).toEqual({ type: 'dah', duration: 300 });
    });

    it('should add symbol gaps between symbols', () => {
      const timings = MorseConverterService.morseToTiming('.-', 100);
      expect(timings).toHaveLength(3);
      expect(timings[0].type).toBe('dit');
      expect(timings[1].type).toBe('symbolGap');
      expect(timings[2].type).toBe('dah');
    });

    it('should add letter gaps for spaces', () => {
      const timings = MorseConverterService.morseToTiming('. -', 100);
      expect(timings.some(t => t.type === 'letterGap')).toBe(true);
    });

    it('should add word gaps for slashes', () => {
      const timings = MorseConverterService.morseToTiming('. / -', 100);
      expect(timings.some(t => t.type === 'wordGap')).toBe(true);
    });

    it('should return empty array for empty input', () => {
      expect(MorseConverterService.morseToTiming('')).toEqual([]);
    });
  });

  describe('validateText', () => {
    it('should validate supported characters', () => {
      const result = MorseConverterService.validateText('HELLO 123');
      expect(result.isValid).toBe(true);
      expect(result.unsupportedChars).toEqual([]);
    });

    it('should identify unsupported characters', () => {
      const result = MorseConverterService.validateText('HELLO#WORLD');
      expect(result.isValid).toBe(false);
      expect(result.unsupportedChars).toContain('#');
    });
  });

  describe('getSupportedCharacters', () => {
    it('should return array of supported characters', () => {
      const chars = MorseConverterService.getSupportedCharacters();
      expect(chars.length).toBeGreaterThan(0);
      expect(chars).toContain('A');
      expect(chars).toContain('0');
      expect(chars).toContain('.');
    });
  });
});
