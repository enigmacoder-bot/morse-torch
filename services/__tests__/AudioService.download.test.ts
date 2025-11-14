import AudioService from '../AudioService';
import MorseConverterService from '../MorseConverterService';
import * as FileSystem from 'expo-file-system';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/directory/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          stopAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
  },
}));

describe('AudioService - Download Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAudioFile', () => {
    it('should generate a WAV file from Morse code timings', async () => {
      const morseCode = '... --- ...'; // SOS
      const timings = MorseConverterService.morseToTiming(morseCode);

      const fileUri = await AudioService.generateAudioFile(timings, 1);

      expect(fileUri).toMatch(/^file:\/\/\/mock\/directory\/morse_\d{8}_\d{6}\.wav$/);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/morse_\d{8}_\d{6}\.wav$/),
        expect.any(String),
        { encoding: 'base64' }
      );
    });

    it('should generate filename with timestamp pattern', async () => {
      const morseCode = '.-'; // A
      const timings = MorseConverterService.morseToTiming(morseCode);

      const fileUri = await AudioService.generateAudioFile(timings, 1);

      // Check filename format: morse_YYYYMMDD_HHMMSS.wav
      expect(fileUri).toMatch(/morse_\d{8}_\d{6}\.wav$/);
    });

    it('should respect speed parameter', async () => {
      const morseCode = '.-'; // A
      const timings = MorseConverterService.morseToTiming(morseCode);

      await AudioService.generateAudioFile(timings, 2);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should throw error for empty timings', async () => {
      await expect(AudioService.generateAudioFile([], 1)).rejects.toThrow('No timings provided');
    });

    it('should throw error for invalid speed', async () => {
      const morseCode = '.-';
      const timings = MorseConverterService.morseToTiming(morseCode);

      await expect(AudioService.generateAudioFile(timings, 0.3)).rejects.toThrow('Speed must be between 0.5 and 2.0');
      await expect(AudioService.generateAudioFile(timings, 2.5)).rejects.toThrow('Speed must be between 0.5 and 2.0');
    });

    it('should handle file system errors gracefully', async () => {
      const morseCode = '.-';
      const timings = MorseConverterService.morseToTiming(morseCode);

      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));

      await expect(AudioService.generateAudioFile(timings, 1)).rejects.toThrow('Audio file generation failed');
    });
  });
});
