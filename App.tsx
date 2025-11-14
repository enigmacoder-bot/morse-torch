import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, AppState } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import TextInputCard from './components/TextInputCard';
import MorseDisplayCard from './components/MorseDisplayCard';
import AudioControls from './components/AudioControls';
import DownloadButton from './components/DownloadButton';
import FlashlightButton from './components/FlashlightButton';
import Notification from './components/Notification';
import AudioService from './services/AudioService';
import FlashlightService from './services/FlashlightService';
import MorseConverterService from './services/MorseConverterService';
import ErrorHandler from './utils/ErrorHandler';

export default function App() {
  const [morseCode, setMorseCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });
  
  const appState = useRef(AppState.currentState);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background - release resources
        AudioService.releaseResources();
        FlashlightService.releaseResources();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Cleanup audio and flashlight resources on unmount
  useEffect(() => {
    return () => {
      AudioService.releaseResources();
      FlashlightService.releaseResources();
    };
  }, []);

  // Calculate duration when morse code or speed changes
  useEffect(() => {
    if (morseCode) {
      const timings = MorseConverterService.morseToTiming(morseCode);
      const totalDuration = timings.reduce((sum, timing) => sum + timing.duration / playbackSpeed, 0);
      setDuration(totalDuration);
    } else {
      setDuration(0);
    }
  }, [morseCode, playbackSpeed]);

  // Update current time based on progress
  useEffect(() => {
    setCurrentTime(progress * duration);
  }, [progress, duration]);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(async () => {
    if (!morseCode) return;

    try {
      if (isPlaying) {
        // Pause playback
        AudioService.pausePlayback();
        setIsPlaying(false);
      } else {
        // Check if we need to resume or start new playback
        if (AudioService.isPaused()) {
          // Resume from paused state
          await AudioService.resumePlayback();
          setIsPlaying(true);
        } else {
          // Start new playback
          const timings = MorseConverterService.morseToTiming(morseCode);
          
          // Reset progress
          setProgress(0);
          setIsPlaying(true);

          // Start playback with progress callback
          await AudioService.playMorse(timings, playbackSpeed, (newProgress) => {
            setProgress(newProgress);
          });

          // Playback completed
          setIsPlaying(false);
          setProgress(0);
        }
      }
    } catch (error) {
      // Handle audio playback error
      const errorNotification = ErrorHandler.handleAudioPlaybackError(error, 'playback');
      setIsPlaying(false);
      setProgress(0);
      setNotification({
        message: errorNotification.message,
        type: errorNotification.type,
        visible: true,
      });
    }
  }, [morseCode, isPlaying, playbackSpeed]);

  // Handle speed change
  const handleSpeedChange = useCallback(async (newSpeed: number) => {
    const wasPlaying = isPlaying;
    
    // Stop current playback if playing
    if (wasPlaying) {
      AudioService.pausePlayback();
      setIsPlaying(false);
    }

    // Update speed
    setPlaybackSpeed(newSpeed);

    // Restart playback with new speed if was playing
    if (wasPlaying && morseCode) {
      try {
        const timings = MorseConverterService.morseToTiming(morseCode);
        setIsPlaying(true);

        await AudioService.playMorse(timings, newSpeed, (newProgress) => {
          setProgress(newProgress);
        });

        // Playback completed
        setIsPlaying(false);
        setProgress(0);
      } catch (error) {
        // Handle audio playback error after speed change
        const errorNotification = ErrorHandler.handleAudioPlaybackError(error, 'speed change');
        setIsPlaying(false);
        setProgress(0);
        setNotification({
          message: errorNotification.message,
          type: errorNotification.type,
          visible: true,
        });
      }
    }
  }, [isPlaying, morseCode]);

  // Handle seek
  const handleSeek = useCallback(async (position: number) => {
    if (!morseCode) return;

    try {
      await AudioService.seekTo(position);
      setProgress(position);
    } catch (error) {
      // Handle seek error
      const errorNotification = ErrorHandler.handleAudioPlaybackError(error, 'seek');
      setNotification({
        message: errorNotification.message,
        type: errorNotification.type,
        visible: true,
      });
    }
  }, [morseCode]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!morseCode) return;

    try {
      const timings = MorseConverterService.morseToTiming(morseCode);
      const fileUri = await AudioService.generateAudioFile(timings, playbackSpeed);
      
      // Show success notification with file location
      setNotification({
        message: `Audio saved to: ${fileUri}`,
        type: 'success',
        visible: true,
      });
    } catch (error) {
      // Handle download error with proper error classification
      const errorNotification = ErrorHandler.handleDownloadError(error, 'audio file generation');
      setNotification({
        message: errorNotification.message,
        type: errorNotification.type,
        visible: true,
      });
    }
  }, [morseCode, playbackSpeed]);

  // Hide notification
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle flashlight error
  const handleFlashlightError = useCallback((error: string) => {
    setNotification({
      message: error,
      type: 'error',
      visible: true,
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Notification
          message={notification.message}
          type={notification.type}
          visible={notification.visible}
          onHide={hideNotification}
        />
        
        <View style={styles.header}>
          <Text style={styles.headerText}>⚡ Morse Code Generator</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInputCard onMorseCodeChange={setMorseCode} />
          <MorseDisplayCard morseCode={morseCode} />
          
          {morseCode && (
            <>
              <AudioControls
                speed={playbackSpeed}
                onSpeedChange={handleSpeedChange}
                progress={progress}
                onSeek={handleSeek}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                disabled={!morseCode}
              />
              
              <DownloadButton
                onDownload={handleDownload}
                disabled={!morseCode}
              />
              
              <FlashlightButton
                morseCode={morseCode}
                onError={handleFlashlightError}
                disabled={!morseCode}
              />
            </>
          )}
        </ScrollView>
        
        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
});
