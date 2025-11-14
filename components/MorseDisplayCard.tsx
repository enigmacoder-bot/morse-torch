import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface MorseDisplayCardProps {
  morseCode: string;
}

const MorseDisplayCard = React.memo(({ morseCode }: MorseDisplayCardProps) => {
  const [showCopied, setShowCopied] = useState(false);
  const iconRotation = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;

  const handleCopy = useCallback(async () => {
    if (!morseCode) return;

    try {
      await Clipboard.setStringAsync(morseCode);
      
      // Trigger icon swap animation
      setShowCopied(true);
      
      // Animate icon change
      Animated.parallel([
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(iconOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(iconOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Reset after 2 seconds
      setTimeout(() => {
        setShowCopied(false);
        iconRotation.setValue(0);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [morseCode, iconRotation, iconOpacity]);

  if (!morseCode) {
    return null;
  }

  const rotateInterpolate = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Morse Code</Text>
        <TouchableOpacity
          onPress={handleCopy}
          style={styles.copyButton}
          activeOpacity={0.7}
        >
          <Animated.View
            style={{
              opacity: iconOpacity,
              transform: [{ rotate: rotateInterpolate }],
            }}
          >
            <Text style={styles.copyIcon}>
              {showCopied ? '✓' : '📋'}
            </Text>
          </Animated.View>
          <Text style={styles.copyButtonText}>
            {showCopied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.morseContainer}
        contentContainerStyle={styles.morseContent}
        nestedScrollEnabled={true}
      >
        <Text style={styles.morseText} selectable>
          {morseCode}
        </Text>
      </ScrollView>

      {showCopied && (
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationText}>
            Copied to clipboard
          </Text>
        </View>
      )}
    </View>
  );
});

MorseDisplayCard.displayName = 'MorseDisplayCard';

export default MorseDisplayCard;

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  copyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  morseContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 200,
  },
  morseContent: {
    padding: 16,
  },
  morseText: {
    color: '#f8fafc',
    fontSize: 18,
    fontFamily: 'monospace',
    lineHeight: 28,
    letterSpacing: 2,
  },
  confirmationContainer: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  confirmationText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    textAlign: 'center',
  },
});
