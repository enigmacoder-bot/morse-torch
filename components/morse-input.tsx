'use client';

import { X } from 'lucide-react';

interface MorseCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export default function MorseCodeInput({
  value,
  onChange,
  onClear,
}: MorseCodeInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-lg font-semibold text-foreground">
          Your Text
        </label>
        {value && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type text to convert to morse code..."
          className="w-full bg-card border border-border/50 rounded-2xl px-6 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
          rows={4}
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{value.length} characters</span>
        {value.length > 0 && (
          <span className="text-primary">{value.split(' ').filter(w => w).length} words</span>
        )}
      </div>
    </div>
  );
}
