/**
 * Persona Handoff Utilities
 * Serializes conversation context to sessionStorage for cross-page handoffs
 */

import type { PersonaKey } from '@/lib/ai/personas/types';

const HANDOFF_KEY = 'demo_handoff_context';

export interface HandoffContext {
  fromPersona: PersonaKey;
  toPersona: PersonaKey;
  summary: string;
  /** Last N messages serialized for context */
  recentMessages: { role: 'user' | 'assistant'; content: string }[];
  /** Any extracted data (estimate data, design preferences, etc.) */
  extractedData?: Record<string, unknown> | undefined;
  /** Visualization data when handing off from visualizer */
  visualizationData?: {
    id: string;
    concepts: { id: string; imageUrl: string; description?: string }[];
    originalImageUrl: string;
    roomType: string;
    style: string;
  } | undefined;
  /** Design preferences from the streamlined form */
  designPreferences?: {
    roomType: string;
    customRoomType?: string;
    style: string;
    customStyle?: string;
    textPreferences: string;
    voicePreferencesSummary?: string;
  } | undefined;
  timestamp: number;
}

/**
 * Build a concise summary from recent messages for handoff context
 */
export function buildHandoffSummary(
  messages: { role: 'user' | 'assistant'; content: string }[],
): string {
  // Take last 6 messages for context
  const recent = messages.slice(-6);
  const userMessages = recent.filter(m => m.role === 'user');

  if (userMessages.length === 0) return 'The user was browsing but hasn\'t shared specifics yet.';

  // Build a short summary from user messages
  const topics = userMessages
    .map(m => m.content.slice(0, 150))
    .join(' | ');

  return `The user discussed: ${topics}`;
}

/**
 * Serialize handoff context to sessionStorage before navigation
 */
export function serializeHandoffContext(
  fromPersona: PersonaKey,
  toPersona: PersonaKey,
  messages: { role: 'user' | 'assistant'; content: string }[],
  extractedData?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;

  const context: HandoffContext = {
    fromPersona,
    toPersona,
    summary: buildHandoffSummary(messages),
    recentMessages: messages.slice(-6),
    extractedData,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(context));
  } catch {
    // sessionStorage might be full or unavailable
    console.warn('Failed to save handoff context');
  }
}

/**
 * Read handoff context from sessionStorage (returns null if none or expired)
 */
export function readHandoffContext(): HandoffContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;

    const context: HandoffContext = JSON.parse(raw);

    // Expire after 15 minutes
    if (Date.now() - context.timestamp > 15 * 60 * 1000) {
      clearHandoffContext();
      return null;
    }

    return context;
  } catch {
    return null;
  }
}

/**
 * Clear handoff context after reading
 */
export function clearHandoffContext(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    // ignore
  }
}

/**
 * Build a system prompt prefix from handoff context
 */
export function buildHandoffPromptPrefix(context: HandoffContext): string {
  const personaNames: Record<PersonaKey, string> = {
    receptionist: 'Emma (the receptionist)',
    'quote-specialist': 'Marcus (the cost specialist)',
    'design-consultant': 'Mia (the design consultant)',
  };

  const fromName = personaNames[context.fromPersona];

  let prefix = `## Handoff Context
The user was just speaking with ${fromName}. Here's what was discussed:
${context.summary}`;

  if (context.extractedData && Object.keys(context.extractedData).length > 0) {
    prefix += `\n\nExtracted data from the previous conversation:\n${JSON.stringify(context.extractedData, null, 2)}`;
  }

  // Rich visualization handoff data
  if (context.designPreferences) {
    const dp = context.designPreferences;
    const roomLabel = dp.customRoomType || dp.roomType.replace(/_/g, ' ');
    const styleLabel = dp.customStyle || dp.style;
    prefix += `\n\n## Handoff from Design Visualizer`;
    prefix += `\nRoom: ${roomLabel} | Style: ${styleLabel}`;
    if (dp.textPreferences) {
      prefix += `\nText Preferences: "${dp.textPreferences}"`;
    }
    if (dp.voicePreferencesSummary) {
      prefix += `\nVoice Summary: "${dp.voicePreferencesSummary}"`;
    }
  }

  if (context.visualizationData) {
    const vd = context.visualizationData;
    prefix += `\nVisualization: ${vd.concepts.length} concepts generated (ID: ${vd.id})`;
  }

  prefix += '\n\nGreet them warmly and acknowledge you know what they were discussing. Don\'t repeat everything — just show awareness and pick up where they left off.';

  return prefix;
}
