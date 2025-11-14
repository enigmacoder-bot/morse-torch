'use client';

import { Copy, Check } from 'lucide-react';

interface MorseCodeDisplayProps {
  morseCode: string;
  isCopied: boolean;
  onCopy: () => void;
}

export default function MorseCodeDisplay({
  morseCode,
  isCopied,
  onCopy,
}: MorseCodeDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-lg font-semibold text-foreground">
          Morse Code
        </label>
        <span className="text-xs font-medium text-muted-foreground">
          {morseCode.split(' ').length} symbols
        </span>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
        
        <div className="relative bg-card border border-primary/20 rounded-2xl p-6 min-h-24 flex items-center justify-center animate-glow">
          <div className="w-full">
            <div className="text-center text-primary font-mono text-xl leading-relaxed break-words">
              {morseCode}
            </div>
          </div>
          
          <button
            onClick={onCopy}
            className="absolute top-4 right-4 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 group-hover:scale-110"
            title="Copy morse code"
          >
            {isCopied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {isCopied && (
        <div className="text-xs text-green-400 font-medium">
          ✓ Copied to clipboard
        </div>
      )}
    </div>
  );
}
