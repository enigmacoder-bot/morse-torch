# Morse Code Generator - React Native App

A React Native Expo mobile application that converts text to Morse code with multiple output methods: visual display, audio playback, audio download, and flashlight transmission.

## Project Structure

```
app-mobile/
├── components/     # React Native UI components
├── services/       # Business logic services
├── utils/          # Utility functions and helpers
├── types/          # TypeScript type definitions
├── assets/         # Images and static assets
├── App.tsx         # Main application entry point
├── app.json        # Expo configuration
├── package.json    # Dependencies and scripts
└── tsconfig.json   # TypeScript configuration
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on Android:
   ```bash
   npm run android
   ```

## Requirements

- Node.js 18+
- Expo CLI
- Android SDK (for building, handled by GitHub Actions)

## Features

- Text to Morse code conversion
- Real-time conversion display
- Audio playback with speed control
- Audio file download
- Flashlight transmission
- Copy to clipboard
- Modern gradient UI design

## Target Platform

- Android API 21+ (Android 5.0 Lollipop and above)
