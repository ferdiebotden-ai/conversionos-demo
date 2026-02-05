/**
 * OpenAI Realtime API Configuration
 * Configuration and utilities for voice mode integration
 * [DEV-075]
 */

// Model constants
export const REALTIME_MODEL = 'gpt-realtime';
export const TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';

// VAD configuration options
export const VAD_CONFIG = {
  semantic: {
    type: 'semantic_vad' as const,
    eagerness: 'low' as const,
  },
  serverVad: {
    type: 'server_vad' as const,
    threshold: 0.6,
    prefix_padding_ms: 500,
    silence_duration_ms: 1000,
  },
};

// Grace timeout for buffering AI deltas while awaiting user transcript
export const TRANSCRIPT_GRACE_TIMEOUT_MS = 500;

// WebRTC configuration for OpenAI Realtime
export const REALTIME_CONFIG = {
  // API endpoint for session creation
  sessionEndpoint: '/api/realtime/session',

  // WebRTC settings
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],

  // Audio settings
  audio: {
    sampleRate: 24000, // 24kHz as required by OpenAI Realtime
    channelCount: 1,   // Mono audio
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },

  // UI settings
  ui: {
    maxRecordingTime: 300000, // 5 minutes max per utterance
    visualizerBars: 32,       // Number of bars in audio visualizer
    minDecibels: -90,
    maxDecibels: -10,
  },
};

// Voice options available in the UI
export const VOICE_OPTIONS = [
  { id: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { id: 'shimmer', label: 'Shimmer', description: 'Warm and friendly' },
  { id: 'echo', label: 'Echo', description: 'Clear and articulate' },
] as const;

export type VoiceId = typeof VOICE_OPTIONS[number]['id'];

// Transcript message type
export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isPartial?: boolean; // For real-time transcription updates
}

// Voice session state
export type VoiceSessionState =
  | 'idle'           // Not connected
  | 'connecting'     // Establishing WebRTC connection
  | 'connected'      // Ready to speak
  | 'listening'      // User is speaking, being transcribed
  | 'processing'     // AI is processing response
  | 'speaking'       // AI is speaking
  | 'error';         // Connection error

// Error types for voice mode
export type VoiceErrorCode =
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED'
  | 'CONNECTION_FAILED'
  | 'CONNECTION_TIMEOUT'
  | 'API_NOT_CONFIGURED'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export class VoiceError extends Error {
  constructor(
    message: string,
    public code: VoiceErrorCode
  ) {
    super(message);
    this.name = 'VoiceError';
  }
}

// User-friendly error messages
export const VOICE_ERROR_MESSAGES: Record<VoiceErrorCode, string> = {
  PERMISSION_DENIED: 'Please allow microphone access in your browser settings.',
  NOT_SUPPORTED: 'Voice mode requires a modern browser with WebRTC support.',
  API_NOT_CONFIGURED: 'Voice mode is not available. Please use text chat instead.',
  CONNECTION_FAILED: 'Could not connect to voice service. Please try again.',
  CONNECTION_TIMEOUT: 'Connection timed out. Please check your network and try again.',
  SESSION_EXPIRED: 'Your voice session has expired. Please start a new conversation.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

// Connection timeout in milliseconds
export const CONNECTION_TIMEOUT_MS = 15000;

// Check if browser supports required APIs
export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window.RTCPeerConnection === 'function' &&
    typeof window.AudioContext === 'function'
  );
}

// Format duration for display (e.g., "1:23")
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
