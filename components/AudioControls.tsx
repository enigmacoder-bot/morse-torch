import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);

  // Handle play/pause button press animation
  const handlePlayPausePress = useCallback(() => {
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
  const progressWidth = useMemo(() => `${progress * 100}%` as const, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerText}>Audio Playback</Text>
      </View>

      {/* Progress Bar - moved above play button */}
      <View style={styles.progressSection}>
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
            >
              {progress > 0 && <View style={styles.progressHandle} />}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formattedCurrentTime}</Text>
          <Text style={styles.timeText}>{formattedDuration}</Text>
        </View>
      </View>

      {/* Play/Pause Button with better layout */}
      <View style={styles.playbackSection}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={handlePlayPausePress}
            style={[
              styles.playButton,
              disabled && styles.playButtonDisabled,
              isPlaying && styles.playButtonPlaying,
            ]}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="#ffffff"
              style={isPlaying ? styles.pauseIcon : styles.playIcon}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Speed Selector */}
      <View style={styles.speedSection}>
        <Text style={styles.speedLabel}>Playback Speed</Text>
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
  },
  headerSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'visible',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
    position: 'relative',
  },
  progressHandle: {
    position: 'absolute',
    right: -8,
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  playbackSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  playIcon: {
    marginLeft: 4,
  },
  pauseIcon: {
    marginLeft: 0,
  },
  playButtonPlaying: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  playButtonDisabled: {
    backgroundColor: '#475569',
    shadowColor: '#475569',
    borderColor: 'rgba(71, 85, 105, 0.3)',
    opacity: 0.6,
  },
  speedSection: {
    paddingTop: 4,
  },
  speedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  speedButton: {
    minWidth: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  speedButtonDisabled: {
    opacity: 0.4,
  },
  speedButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  speedButtonTextActive: {
    color: '#ffffff',
  },
});
