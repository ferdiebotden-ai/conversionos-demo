'use client';

/**
 * Message Bubble
 * Displays user or AI messages in the chat interface
 */

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  images?: string[] | undefined;
  timestamp?: Date | undefined;
  'data-testid'?: string;
}

export function MessageBubble({ role, content, images, timestamp, 'data-testid': dataTestId }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      data-testid={dataTestId || `${role}-message`}
    >
      {/* Avatar */}
      <Avatar className={cn(
        'h-8 w-8 shrink-0',
        isUser ? 'bg-primary' : 'bg-muted'
      )}>
        <AvatarFallback className={cn(
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Images (if any) */}
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((src, index) => (
              <div
                key={index}
                className="relative h-32 w-32 rounded-lg overflow-hidden border border-border"
              >
                <Image
                  src={src}
                  alt={`Uploaded image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Text content */}
        <div
          className={cn(
            'rounded-[1rem] px-4 py-2.5',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
