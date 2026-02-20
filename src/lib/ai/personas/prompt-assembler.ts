/**
 * Prompt Assembler
 * Builds layered system prompts for each AI agent persona
 * Supports dynamic cross-domain knowledge injection
 */

import type { PersonaKey } from './types';
import { RECEPTIONIST_PERSONA, RECEPTIONIST_PROMPT_RULES } from './receptionist';
import { QUOTE_SPECIALIST_PERSONA, QUOTE_SPECIALIST_PROMPT_RULES } from './quote-specialist';
import { DESIGN_CONSULTANT_PERSONA, DESIGN_CONSULTANT_PROMPT_RULES } from './design-consultant';
import {
  COMPANY_PROFILE,
  COMPANY_SUMMARY,
  SERVICES_KNOWLEDGE,
  SERVICES_SUMMARY,
  PRICING_FULL,
  PRICING_SUMMARY,
  ONTARIO_GENERAL_KNOWLEDGE,
  ONTARIO_BUDGET_KNOWLEDGE,
  ONTARIO_DESIGN_KNOWLEDGE,
  SALES_TRAINING,
} from '../knowledge';

const PERSONAS = {
  receptionist: RECEPTIONIST_PERSONA,
  'quote-specialist': QUOTE_SPECIALIST_PERSONA,
  'design-consultant': DESIGN_CONSULTANT_PERSONA,
} as const;

// ---------------------------------------------------------------------------
// Knowledge domain detection (keyword-based, no extra AI call)
// ---------------------------------------------------------------------------

const PRICING_KEYWORDS = [
  'cost', 'price', 'estimate', 'budget', 'how much', 'afford',
  'spend', 'expensive', 'cheap', 'quote', 'ballpark', 'range',
  'per square', 'sqft', 'sq ft', '\\$',
];

const DESIGN_KEYWORDS = [
  'style', 'design', 'modern', 'farmhouse', 'traditional', 'industrial',
  'minimalist', 'contemporary', 'color', 'colour', 'material', 'tile',
  'countertop', 'cabinet', 'flooring', 'visualize', 'look like',
  'aesthetic', 'vibe', 'feel',
];

type KnowledgeDomain = 'pricing' | 'design';

/**
 * Detect which knowledge domains a user message touches
 */
export function detectKnowledgeDomain(message: string): KnowledgeDomain[] {
  const lower = message.toLowerCase();
  const domains: KnowledgeDomain[] = [];

  if (PRICING_KEYWORDS.some(kw => lower.includes(kw.replace('\\$', '$')))) {
    domains.push('pricing');
  }
  if (DESIGN_KEYWORDS.some(kw => lower.includes(kw))) {
    domains.push('design');
  }

  return domains;
}

/**
 * Build a dynamic knowledge supplement based on the user's message
 * and the current persona. Returns extra prompt text to append, or ''.
 *
 * Rules:
 * - Emma (receptionist) asking about pricing → inject PRICING_SUMMARY
 * - Emma asking about design → inject short ONTARIO_DESIGN_KNOWLEDGE snippet
 * - Marcus (quote-specialist) asking about design → inject design snippet
 * - Mia (design-consultant) asking about pricing → inject PRICING_SUMMARY
 */
export function buildDynamicSystemPrompt(
  personaKey: PersonaKey,
  userMessage: string,
): string {
  const domains = detectKnowledgeDomain(userMessage);
  if (domains.length === 0) return '';

  const additions: string[] = [];

  for (const domain of domains) {
    switch (domain) {
      case 'pricing':
        // Only inject if persona doesn't already have full pricing
        if (personaKey === 'receptionist' || personaKey === 'design-consultant') {
          additions.push(`## Cross-Domain Knowledge: Pricing Context
When the homeowner asks about costs, you can share these general ranges to be helpful.
For detailed line-item estimates, suggest they speak with Marcus at /estimate.

${PRICING_SUMMARY}`);
        }
        break;

      case 'design':
        // Only inject if persona doesn't already have design knowledge
        if (personaKey === 'receptionist' || personaKey === 'quote-specialist') {
          additions.push(`## Cross-Domain Knowledge: Design Context
When the homeowner asks about styles or materials, you can share these insights.
For full design consultation and visualization, suggest Mia at /visualizer.

${ONTARIO_DESIGN_KNOWLEDGE}`);
        }
        break;
    }
  }

  return additions.join('\n\n');
}

// ---------------------------------------------------------------------------
// Core prompt builders
// ---------------------------------------------------------------------------

/**
 * Build the full system prompt for a text-based AI agent
 *
 * Layering:
 * 1. Company + Services (shared)
 * 2. Role-specific knowledge
 * 3. Sales training (shared)
 * 4. Persona identity + boundaries + rules
 *
 * Optional: pass userMessage to enable dynamic cross-domain injection
 */
