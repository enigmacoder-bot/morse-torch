export interface MorseTiming {
  type: 'dit' | 'dah' | 'symbolGap' | 'letterGap' | 'wordGap';
  duration: number;
}

export interface TimingConfig {
  timeUnit: number;        // Base unit in milliseconds (default: 120)
  ditDuration: number;     // 1 time unit
  dahDuration: number;     // 3 time units
  symbolGap: number;       // 1 time unit
  letterGap: number;       // 3 time units
  wordGap: number;         // 7 time units
  frequency: number;       // Audio frequency in Hz (default: 600)
}
