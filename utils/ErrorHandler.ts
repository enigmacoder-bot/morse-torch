/**
 * ErrorHandler utility for centralized error management
 * Provides consistent error handling, logging, and user-friendly error messages
 */

export type AppErrorType =
  | 'PERMISSION_DENIED'
  | 'DEVICE_UNSUPPORTED'
  | 'AUDIO_PLAYBACK_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'STORAGE_FULL'
  | 'FLASHLIGHT_FAILED'
  | 'UNKNOWN';

export interface AppError {
  type: AppErrorType;
  message: string;
  originalError?: Error;
  context?: string;
}

export interface ErrorNotification {
  message: string;
  type: 'error' | 'warning' | 'success';
}

class ErrorHandler {
  /**
   * Handle an application error and return a user-friendly notification
   * @param error - The error to handle
   * @returns ErrorNotification object for display
   */
  handleError(error: AppError): ErrorNotification {
    // Log error for debugging
    this.logError(error);

    // Return user-friendly notification
    return {
      message: this.getUserFriendlyMessage(error),
      type: error.type === 'DEVICE_UNSUPPORTED' ? 'warning' : 'error',
    };
  }

  /**
   * Create an AppError from a native Error object
   * @param error - Native Error object
   * @param type - Error type classification
   * @param context - Additional context about where the error occurred
   * @returns AppError object
   */
  createError(
    error: Error | unknown,
    type: AppErrorType,
    context?: string
  ): AppError {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    return {
      type,
      message: errorObj.message,
      originalError: errorObj,
      context,
    };
  }

  /**
   * Handle audio playback errors
   * @param error - The error that occurred
   * @param context - Additional context
   * @returns ErrorNotification for display
   */
  handleAudioPlaybackError(error: Error | unknown, context?: string): ErrorNotification {
    const appError = this.createError(error, 'AUDIO_PLAYBACK_FAILED', context);
    return this.handleError(appError);
  }

  /**
   * Handle download errors
   * @param error - The error that occurred
   * @param context - Additional context
   * @returns ErrorNotification for display
   */
  handleDownloadError(error: Error | unknown, context?: string): ErrorNotification {
    // Check if it's a storage full error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isStorageFull = errorMessage.toLowerCase().includes('storage') ||
                          errorMessage.toLowerCase().includes('space') ||
                          errorMessage.toLowerCase().includes('disk full');

    const errorType = isStorageFull ? 'STORAGE_FULL' : 'DOWNLOAD_FAILED';
    const appError = this.createError(error, errorType, context);
    
    return this.handleError(appError);
  }

  /**
   * Handle flashlight errors
   * @param error - The error that occurred
   * @param context - Additional context
   * @returns ErrorNotification for display
   */
  handleFlashlightError(error: Error | unknown, context?: string): ErrorNotification {
    const appError = this.createError(error, 'FLASHLIGHT_FAILED', context);
    return this.handleError(appError);
  }

  /**
   * Handle permission denied errors
   * @param permission - The permission that was denied
   * @returns ErrorNotification for display
   */
  handlePermissionDenied(permission: string): ErrorNotification {
    const appError: AppError = {
      type: 'PERMISSION_DENIED',
      message: `${permission} permission denied`,
      context: permission,
    };
    
    return this.handleError(appError);
  }

  /**
   * Handle device unsupported errors
   * @param feature - The unsupported feature
   * @returns ErrorNotification for display
   */
  handleDeviceUnsupported(feature: string): ErrorNotification {
    const appError: AppError = {
      type: 'DEVICE_UNSUPPORTED',
      message: `${feature} is not available on this device`,
      context: feature,
    };
    
    return this.handleError(appError);
  }

  /**
   * Get user-friendly error message based on error type
   * @param error - The AppError object
   * @returns User-friendly error message
   */
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case 'PERMISSION_DENIED':
        return `Permission required: ${error.context || 'Unknown permission'}. Please enable it in your device settings.`;
      
      case 'DEVICE_UNSUPPORTED':
        return `${error.context || 'This feature'} is not available on your device.`;
      
      case 'AUDIO_PLAYBACK_FAILED':
        return 'Audio playback failed. Please try again.';
      
      case 'DOWNLOAD_FAILED':
        return 'Failed to download audio file. Please try again.';
      
      case 'STORAGE_FULL':
        return 'Not enough storage space. Please free up some space and try again.';
      
      case 'FLASHLIGHT_FAILED':
        return 'Flashlight transmission failed. Please try again.';
      
      case 'UNKNOWN':
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Log error to console for debugging
   * @param error - The AppError to log
   */
  private logError(error: AppError): void {
    const timestamp = new Date().toISOString();
    const context = error.context ? ` [${error.context}]` : '';
    
    console.error(
      `[${timestamp}] Error${context}:`,
      error.type,
      '-',
      error.message
    );
    
    if (error.originalError) {
      console.error('Original error:', error.originalError);
      
      // Log stack trace if available
      if (error.originalError.stack) {
        console.error('Stack trace:', error.originalError.stack);
      }
    }
  }

  /**
   * Log a general message to console
   * @param message - Message to log
   * @param level - Log level
   */
  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
      default:
        console.log(logMessage);
        break;
    }
  }
}

// Export singleton instance
export default new ErrorHandler();