export function buildAgentSystemPrompt(
  personaKey: PersonaKey,
  options?: { userMessage?: string | undefined; estimateData?: Record<string, unknown> | undefined; handoffContext?: Record<string, unknown> | undefined; companyName?: string | undefined },
): string {
  const companyName = options?.companyName || 'the company';
  const persona = PERSONAS[personaKey];

  // Layer 1: Shared company knowledge (scope varies by agent)
  let layer1 = '';
  switch (personaKey) {
    case 'receptionist':
      layer1 = `${COMPANY_PROFILE}\n\n${SERVICES_SUMMARY}\n\n${ONTARIO_GENERAL_KNOWLEDGE}`;
      break;
    case 'quote-specialist':
      layer1 = `${COMPANY_SUMMARY}\n\n${SERVICES_KNOWLEDGE}`;
      break;
    case 'design-consultant':
      layer1 = `${COMPANY_SUMMARY}\n\n${SERVICES_SUMMARY}`;
      break;
  }

  // Layer 2: Role-specific knowledge
  let layer2 = '';
  switch (personaKey) {
    case 'receptionist':
      layer2 = PRICING_SUMMARY;
      break;
    case 'quote-specialist':
      layer2 = `${PRICING_FULL}\n\n${ONTARIO_BUDGET_KNOWLEDGE}`;
      break;
    case 'design-consultant':
      layer2 = ONTARIO_DESIGN_KNOWLEDGE;
      break;
  }

  // Layer 3: Sales training (shared)
  const layer3 = SALES_TRAINING;

  // Layer 4: Persona identity + rules
  let personaRules = '';
  switch (personaKey) {
    case 'receptionist':
      personaRules = RECEPTIONIST_PROMPT_RULES;
      break;
    case 'quote-specialist':
      personaRules = QUOTE_SPECIALIST_PROMPT_RULES;
      break;
    case 'design-consultant':
      personaRules = DESIGN_CONSULTANT_PROMPT_RULES;
      break;
  }

  const layer4 = `## Your Identity
You are **${persona.name}**, the ${persona.role} at ${companyName}.

### Personality
${persona.personalityTraits.map(t => `- ${t}`).join('\n')}

### What You Can Do
${persona.capabilities.map(c => `- ${c}`).join('\n')}

### Boundaries
${persona.boundaries.map(b => `- ${b}`).join('\n')}

### Routing to Other Agents
${Object.values(persona.routingSuggestions).map(s => `- ${s}`).join('\n')}

${personaRules}`;

  let prompt = `${layer4}\n\n---\n\n${layer1}\n\n---\n\n${layer2}\n\n---\n\n${layer3}`;

  // Dynamic cross-domain knowledge injection
  if (options?.userMessage) {
    const dynamicKnowledge = buildDynamicSystemPrompt(personaKey, options.userMessage);
    if (dynamicKnowledge) {
      prompt += `\n\n---\n\n${dynamicKnowledge}`;
    }
  }

  // Rich handoff context from visualizer (for Marcus)
  if (options?.handoffContext && personaKey === 'quote-specialist') {
    const hc = options.handoffContext;
    let handoffSection = '## Handoff from Design Visualizer\n';

    const dp = hc['designPreferences'] as Record<string, string> | undefined;
    if (dp) {
      const roomLabel = dp['customRoomType'] || dp['roomType']?.replace(/_/g, ' ') || 'Unknown';
      const styleLabel = dp['customStyle'] || dp['style'] || 'Unknown';
      handoffSection += `Room: ${roomLabel} | Style: ${styleLabel}\n`;
      if (dp['textPreferences']) {
        handoffSection += `Text Preferences: "${dp['textPreferences']}"\n`;
      }
      if (dp['voicePreferencesSummary']) {
        handoffSection += `Voice Summary: "${dp['voicePreferencesSummary']}"\n`;
      }
    }

    const vd = hc['visualizationData'] as Record<string, unknown> | undefined;
    if (vd) {
      const concepts = vd['concepts'] as unknown[];
      handoffSection += `Visualization: ${concepts?.length || 0} concepts generated (ID: ${vd['id']})\n`;
    }

    prompt += `\n\n---\n\n${handoffSection}`;
  }

  return prompt;
}

/**
 * Build a voice-optimized system prompt for an AI agent
 * Voice prompts are more concise with voice-specific rules
 */
export function buildVoiceSystemPrompt(personaKey: PersonaKey, options?: { companyName?: string; companyLocation?: string }): string {
  const companyName = options?.companyName || 'the company';
  const companyLocation = options?.companyLocation || 'London, ON';
  const persona = PERSONAS[personaKey];

  // Use the same knowledge layers but in a more compressed form
  let knowledgeContext = '';
  switch (personaKey) {
    case 'receptionist':
      knowledgeContext = `${COMPANY_SUMMARY}\n\n${SERVICES_SUMMARY}\n\n${PRICING_SUMMARY}`;
      break;
    case 'quote-specialist':
      knowledgeContext = `${COMPANY_SUMMARY}\n\n${SERVICES_SUMMARY}\n\n${PRICING_FULL}\n\n${ONTARIO_BUDGET_KNOWLEDGE}`;
      break;
    case 'design-consultant':
      knowledgeContext = `${COMPANY_SUMMARY}\n\n${SERVICES_SUMMARY}\n\n${ONTARIO_DESIGN_KNOWLEDGE}`;
      break;
  }

  return `You are ${persona.name}, the ${persona.role} at ${companyName} in ${companyLocation}.

## Voice Conversation Rules
- Keep every response to 1–2 sentences maximum — this is a voice conversation
- ONE topic at a time — never stack multiple questions
- Use verbal acknowledgments: "Got it", "Makes sense", "Love that"
- Speak naturally with contractions: "I'd", "we'll", "that's"
- No lists, no markdown, no formatting — just natural speech
- Pause between topics to let the homeowner respond
- Be warm, friendly, and conversational — like talking to a knowledgeable friend
- If they seem unsure, offer 2–3 concrete options to choose from

## Your Personality
${persona.personalityTraits.slice(0, 3).map(t => `- ${t}`).join('\n')}

## What You Can Help With
${persona.capabilities.slice(0, 4).map(c => `- ${c}`).join('\n')}

## Boundaries
${persona.boundaries.slice(0, 3).map(b => `- ${b}`).join('\n')}
---

${knowledgeContext}`;
}

/**
 * Get a persona by key
 */
export function getPersona(personaKey: PersonaKey) {
  return PERSONAS[personaKey];
}
