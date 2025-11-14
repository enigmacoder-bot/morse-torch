import AudioService from '../AudioService';
import MorseConverterService from '../MorseConverterService';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          stopAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
  },
}));

describe('AudioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await AudioService.releaseResources();
  });

  describe('playMorse', () => {
    it('should play Morse code with valid timings', async () => {
      const morse = MorseConverterService.textToMorse('SOS');
      const timings = MorseConverterService.morseToTiming(morse, 50); // Short duration for testing
      
      let progressCallCount = 0;
      const onProgress = jest.fn(() => {
        progressCallCount++;
      });

      // Start playback (don't await to test async behavior)
      const playPromise = AudioService.playMorse(timings, 1, onProgress);
      
      // Wait a bit for playback to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stop playback
      await AudioService.stopPlayback();
      
      // Progress callback should have been called
      expect(progressCallCount).toBeGreaterThan(0);
    });

    it('should throw error for empty timings', async () => {
      await expect(
        AudioService.playMorse([], 1, jest.fn())
      ).rejects.toThrow('No timings provided');
    });

    it('should throw error for invalid speed', async () => {
      const timings = [{ type: 'dit' as const, duration: 100 }];
      
      await expect(
        AudioService.playMorse(timings, 0.3, jest.fn())
      ).rejects.toThrow('Speed must be between 0.5 and 2.0');
      
      await expect(
        AudioService.playMorse(timings, 2.5, jest.fn())
      ).rejects.toThrow('Speed must be between 0.5 and 2.0');
    });
  });

  describe('pause and resume', () => {
    it('should pause and resume playback', async () => {
      const morse = MorseConverterService.textToMorse('A');
      const timings = MorseConverterService.morseToTiming(morse, 100);
      
      // Start playback
      const playPromise = AudioService.playMorse(timings, 1, jest.fn());
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Pause
      AudioService.pausePlayback();
      expect(AudioService.isPaused()).toBe(true);
      
      // Resume
      await AudioService.resumePlayback();
      expect(AudioService.isPaused()).toBe(false);
      
      // Cleanup
      await AudioService.stopPlayback();
    });
  });

  describe('state management', () => {
    it('should track playing state correctly', async () => {
      expect(AudioService.isPlaying()).toBe(false);
      
      const timings = [{ type: 'dit' as const, duration: 100 }];
      const playPromise = AudioService.playMorse(timings, 1, jest.fn());
      
      // Should be playing after start
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(AudioService.isPlaying()).toBe(true);
      
      // Stop playback
      await AudioService.stopPlayback();
      expect(AudioService.isPlaying()).toBe(false);
    });

    it('should track progress', async () => {
      const timings = [
        { type: 'dit' as const, duration: 100 },
        { type: 'symbolGap' as const, duration: 100 },
      ];
      
      let lastProgress = 0;
      const onProgress = (progress: number) => {
        lastProgress = progress;
      };
      
      const playPromise = AudioService.playMorse(timings, 1, onProgress);
      
      // Wait for some progress
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(lastProgress).toBeGreaterThan(0);
      expect(lastProgress).toBeLessThanOrEqual(1);
      
      await AudioService.stopPlayback();
    });
  });

  describe('resource cleanup', () => {
    it('should release resources properly', async () => {
      const timings = [{ type: 'dit' as const, duration: 100 }];
      
      const playPromise = AudioService.playMorse(timings, 1, jest.fn());
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await AudioService.releaseResources();
      
      expect(AudioService.isPlaying()).toBe(false);
      expect(AudioService.getProgress()).toBe(0);
    });
  });
});
