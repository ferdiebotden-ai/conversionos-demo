'use client';

/**
 * Voice Transcript Message
 * Thin wrapper around MessageBubble adding a headphone badge
 * to distinguish voice-transcribed messages from typed ones
 */

import { Headphones } from 'lucide-react';
import { MessageBubble } from '@/components/chat/message-bubble';

interface VoiceTranscriptMessageProps {
  role: 'user' | 'assistant';
  content: string;
  agentName?: string | undefined;
}

export function VoiceTranscriptMessage({
  role,
  content,
  agentName,
}: VoiceTranscriptMessageProps) {
  return (
    <div className="relative">
      <MessageBubble
        role={role}
        content={content}
        agentName={agentName}
      />
      <div className="absolute top-1 right-1">
        <span
          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5"
          title="Transcribed from voice"
        >
          <Headphones className="h-2.5 w-2.5" />
        </span>
      </div>
    </div>
  );
}
