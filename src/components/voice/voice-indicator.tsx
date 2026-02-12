'use client';

/**
 * Voice Indicator
 * Compact status strip (48px) shown between messages and input during voice
 * Shows avatar, status text, duration, mute, and end controls
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MicOff, Mic, PhoneOff } from 'lucide-react';
import { PersonaAvatar } from './persona-avatar';
import { useVoice } from './voice-provider';
import { formatDuration } from '@/lib/voice/config';
import type { PersonaKey } from '@/lib/ai/personas/types';

const PERSONA_NAMES: Record<PersonaKey, string> = {
  receptionist: 'Emma',
  'quote-specialist': 'Marcus',
  'design-consultant': 'Mia',
};

interface VoiceIndicatorProps {
  persona: PersonaKey;
  className?: string;
}

export function VoiceIndicator({ persona, className }: VoiceIndicatorProps) {
  const { status, mode, isMuted, outputVolume, durationMs, toggleMute, endVoice } = useVoice();

  if (status !== 'connected') return null;

  const name = PERSONA_NAMES[persona];

  const avatarState = mode === 'speaking' ? 'speaking' : mode === 'listening' ? 'listening' : 'static';

  const statusText =
    mode === 'speaking'
      ? `${name} is speaking...`
      : mode === 'listening'
        ? 'Listening...'
        : 'Speak when ready';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 bg-muted/50 border-y border-border',
        'min-h-[48px]',
        className
      )}
    >
      {/* Left: avatar + status */}
      <PersonaAvatar
        persona={persona}
        size="sm"
        state={avatarState}
        outputVolume={outputVolume}
      />
      <span className="text-sm text-muted-foreground flex-1 truncate">
        {statusText}
      </span>

      {/* Center: duration */}
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDuration(durationMs)}
      </span>

      {/* Right: mute + end */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? (
          <MicOff className="h-4 w-4 text-destructive" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
        onClick={() => endVoice()}
        aria-label="End voice call"
      >
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  );
}
