'use client';

/**
 * Voice Mode Component
 * Real-time voice conversation using OpenAI Realtime API with WebRTC
 * Provides natural voice input for renovation project descriptions
 * [DEV-075]
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Headphones,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Loader2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  REALTIME_CONFIG,
  REALTIME_MODEL,
  TRANSCRIPT_GRACE_TIMEOUT_MS,
  isVoiceSupported,
  VoiceError,
  formatDuration,
  VOICE_ERROR_MESSAGES,
  CONNECTION_TIMEOUT_MS,
  type VoiceSessionState,
  type TranscriptMessage,
} from '@/lib/realtime/config';

interface VoiceModeProps {
  onTranscriptComplete: (transcript: TranscriptMessage[]) => void;
  onSwitchToText: () => void;
  className?: string;
}

// Audio visualizer bars
function AudioVisualizer({
  isActive,
  analyser,
}: {
  isActive: boolean;
  analyser: AnalyserNode | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!canvasRef.current || !analyser || !isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = REALTIME_CONFIG.ui.visualizerBars;

    function draw() {
      if (!ctx || !analyser) return;

      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i * bufferLength) / barCount);
        const value = dataArray[dataIndex] ?? 0;
        const barHeight = (value / 255) * canvas.height;

        // AI Reno Demo brand color with gradient
        const gradient = ctx.createLinearGradient(
          0,
          canvas.height - barHeight,
          0,
          canvas.height
        );
        gradient.addColorStop(0, '#D32F2F');
        gradient.addColorStop(1, '#B71C1C');

        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * barWidth + gap / 2,
          canvas.height - barHeight,
          barWidth - gap,
          barHeight
        );
      }
    }

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className={cn(
        'w-full h-[60px] rounded-lg bg-muted/30',
        !isActive && 'opacity-30'
      )}
    />
  );
}

export function VoiceMode({
  onTranscriptComplete,
  onSwitchToText,
  className,
}: VoiceModeProps) {
  const [state, setState] = useState<VoiceSessionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Buffer-and-flush refs for correct transcript ordering
  const turnCounterRef = useRef(0);
  const awaitingUserTranscriptRef = useRef(false);
  const bufferedAIDeltasRef = useRef<string[]>([]);
  const userTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for WebRTC and audio
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);

  // Check support and API config on mount - start as null (loading)
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    // Check browser support
    setIsSupported(isVoiceSupported());

    // Check API configuration
    fetch('/api/realtime/check')
      .then(res => setIsApiConfigured(res.ok))
      .catch(() => setIsApiConfigured(false));
  }, []);

  // Auto-scroll transcript using sentinel element
  useEffect(() => {
    if (scrollSentinelRef.current) {
      requestAnimationFrame(() => {
        scrollSentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [transcript]);

  // Cleanup resources - defined early so connect can reference it
  const cleanup = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (userTranscriptTimeoutRef.current) {
      clearTimeout(userTranscriptTimeoutRef.current);
      userTranscriptTimeoutRef.current = null;
    }

    // Reset buffer state
    awaitingUserTranscriptRef.current = false;
    bufferedAIDeltasRef.current = [];

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  }, []);

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    cleanup();
    setState('idle');
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Get ephemeral token and connect
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError(VOICE_ERROR_MESSAGES.NOT_SUPPORTED);
      return;
    }

    if (isApiConfigured === false) {
      setError(VOICE_ERROR_MESSAGES.API_NOT_CONFIGURED);
      setState('error');
      return;
    }

    setState('connecting');
    setError(null);
    setTranscript([]);
    setDuration(0);

    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      setError(VOICE_ERROR_MESSAGES.CONNECTION_TIMEOUT);
      setState('error');
      cleanup();
    }, CONNECTION_TIMEOUT_MS);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: REALTIME_CONFIG.audio.sampleRate,
          channelCount: REALTIME_CONFIG.audio.channelCount,
          echoCancellation: REALTIME_CONFIG.audio.echoCancellation,
          noiseSuppression: REALTIME_CONFIG.audio.noiseSuppression,
          autoGainControl: REALTIME_CONFIG.audio.autoGainControl,
        },
      });
      localStreamRef.current = stream;

      // Set up audio analyzer for visualizer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Get ephemeral session token from our API
      const sessionResponse = await fetch(REALTIME_CONFIG.sessionEndpoint, {
        method: 'POST',
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));
        throw new VoiceError(
          errorData.error || 'Failed to create voice session',
          'CONNECTION_FAILED'
        );
      }

      const { client_secret } = await sessionResponse.json();

      // Create WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: REALTIME_CONFIG.iceServers,
      });
      peerConnectionRef.current = pc;

      // Add local audio track
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote audio (AI response)
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          const audio = new Audio();
          audio.srcObject = remoteStream;
          audio.play().catch(console.error);
        }
      };

      // Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onopen = () => {
        // Clear connection timeout - we successfully connected
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        setState('connected');
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setDuration((d) => d + 1000);
        }, 1000);
      };

      dc.onmessage = (event) => {
        handleRealtimeEvent(JSON.parse(event.data));
      };

      dc.onerror = (error) => {
        console.error('Data channel error:', error);
        setError('Connection error occurred');
        setState('error');
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp ?? '',
        }
      );

      if (!sdpResponse.ok) {
        throw new VoiceError('Failed to establish connection', 'CONNECTION_FAILED');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });
    } catch (err) {
      console.error('Voice connection error:', err);

      // Clear connection timeout on error
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      if (err instanceof VoiceError) {
        setError(VOICE_ERROR_MESSAGES[err.code] || err.message);
      } else if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(VOICE_ERROR_MESSAGES.PERMISSION_DENIED);
      } else {
        setError(VOICE_ERROR_MESSAGES.UNKNOWN);
      }

      setState('error');
      cleanup();
    }
  }, [isSupported, isApiConfigured, cleanup]);

  // Helper: append AI delta text to transcript
  const appendAIDelta = useCallback((delta: string) => {
    setTranscript((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.isPartial && lastMsg.role === 'assistant') {
        return [
          ...prev.slice(0, -1),
          { ...lastMsg, content: lastMsg.content + delta },
        ];
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: delta,
          timestamp: new Date(),
          isPartial: true,
        },
      ];
    });
  }, []);

  // Helper: flush all buffered AI deltas into transcript
  const flushBufferedDeltas = useCallback(() => {
    const deltas = bufferedAIDeltasRef.current;
    if (deltas.length > 0) {
      const combined = deltas.join('');
      bufferedAIDeltasRef.current = [];
      appendAIDelta(combined);
    }
    awaitingUserTranscriptRef.current = false;
  }, [appendAIDelta]);

  // Handle realtime events from OpenAI
  const handleRealtimeEvent = useCallback((event: Record<string, unknown>) => {
    const eventType = event['type'] as string;

    switch (eventType) {
      case 'input_audio_buffer.speech_started':
        // New turn: increment counter, start awaiting user transcript
        turnCounterRef.current += 1;
        awaitingUserTranscriptRef.current = true;
        bufferedAIDeltasRef.current = [];
        // Clear any pending grace timeout
        if (userTranscriptTimeoutRef.current) {
          clearTimeout(userTranscriptTimeoutRef.current);
          userTranscriptTimeoutRef.current = null;
        }
        setState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        // Start grace timeout — if user transcript doesn't arrive, flush anyway
        userTranscriptTimeoutRef.current = setTimeout(() => {
          flushBufferedDeltas();
        }, TRANSCRIPT_GRACE_TIMEOUT_MS);
        setState('processing');
        break;

      case 'conversation.item.input_audio_transcription.completed': {
        // User transcript arrived — add it, clear timeout, flush buffered AI deltas
        const userTranscript = event['transcript'] as string;
        if (userTranscriptTimeoutRef.current) {
          clearTimeout(userTranscriptTimeoutRef.current);
          userTranscriptTimeoutRef.current = null;
        }
        if (userTranscript) {
          setTranscript((prev) => [
            ...prev.filter((m) => !m.isPartial || m.role !== 'user'),
            {
              id: crypto.randomUUID(),
              role: 'user',
              content: userTranscript,
              timestamp: new Date(),
            },
          ]);
        }
        flushBufferedDeltas();
        break;
      }

      case 'response.audio_transcript.delta': {
        const delta = event['delta'] as string;
        if (awaitingUserTranscriptRef.current) {
          // Buffer AI deltas until user transcript arrives
          bufferedAIDeltasRef.current.push(delta);
        } else {
          // User transcript already in — render immediately
          appendAIDelta(delta);
        }
        setState('speaking');
        break;
      }

      case 'response.audio_transcript.done':
        // AI response complete — finalize partial messages
        setTranscript((prev) =>
          prev.map((m) => (m.isPartial ? { ...m, isPartial: false } : m))
        );
        setState('connected');
        break;

      case 'response.done':
        setState('connected');
        break;

      case 'error':
        console.error('Realtime API error:', event);
        setError('An error occurred during the conversation');
        setState('error');
        break;
    }
  }, [appendAIDelta, flushBufferedDeltas]);


  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);

  // Submit transcript and end
  const handleSubmitAndEnd = useCallback(() => {
    disconnect();
    if (transcript.length > 0) {
      onTranscriptComplete(transcript);
    }
  }, [disconnect, transcript, onTranscriptComplete]);

  // End call without submitting — show confirm if there's a transcript
  const handleEndOnly = useCallback(() => {
    if (transcript.length > 0) {
      setShowSubmitConfirm(true);
    } else {
      disconnect();
    }
  }, [disconnect, transcript]);

  // End without submitting (from confirm dialog)
  const handleEndWithoutSubmit = useCallback(() => {
    setShowSubmitConfirm(false);
    disconnect();
  }, [disconnect]);

  const isConnected = state === 'connected' || state === 'listening' || state === 'processing' || state === 'speaking';
  const showVisualizer = isConnected && !isMuted;

  // Show loading state while checking support and API config
  if (isSupported === null || isApiConfigured === null) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <Loader2 className="h-8 w-8 text-[#D32F2F] animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Checking voice mode availability...</p>
      </div>
    );
  }

  // Show not supported message
  if (!isSupported) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Voice Mode Not Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {VOICE_ERROR_MESSAGES.NOT_SUPPORTED}
          </p>
          <Button onClick={onSwitchToText}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Use Text Chat Instead
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show API not configured message
  if (!isApiConfigured) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Voice Mode Unavailable</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {VOICE_ERROR_MESSAGES.API_NOT_CONFIGURED}
          </p>
          <Button onClick={onSwitchToText}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Use Text Chat Instead
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('flex flex-col h-full max-h-[100dvh]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'gap-1',
              isConnected && 'bg-green-50 text-green-700 border-green-200'
            )}
          >
            {isConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Voice Active
              </>
            ) : (
              <>
                <Mic className="h-3 w-3" />
                Voice Mode
              </>
            )}
          </Badge>
          {isConnected && (
            <span className="text-sm text-muted-foreground">
              {formatDuration(duration)}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onSwitchToText}>
          <MessageSquare className="h-4 w-4 mr-1" />
          Text
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 min-h-0">
        {/* Status display */}
        {state === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#D32F2F]/10 flex items-center justify-center mb-4">
              <Headphones className="h-12 w-12 text-[#D32F2F]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Talk to Our Renovation Expert</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Have a natural voice conversation about your project. Our expert will ask about your vision, room details, and timeline — then prepare a personalized estimate.
            </p>
            <Button
              size="lg"
              onClick={connect}
              className="bg-[#D32F2F] hover:bg-[#B71C1C]"
            >
              <Phone className="h-5 w-5 mr-2" />
              Start Conversation
            </Button>
          </div>
        )}

        {state === 'connecting' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-[#D32F2F] animate-spin mb-4" />
            <p className="text-muted-foreground">Connecting...</p>
          </div>
        )}

        {state === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="font-semibold mb-2">Connection Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onSwitchToText}>
                Use Text
              </Button>
              <Button onClick={connect}>Try Again</Button>
            </div>
          </div>
        )}

        {isConnected && (
          <>
            {/* Audio visualizer */}
            <div className="flex items-center justify-center py-4">
              <div className="w-full max-w-xs">
                <AudioVisualizer
                  isActive={showVisualizer && (state === 'listening' || state === 'speaking')}
                  analyser={analyserRef.current}
                />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {state === 'listening' && 'Listening...'}
                  {state === 'processing' && 'Processing...'}
                  {state === 'speaking' && (
                    <span className="flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI is speaking
                    </span>
                  )}
                  {state === 'connected' && 'Speak when ready'}
                </p>
              </div>
            </div>

            {/* Transcript */}
            <ScrollArea ref={scrollRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="p-4 space-y-3">
                {transcript.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Start speaking to see the transcript here
                  </p>
                ) : (
                  transcript.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2 md:py-3 text-sm md:text-base',
                          'break-words overflow-hidden',
                          msg.role === 'user'
                            ? 'bg-[#D32F2F] text-white rounded-br-md'
                            : 'bg-muted rounded-bl-md',
                          msg.isPartial && 'opacity-70'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollSentinelRef} aria-hidden="true" className="h-px" />
              </div>
            </ScrollArea>

            {/* Controls */}
            <div className="flex flex-col items-center gap-3 py-2 md:py-4 pb-[env(safe-area-inset-bottom)]">
              {/* Primary CTA: Submit & Get Quote */}
              {transcript.length > 0 && !showSubmitConfirm && (
                <Button
                  size="lg"
                  className="w-full max-w-xs h-12 text-base font-semibold bg-[#D32F2F] hover:bg-[#B71C1C]"
                  onClick={handleSubmitAndEnd}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Submit &amp; Get Quote ({transcript.filter(m => m.role === 'user').length} messages)
                </Button>
              )}

              {/* Inline confirmation when ending with transcript */}
              {showSubmitConfirm && (
                <div className="w-full max-w-xs space-y-2 text-center">
                  <p className="text-sm font-medium">Ready to get your quote?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={handleEndWithoutSubmit}
                    >
                      No thanks, just end
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C]"
                      onClick={() => {
                        setShowSubmitConfirm(false);
                        handleSubmitAndEnd();
                      }}
                    >
                      Submit &amp; Get Quote
                    </Button>
                  </div>
                </div>
              )}

              {/* Secondary controls: Mute + End Call */}
              {!showSubmitConfirm && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    className="rounded-full px-6"
                    onClick={handleEndOnly}
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    End Call
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
