import ErrorHandler from '../ErrorHandler';

describe('ErrorHandler', () => {
  // Suppress console output during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('handleAudioPlaybackError', () => {
    it('should return error notification for audio playback failure', () => {
      const error = new Error('Audio initialization failed');
      const notification = ErrorHandler.handleAudioPlaybackError(error, 'playback');

      expect(notification.type).toBe('error');
      expect(notification.message).toBe('Audio playback failed. Please try again.');
    });

    it('should log error to console', () => {
      const error = new Error('Audio initialization failed');
      ErrorHandler.handleAudioPlaybackError(error, 'playback');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('handleDownloadError', () => {
    it('should return error notification for download failure', () => {
      const error = new Error('File write failed');
      const notification = ErrorHandler.handleDownloadError(error, 'audio generation');

      expect(notification.type).toBe('error');
      expect(notification.message).toBe('Failed to download audio file. Please try again.');
    });

    it('should detect storage full errors', () => {
      const error = new Error('Insufficient storage space');
      const notification = ErrorHandler.handleDownloadError(error, 'audio generation');

      expect(notification.type).toBe('error');
      expect(notification.message).toContain('storage');
    });

    it('should detect disk full errors', () => {
      const error = new Error('Disk full');
      const notification = ErrorHandler.handleDownloadError(error, 'audio generation');

      expect(notification.type).toBe('error');
      expect(notification.message).toContain('storage');
    });
  });

  describe('handleFlashlightError', () => {
    it('should return error notification for flashlight failure', () => {
      const error = new Error('Camera not available');
      const notification = ErrorHandler.handleFlashlightError(error, 'transmission');

      expect(notification.type).toBe('error');
      expect(notification.message).toBe('Flashlight transmission failed. Please try again.');
    });
  });

  describe('handlePermissionDenied', () => {
    it('should return error notification for permission denial', () => {
      const notification = ErrorHandler.handlePermissionDenied('Camera');

      expect(notification.type).toBe('error');
      expect(notification.message).toContain('Camera');
      expect(notification.message).toContain('Permission required');
    });
  });

  describe('handleDeviceUnsupported', () => {
    it('should return warning notification for unsupported feature', () => {
      const notification = ErrorHandler.handleDeviceUnsupported('Flashlight');

      expect(notification.type).toBe('warning');
      expect(notification.message).toContain('Flashlight');
      expect(notification.message).toContain('not available');
    });
  });

  describe('createError', () => {
    it('should create AppError from Error object', () => {
      const error = new Error('Test error');
      const appError = ErrorHandler.createError(error, 'AUDIO_PLAYBACK_FAILED', 'test context');

      expect(appError.type).toBe('AUDIO_PLAYBACK_FAILED');
      expect(appError.message).toBe('Test error');
      expect(appError.context).toBe('test context');
      expect(appError.originalError).toBe(error);
    });

    it('should handle non-Error objects', () => {
      const appError = ErrorHandler.createError('String error', 'UNKNOWN');

      expect(appError.type).toBe('UNKNOWN');
      expect(appError.message).toBe('String error');
    });
  });

  describe('log', () => {
    it('should log info messages', () => {
      ErrorHandler.log('Test info message', 'info');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      ErrorHandler.log('Test warning message', 'warn');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      ErrorHandler.log('Test error message', 'error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
