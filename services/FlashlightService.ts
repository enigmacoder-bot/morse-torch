import { MorseTiming } from '../types/morse';

// Note: expo-camera v16+ requires using hooks and CameraView component
// For flashlight control, we need to manage torch state through the component
// This service provides the business logic and state management
// Permission handling should be done using useCameraPermissions hook in the UI component

class FlashlightService {
  private isTransmitting: boolean = false;
  private transmissionTimeouts: NodeJS.Timeout[] = [];
  private torchEnabled: boolean = false;
  private onTorchChangeCallback: ((enabled: boolean) => void) | null = null;

  /**
   * Set callback for torch state changes
   * This should be called from the component that manages the CameraView
   */
  setTorchChangeCallback(callback: (enabled: boolean) => void): void {
    this.onTorchChangeCallback = callback;
  }

  /**
   * Request camera permission for flashlight access
   * Note: In expo-camera v16+, use useCameraPermissions hook in component
   * This method is kept for API compatibility
   */
  async requestPermission(): Promise<boolean> {
    // Permission should be requested using useCameraPermissions hook in the component
    // This is a placeholder that returns true
    console.warn('FlashlightService.requestPermission: Use useCameraPermissions hook in component');
    return true;
  }

  /**
   * Check if camera permission is already granted
   * Note: In expo-camera v16+, use useCameraPermissions hook in component
   */
  async hasPermission(): Promise<boolean> {
    // Permission should be checked using useCameraPermissions hook in the component
    console.warn('FlashlightService.hasPermission: Use useCameraPermissions hook in component');
    return true;
  }

  /**
   * Check if flashlight is available on the device
   * @returns boolean - true if flashlight is available
   */
  isAvailable(): boolean {
    // On most Android devices, if Camera is available, flashlight is available
    // This is a basic check - actual availability is determined at runtime
    return true;
  }

  /**
   * Transmit Morse code via flashlight
   * @param timings - Array of MorseTiming objects
   * @param onComplete - Callback when transmission completes
   * @param onError - Callback when transmission fails
   */
  async transmitMorse(
    timings: MorseTiming[],
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      // Check if already transmitting
      if (this.isTransmitting) {
        throw new Error('Transmission already in progress');
      }

      // Check permission
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        throw new Error('Camera permission not granted');
      }

      if (timings.length === 0) {
        onComplete?.();
        return;
      }

      this.isTransmitting = true;
      
      // Execute the timing sequence with completion callback
      this.executeTimingSequence(timings, onComplete, onError);
    } catch (error) {
      this.isTransmitting = false;
      console.error('[FlashlightService] Error during Morse transmission:', error);
      if (error instanceof Error) {
        console.error('[FlashlightService] Transmission error details:', error.message, error.stack);
      }
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Execute the timing sequence for flashlight transmission
   * @param timings - Array of MorseTiming objects
   * @param onComplete - Callback when sequence completes
   * @param onError - Callback when sequence fails
   */
  private executeTimingSequence(
    timings: MorseTiming[],
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): void {
    let currentIndex = 0;

    const scheduleNext = () => {
      try {
        if (!this.isTransmitting || currentIndex >= timings.length) {
          // Turn off flashlight at the end
          this.turnOffFlashlight();
          this.isTransmitting = false;
          onComplete?.();
          return;
        }

        const timing = timings[currentIndex];
        const shouldTurnOn = timing.type === 'dit' || timing.type === 'dah';

        // Turn flashlight on or off based on timing type
        if (shouldTurnOn) {
          this.turnOnFlashlight();
        } else {
          this.turnOffFlashlight();
        }

        // Schedule next timing with a small buffer to ensure state changes are applied
        const timeoutId = setTimeout(() => {
          currentIndex++;
          scheduleNext();
        }, timing.duration + 10); // Adding 10ms buffer to ensure state changes are processed

        this.transmissionTimeouts.push(timeoutId);
      } catch (error) {
        this.isTransmitting = false;
        this.turnOffFlashlight();
        onError?.(error as Error);
      }
    };

    // Start the sequence
    scheduleNext();
  }

  /**
   * Turn on the flashlight
   */
  private turnOnFlashlight(): void {
    this.torchEnabled = true;
    this.onTorchChangeCallback?.(true);
  }

  /**
   * Turn off the flashlight
   */
  private turnOffFlashlight(): void {
    this.torchEnabled = false;
    this.onTorchChangeCallback?.(false);
  }

  /**
   * Stop ongoing transmission
   */
  stopTransmission(): void {
    if (!this.isTransmitting) {
      return;
    }

    this.isTransmitting = false;

    // Clear all scheduled timeouts
    this.transmissionTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.transmissionTimeouts = [];

    // Turn off flashlight
    this.turnOffFlashlight();
  }

  /**
   * Release resources and cleanup
   */
  releaseResources(): void {
    this.stopTransmission();
    this.onTorchChangeCallback = null;
  }

  /**
   * Check if transmission is currently in progress
   */
  isTransmittingNow(): boolean {
    return this.isTransmitting;
  }

  /**
   * Get current torch state
   */
  getTorchEnabled(): boolean {
    return this.torchEnabled;
  }
}

// Export singleton instance
export default new FlashlightService();
