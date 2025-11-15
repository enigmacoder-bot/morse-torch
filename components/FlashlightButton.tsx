import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FlashlightService from '../services/FlashlightService';
import ErrorHandler from '../utils/ErrorHandler';

interface FlashlightButtonProps {
  morseCode: string;
  onTransmissionStart?: () => void;
  onTransmissionComplete?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function FlashlightButton({
  morseCode,
  onTransmissionStart,
  onTransmissionComplete,
  onError,
  disabled = false,
}: FlashlightButtonProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isAvailable] = useState(FlashlightService.isAvailable());

  // Set up torch change callback
  useEffect(() => {
    FlashlightService.setTorchChangeCallback(setTorchEnabled);
    
    return () => {
      FlashlightService.releaseResources();
    };
  }, []);

  const handlePress = async () => {
    if (disabled || !isAvailable) return;

    // If transmitting, stop it
    if (isTransmitting) {
      FlashlightService.stopTransmission();
      setIsTransmitting(false);
      return;
    }

    // Clear any previous permission errors
    setPermissionError(null);

    // Check and request permission if needed
    if (!permission?.granted) {
      const result = await requestPermission();
      
      if (!result.granted) {
        const errorNotification = ErrorHandler.handlePermissionDenied('Camera');
        setPermissionError(errorNotification.message);
        onError?.(errorNotification.message);
        return;
      }
    }

    // Start transmission
    try {
      setIsTransmitting(true);
      onTransmissionStart?.();

      const MorseConverterService = require('../services/MorseConverterService').default;
      const timings = MorseConverterService.morseToTiming(morseCode);

      await FlashlightService.transmitMorse(
        timings,
        () => {
          // Transmission complete
          setIsTransmitting(false);
          onTransmissionComplete?.();
        },
        (error) => {
          // Transmission error
          setIsTransmitting(false);
          const errorNotification = ErrorHandler.handleFlashlightError(error, 'transmission');
          onError?.(errorNotification.message);
        }
      );
    } catch (error) {
      setIsTransmitting(false);
      const errorNotification = ErrorHandler.handleFlashlightError(error, 'flashlight start');
      onError?.(errorNotification.message);
    }
  };

  // Determine button state
  const isDisabled = disabled || !isAvailable;
  const buttonIcon = isTransmitting ? '⏹️' : '🔦';
  const buttonText = isTransmitting ? 'Stop Flashlight' : 'Flashlight';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isDisabled && styles.buttonDisabled,
          isTransmitting && styles.buttonActive,
        ]}
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>{buttonIcon}</Text>
        <Text
          style={[
            styles.buttonText,
            isDisabled && styles.buttonTextDisabled,
          ]}
        >
          {buttonText}
        </Text>
        {isTransmitting && (
          <View style={styles.transmissionIndicator} />
        )}
      </TouchableOpacity>

      {/* Show permission error message */}
      {permissionError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{permissionError}</Text>
        </View>
      )}

      {/* Show unavailable message */}
      {!isAvailable && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Flashlight is not available on this device
          </Text>
        </View>
      )}

      {/* Hidden CameraView for torch control */}
      {permission?.granted && isTransmitting && (
        <CameraView
          style={styles.hiddenCamera}
          enableTorch={torchEnabled}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  buttonActive: {
    backgroundColor: '#ef4444',
  },
  icon: {
    fontSize: 24,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: 'rgba(248, 250, 252, 0.5)',
  },
  transmissionIndicator: {
    position: 'absolute',
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 8,
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  hiddenCamera: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});
