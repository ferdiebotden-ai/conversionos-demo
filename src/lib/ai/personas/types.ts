/**
 * Agent Persona Types
 * Shared type definitions for AI agent personas
 */

export type PersonaKey = 'receptionist' | 'quote-specialist' | 'design-consultant';

export interface AgentPersona {
  /** Agent's display name */
  name: string;
  /** Agent's role title */
  role: string;
  /** Short tagline shown in UI */
  tagline: string;
  /** Opening greeting message */
  greeting: string;
  /** Personality traits that shape responses */
  personalityTraits: string[];
  /** What this agent can help with */
  capabilities: string[];
  /** What this agent should NOT do */
  boundaries: string[];
  /** Suggestions for routing to other agents */
  routingSuggestions: Record<string, string>;
  /** Lucide icon name for avatar */
  avatarIcon: string;
  /** Tailwind color class for avatar */
  avatarColor: string;
  /** ElevenLabs agent env var key (e.g., 'ELEVENLABS_AGENT_EMMA') */
  elevenlabsAgentEnvKey: string;
}
