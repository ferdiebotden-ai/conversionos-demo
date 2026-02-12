/**
 * Personas Index
 * Re-exports all persona modules
 */

export type { PersonaKey, AgentPersona } from './types';
export { RECEPTIONIST_PERSONA } from './receptionist';
export { QUOTE_SPECIALIST_PERSONA } from './quote-specialist';
export { DESIGN_CONSULTANT_PERSONA } from './design-consultant';
export {
  buildAgentSystemPrompt,
  buildVoiceSystemPrompt,
  buildDynamicSystemPrompt,
  detectKnowledgeDomain,
  getPersona,
} from './prompt-assembler';
