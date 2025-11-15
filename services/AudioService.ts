import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { MorseTiming } from '../types/morse';

interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  startTime: number;
  pausedTime: number;
  totalDuration: number;
}

class AudioService {
  private sound: Audio.Sound | null = null;
  private playbackState: PlaybackState = {
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    startTime: 0,
    pausedTime: 0,
    totalDuration: 0,
  };
  private progressInterval: NodeJS.Timeout | null = null;
  private playbackTimeout: NodeJS.Timeout | null = null;
  private onProgressCallback: ((progress: number) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private currentTimings: MorseTiming[] = [];
  private currentSpeed: number = 1;
  private readonly FREQUENCY = 600; // Hz

  /**
   * Initialize audio mode for playback
   */
  private async initializeAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('[AudioService] Failed to initialize audio mode:', error);
      if (error instanceof Error) {
        console.error('[AudioService] Error details:', error.message, error.stack);
      }
      throw new Error('Failed to initialize audio');
    }
  }

  /**
   * Generate a WAV file data URI with a sine wave beep tone
   * @param frequency - Frequency in Hz (default: 600)
   * @param duration - Duration in milliseconds
   * @returns Data URI string for WAV audio
   */
  private generateBeepDataUri(frequency: number, duration: number): string {
    const sampleRate = 44100;
    const numSamples = Math.floor((duration / 1000) * sampleRate);
    const amplitude = 0.3; // 30% volume to avoid clipping
    
    // Create WAV file header
    const wavHeader = this.createWavHeader(numSamples, sampleRate);
    
    // Generate sine wave samples
    const samples = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
      samples[i] = Math.floor(sample * 32767); // Convert to 16-bit PCM
    }
    
    // Combine header and samples
    const wavData = new Uint8Array(wavHeader.length + samples.length * 2);
    wavData.set(wavHeader, 0);
    
    // Copy samples as bytes
    const dataView = new DataView(wavData.buffer);
    for (let i = 0; i < samples.length; i++) {
      dataView.setInt16(wavHeader.length + i * 2, samples[i], true);
    }
    
    // Convert to base64
    const base64 = this.arrayBufferToBase64(wavData);
    return `data:audio/wav;base64,${base64}`;
  }

  /**
   * Create WAV file header
   * @param numSamples - Number of audio samples
   * @param sampleRate - Sample rate in Hz
   * @returns Uint8Array containing WAV header
   */
  private createWavHeader(numSamples: number, sampleRate: number): Uint8Array {
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    
    const header = new Uint8Array(44);
    const view = new DataView(header.buffer);
    
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // File size - 8
    this.writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    return header;
  }

  /**
   * Write string to DataView
   * @param view - DataView to write to
   * @param offset - Byte offset
   * @param string - String to write
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Convert Uint8Array to base64 string
   * @param buffer - Uint8Array to convert
   * @returns Base64 encoded string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Calculate total duration of Morse code sequence
   * @param timings - Array of timing objects
   * @param speed - Speed multiplier
   * @returns Total duration in milliseconds
   */
  private calculateTotalDuration(timings: MorseTiming[], speed: number): number {
    return timings.reduce((total, timing) => total + timing.duration / speed, 0);
  }

  /**
   * Play Morse code sequence with timing-based playback
   * @param timings - Array of timing objects
   * @param speed - Speed multiplier (0.5 to 2.0)
   * @param onProgress - Progress callback function
   * @param onComplete - Completion callback function
   */
  async playMorse(
    timings: MorseTiming[],
    speed: number = 1,
    onProgress: (progress: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (timings.length === 0) {
      throw new Error('No timings provided');
    }

    if (speed < 0.5 || speed > 2.0) {
      throw new Error('Speed must be between 0.5 and 2.0');
    }

    try {
      // Initialize audio if not already done
      await this.initializeAudio();

      // Store current playback parameters
      this.currentTimings = timings;
      this.currentSpeed = speed;
      this.onProgressCallback = onProgress;
      this.onCompleteCallback = onComplete || null;

      // Calculate total duration
      const totalDuration = this.calculateTotalDuration(timings, speed);

      // Initialize playback state
      this.playbackState = {
        isPlaying: true,
        isPaused: false,
        currentIndex: 0,
        startTime: Date.now(),
        pausedTime: 0,
        totalDuration,
      };

      // Start progress tracking
      this.startProgressTracking();

      // Start playback sequence
      await this.playSequence(timings, speed, 0);
    } catch (error) {
      console.error('[AudioService] Failed to play Morse code:', error);
      if (error instanceof Error) {
        console.error('[AudioService] Error details:', error.message, error.stack);
      }
      this.cleanup();
      throw new Error('Audio playback failed');
    }
  }

  /**
   * Play the timing sequence recursively
   * @param timings - Array of timing objects
   * @param speed - Speed multiplier
   * @param index - Current index in the sequence
   */
  private async playSequence(
    timings: MorseTiming[],
    speed: number,
    index: number
  ): Promise<void> {
    // Check if playback was stopped or paused
    if (!this.playbackState.isPlaying || this.playbackState.isPaused) {
      return;
    }

    // Check if we've reached the end
    if (index >= timings.length) {
      if (this.onProgressCallback) {
        this.onProgressCallback(1); // 100% complete
      }
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      this.cleanup();
      return;
    }

    const timing = timings[index];
    const adjustedDuration = timing.duration / speed;

    // Update current index
    this.playbackState.currentIndex = index;

    // Play sound for dit or dah
    if (timing.type === 'dit' || timing.type === 'dah') {
      await this.playBeep(adjustedDuration);
    } else {
      // For gaps, just wait
      await this.wait(adjustedDuration);
    }

    // Schedule next timing
    this.playbackTimeout = setTimeout(() => {
      this.playSequence(timings, speed, index + 1);
    }, 0);
  }

  /**
   * Play a beep tone for the specified duration
   * @param duration - Duration in milliseconds
   */
  private async playBeep(duration: number): Promise<void> {
    try {
      // Generate beep tone data URI
      const dataUri = this.generateBeepDataUri(this.FREQUENCY, duration);
      
      // Create and play the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: dataUri },
        { shouldPlay: true, volume: 1.0 }
      );

      this.sound = sound;

      // Wait for the duration
      await this.wait(duration);

      // Stop and unload the sound
      await sound.stopAsync();
      await sound.unloadAsync();
      this.sound = null;
    } catch (error) {
      console.error('[AudioService] Failed to play beep:', error);
      if (error instanceof Error) {
        console.error('[AudioService] Beep error details:', error.message);
      }
      // Continue playback even if one beep fails
    }
  }

  /**
   * Wait for specified duration
   * @param duration - Duration in milliseconds
   */
  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Start progress tracking interval
   */
  private startProgressTracking(): void {
    // Update progress at ~60fps (every 16ms)
    this.progressInterval = setInterval(() => {
      if (this.playbackState.isPlaying && !this.playbackState.isPaused) {
        const elapsed = Date.now() - this.playbackState.startTime;
        const progress = Math.min(elapsed / this.playbackState.totalDuration, 1);
        
        if (this.onProgressCallback) {
          this.onProgressCallback(progress);
        }
      }
    }, 16);
  }

  /**
   * Pause playback
   */
  pausePlayback(): void {
    if (this.playbackState.isPlaying && !this.playbackState.isPaused) {
      this.playbackState.isPaused = true;
      this.playbackState.pausedTime = Date.now();

      // Stop current sound if playing
      if (this.sound) {
        this.sound.stopAsync().catch(console.error);
      }

      // Clear timeout
      if (this.playbackTimeout) {
        clearTimeout(this.playbackTimeout);
        this.playbackTimeout = null;
      }
    }
  }

  /**
   * Resume playback from paused state
   */
  async resumePlayback(): Promise<void> {
    if (this.playbackState.isPlaying && this.playbackState.isPaused) {
      // Adjust start time to account for pause duration
      const pauseDuration = Date.now() - this.playbackState.pausedTime;
      this.playbackState.startTime += pauseDuration;
      this.playbackState.isPaused = false;

      // Resume from current index
      await this.playSequence(
        this.currentTimings,
        this.currentSpeed,
        this.playbackState.currentIndex
      );
    }
  }

  /**
   * Seek to a specific position in the playback
   * @param position - Position as a fraction (0 to 1)
   */
  async seekTo(position: number): Promise<void> {
    if (position < 0 || position > 1) {
      throw new Error('Position must be between 0 and 1');
    }

    const wasPlaying = this.playbackState.isPlaying && !this.playbackState.isPaused;

    // Stop current playback
    this.pausePlayback();

    // Calculate which timing index corresponds to this position
    const targetTime = position * this.playbackState.totalDuration;
    let accumulatedTime = 0;
    let targetIndex = 0;

    for (let i = 0; i < this.currentTimings.length; i++) {
      const timingDuration = this.currentTimings[i].duration / this.currentSpeed;
      if (accumulatedTime + timingDuration >= targetTime) {
        targetIndex = i;
        break;
      }
      accumulatedTime += timingDuration;
    }

    // Update playback state
    this.playbackState.currentIndex = targetIndex;
    this.playbackState.startTime = Date.now() - targetTime;

    // Resume if was playing
    if (wasPlaying) {
      this.playbackState.isPaused = false;
      await this.playSequence(
        this.currentTimings,
        this.currentSpeed,
        targetIndex
      );
    }
  }

  /**
   * Stop playback and release resources
   */
  async stopPlayback(): Promise<void> {
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Clear intervals and timeouts
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }

    // Stop and unload sound
    if (this.sound) {
      this.sound.stopAsync()
        .then(() => this.sound?.unloadAsync())
        .catch(console.error);
      this.sound = null;
    }

    // Reset playback state
    this.playbackState = {
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
      startTime: 0,
      pausedTime: 0,
      totalDuration: 0,
    };

    // Clear callbacks
    this.onProgressCallback = null;
    this.onCompleteCallback = null;

    this.onProgressCallback = null;
  }

  /**
   * Release all resources
   */
  async releaseResources(): Promise<void> {
    this.cleanup();
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.playbackState.isPlaying && !this.playbackState.isPaused;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.playbackState.isPaused;
  }

  /**
   * Get current playback progress (0 to 1)
   */
  getProgress(): number {
    if (!this.playbackState.isPlaying) {
      return 0;
    }

    const elapsed = this.playbackState.isPaused
      ? this.playbackState.pausedTime - this.playbackState.startTime
      : Date.now() - this.playbackState.startTime;

    return Math.min(elapsed / this.playbackState.totalDuration, 1);
  }

  /**
   * Generate a complete WAV audio file from Morse code timings
   * @param timings - Array of timing objects
   * @param speed - Speed multiplier (0.5 to 2.0)
   * @returns File URI of the generated audio file
   */
  async generateAudioFile(timings: MorseTiming[], speed: number = 1): Promise<string> {
    if (timings.length === 0) {
      throw new Error('No timings provided');
    }

    if (speed < 0.5 || speed > 2.0) {
      throw new Error('Speed must be between 0.5 and 2.0');
    }

    try {
      const sampleRate = 44100;
      const amplitude = 0.3;
      
      // Calculate total duration and number of samples
      const totalDuration = this.calculateTotalDuration(timings, speed);
      const totalSamples = Math.floor((totalDuration / 1000) * sampleRate);
      
      // Create sample buffer
      const samples = new Int16Array(totalSamples);
      let currentSampleIndex = 0;
      
      // Generate samples for each timing
      for (const timing of timings) {
        const adjustedDuration = timing.duration / speed;
        const numSamples = Math.floor((adjustedDuration / 1000) * sampleRate);
        
        if (timing.type === 'dit' || timing.type === 'dah') {
          // Generate sine wave for beep
          for (let i = 0; i < numSamples && currentSampleIndex < totalSamples; i++) {
            const t = i / sampleRate;
            const sample = Math.sin(2 * Math.PI * this.FREQUENCY * t) * amplitude;
            samples[currentSampleIndex++] = Math.floor(sample * 32767);
          }
        } else {
          // Silence for gaps
          for (let i = 0; i < numSamples && currentSampleIndex < totalSamples; i++) {
            samples[currentSampleIndex++] = 0;
          }
        }
      }
      
      // Create WAV file
      const wavHeader = this.createWavHeader(totalSamples, sampleRate);
      const wavData = new Uint8Array(wavHeader.length + samples.length * 2);
      wavData.set(wavHeader, 0);
      
      // Copy samples as bytes
      const dataView = new DataView(wavData.buffer);
      for (let i = 0; i < samples.length; i++) {
        dataView.setInt16(wavHeader.length + i * 2, samples[i], true);
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
      const filename = `morse_${timestamp}.wav`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Convert to base64 and save
      const base64 = this.arrayBufferToBase64(wavData);
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return fileUri;
    } catch (error) {
      console.error('[AudioService] Failed to generate audio file:', error);
      if (error instanceof Error) {
        console.error('[AudioService] Generation error details:', error.message, error.stack);
        
        // Check for storage-related errors
        if (error.message.toLowerCase().includes('storage') || 
            error.message.toLowerCase().includes('space') ||
            error.message.toLowerCase().includes('disk full')) {
          throw new Error('Insufficient storage space available');
        }
      }
      throw new Error('Audio file generation failed');
    }
  }
}

// Export singleton instance
export default new AudioService();
