'use client';

import { useState, useRef } from 'react';
import { Volume2, Zap, Download, Copy, RotateCcw } from 'lucide-react';
import MorseCodeInput from '@/components/morse-input';
import MorseCodeDisplay from '@/components/morse-display';
import ActionButtons from '@/components/action-buttons';
import AudioControls from '@/components/audio-controls';

export default function Home() {
  const [text, setText] = useState('');
  const [morseCode, setMorseCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const textToMorse = (input: string) => {
    const morseMap: Record<string, string> = {
      A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
      G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
      M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
      S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
      Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---',
      '3': '...--', '4': '....-', '5': '.....', '6': '-....',
      '7': '--...', '8': '---..', '9': '----.', '.': '.-.-.-',
      ',': '--..--', '?': '..--..', "'": '.----.',
      '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
      '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
      '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
      '$': '...-..-', '@': '.--.-.'
    };

    return input
      .toUpperCase()
      .split('')
      .map(char => morseMap[char] || (char === ' ' ? '/' : ''))
      .filter(code => code !== '')
      .join(' ');
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    const morse = textToMorse(newText);
    setMorseCode(morse);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(morseCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setMorseCode('');
    setIsCopied(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Gradient background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="pt-8 px-6 pb-4 border-b border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Morse Code Generator
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Convert text to morse code with sound, flashlight, and audio export
            </p>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Input section */}
            <MorseCodeInput 
              value={text}
              onChange={handleTextChange}
              onClear={handleClear}
            />

            {/* Morse code display */}
            {morseCode && (
              <MorseCodeDisplay 
                morseCode={morseCode}
                isCopied={isCopied}
                onCopy={handleCopy}
              />
            )}

            {/* Action buttons */}
            <ActionButtons 
              morseCode={morseCode}
              text={text}
            />

            {/* Audio controls */}
            {morseCode && (
              <AudioControls 
                morseCode={morseCode}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
