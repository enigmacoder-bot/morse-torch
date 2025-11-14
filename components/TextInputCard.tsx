import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import MorseConverterService from '../services/MorseConverterService';

interface TextInputCardProps {
  onMorseCodeChange: (morseCode: string) => void;
}

export default function TextInputCard({ onMorseCodeChange }: TextInputCardProps) {
  const [inputText, setInputText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [clearButtonOpacity] = useState(new Animated.Value(0));

  // Debounced conversion with 50ms delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const morseCode = MorseConverterService.textToMorse(inputText);
      onMorseCodeChange(morseCode);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [inputText, onMorseCodeChange]);

  // Update character and word counts
  useEffect(() => {
    setCharCount(inputText.length);
    
    // Count words (non-empty strings after splitting by spaces)
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    // Animate clear button
    Animated.timing(clearButtonOpacity, {
      toValue: inputText.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [inputText, clearButtonOpacity]);

  const handleClear = useCallback(() => {
    setInputText('');
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Your Text</Text>
        {inputText.length > 0 && (
          <Animated.View style={{ opacity: clearButtonOpacity }}>
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type text to convert to morse code..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.countText}>{charCount} characters</Text>
        {wordCount > 0 && (
          <Text style={styles.wordCountText}>{wordCount} words</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginHorizontal: 16,
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  textInput: {
    color: '#f8fafc',
    fontSize: 16,
    padding: 16,
    minHeight: 120,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    color: '#64748b',
  },
  wordCountText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
