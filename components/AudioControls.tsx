import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface AudioControlsProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  progress: number;
  onSeek: (position: number) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  disabled?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Format time in MM:SS - moved outside component for better performance
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AudioControls = React.memo(({
  speed,
  onSpeedChange,
  progress,
  onSeek,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  disabled = false,
}: AudioControlsProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Memoize formatted times to avoid recalculation on every render
  const formattedCur = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause button press animation
  const handlePlayPausePress = () => {
    if (disabled) return;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPlayPause();
  }, [disabled, onPlayPause, scaleAnim]);

  // Memoize progress bar width calculation
  const progressWidth = useMemo(() => `${progress * 100}%`, [progress]);

  return (
    <View style={styles.container}>
      {/* Play/Pause Button */}
      <View style={styles.playbackSection}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={handlePlayPausePress}
            style={[
              styles.playButton,
              disabled && styles.playButtonDisabled,
            ]}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formattedCurrentTime}</Text>
          <Text style={styles.timeText}>{formattedDuration}</Text>
        </View>

        <TouchableOpacity
          style={styles.progressBarContainer}
          activeOpacity={1}
          onPress={(event) => {
            if (disabled) return;
            const { locationX } = event.nativeEvent;
            const { width } = event.nativeEvent.target as any;
            const position = Math.max(0, Math.min(1, locationX / width));
            onSeek(position);
          }}
          disabled={disabled}
        >
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: progressWidth },
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Speed Selector */}
      <View style={styles.speedSection}>
        <Text style={styles.speedLabel}>Speed</Text>
        <View style={styles.speedOptions}>
          {SPEED_OPTIONS.map((speedOption) => (
            <TouchableOpacity
              key={speedOption}
              onPress={() => !disabled && onSpeedChange(speedOption)}
              style={[
                styles.speedButton,
                speed === speedOption && styles.speedButtonActive,
                disabled && styles.speedButtonDisabled,
              ]}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  speed === speedOption && styles.speedButtonTextActive,
                ]}
              >
                {speedOption}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

AudioControls.displayName = 'AudioControls';

export default AudioControls;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  playbackSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.5,
  },
  playButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  progressSection: {
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 40,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  speedSection: {
    marginTop: 8,
  },
  speedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  speedButtonDisabled: {
    opacity: 0.5,
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  speedButtonTextActive: {
    color: '#ffffff',
  },
});
