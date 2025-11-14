'use client';

import { Volume2, Zap, Download } from 'lucide-react';

interface ActionButtonsProps {
  morseCode: string;
  text: string;
}

export default function ActionButtons({
  morseCode,
  text,
}: ActionButtonsProps) {
  if (!morseCode) return null;

  const handlePlaySound = () => {
    // Play morse code sound - implementation depends on your audio library
    alert('Play sound feature - integrate with Web Audio API or library');
  };

  const handleFlashlight = () => {
    // Trigger flashlight/camera flash - React Native specific
    alert('Flashlight feature - React Native camera or flash API');
  };

  const handleDownload = () => {
    // Download audio file
    alert('Download audio feature - generate and download audio file');
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={handlePlaySound}
        className="group relative px-6 py-4 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-2xl font-semibold text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
      >
        <Volume2 className="w-5 h-5" />
        <span>Play Sound</span>
      </button>

      <button
        onClick={handleFlashlight}
        className="group relative px-6 py-4 bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 rounded-2xl font-semibold text-accent-foreground transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-accent/30"
      >
        <Zap className="w-5 h-5" />
        <span>Flashlight</span>
      </button>

      <button
        onClick={handleDownload}
        className="col-span-2 px-6 py-3 bg-card border border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-2xl font-semibold text-foreground transition-all duration-200 flex items-center justify-center gap-2 hover:scale-102"
      >
        <Download className="w-5 h-5" />
        <span>Download Audio</span>
      </button>
    </div>
  );
}
