'use client';

import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface AudioControlsProps {
  morseCode: string;
}

export default function AudioControls({
  morseCode,
}: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Volume2 className="w-4 h-4" />
        <span>Audio Playback Controls</span>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-2 cursor-pointer group">
            <div
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0:00</span>
            <span>2:45</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setProgress(0)}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:shadow-primary/30 text-primary-foreground transition-all hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground min-w-6">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-20 cursor-pointer"
            />
            <span className="text-xs font-medium text-foreground min-w-8">{speed}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
