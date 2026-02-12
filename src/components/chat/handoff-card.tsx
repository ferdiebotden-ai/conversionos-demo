'use client';

/**
 * Handoff Card
 * Rich inline card for persona-to-persona navigation with context passing
 * Renders within chat message flow as a visual CTA
 */

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator, Palette } from 'lucide-react';
import { serializeHandoffContext } from '@/lib/chat/handoff';
import type { PersonaKey } from '@/lib/ai/personas/types';

interface HandoffCardProps {
  /** Current persona (source) */
  fromPersona: PersonaKey;
  /** Target persona */
  toPersona: PersonaKey;
  /** Recent messages for context serialization */
  messages: { role: 'user' | 'assistant'; content: string }[];
  /** Extracted data to pass along */
  extractedData?: Record<string, unknown>;
}

const PERSONA_INFO: Record<PersonaKey, {
  name: string;
  role: string;
  path: string;
  icon: typeof Calculator;
  color: string;
}> = {
  receptionist: {
    name: 'Emma',
    role: 'Virtual Receptionist',
    path: '/',
    icon: ArrowRight,
    color: 'bg-primary',
  },
  'quote-specialist': {
    name: 'Marcus',
    role: 'Budget & Cost Specialist',
    path: '/estimate',
    icon: Calculator,
    color: 'bg-blue-600',
  },
  'design-consultant': {
    name: 'Mia',
    role: 'Design Consultant',
    path: '/visualizer',
    icon: Palette,
    color: 'bg-purple-600',
  },
};

export function HandoffCard({
  fromPersona,
  toPersona,
  messages,
  extractedData,
}: HandoffCardProps) {
  const target = PERSONA_INFO[toPersona];
  const Icon = target.icon;

  const handleClick = useCallback(() => {
    // Serialize context to sessionStorage before navigating
    serializeHandoffContext(fromPersona, toPersona, messages, extractedData);
    // Full page navigation to reliably exit the widget overlay context
    window.location.href = `${target.path}?handoff=${fromPersona}`;
  }, [fromPersona, toPersona, messages, extractedData, target.path]);

  return (
    <div className="my-2 mx-1">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
      >
        <div className={`h-10 w-10 rounded-full ${target.color} text-white flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{target.name}</p>
          <p className="text-xs text-muted-foreground">{target.role}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </button>
    </div>
  );
}
