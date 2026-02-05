/**
 * Question Flow State Machine
 * Manages the conversation state for the AI Quote Assistant
 */

export type ConversationState =
  | 'welcome'
  | 'photo_analysis'
  | 'project_type'
  | 'kitchen_questions'
  | 'bathroom_questions'
  | 'basement_questions'
  | 'flooring_questions'
  | 'other_questions'
  | 'scope_summary'
  | 'estimate_display'
  | 'contact_capture'
  | 'completion';

export interface ConversationContext {
  state: ConversationState;
  projectType?: string;
  hasPhoto: boolean;
  photoAnalyzed: boolean;
  scopeConfirmed: boolean;
  estimateProvided: boolean;
  contactCollected: boolean;
  data: {
    roomType?: string;
    areaSqft?: number;
    finishLevel?: string;
    timeline?: string;
    budgetBand?: string;
    specialRequirements?: string[];
    contact?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
}

/**
 * Initial conversation context
 */
export function createInitialContext(): ConversationContext {
  return {
    state: 'welcome',
    hasPhoto: false,
    photoAnalyzed: false,
    scopeConfirmed: false,
    estimateProvided: false,
    contactCollected: false,
    data: {},
  };
}

/**
 * Transition to next state based on current state and action
 */
export function transitionState(
  context: ConversationContext,
  action: string
): ConversationContext {
  const { state } = context;

  switch (state) {
    case 'welcome':
      if (action === 'photo_uploaded') {
        return { ...context, state: 'photo_analysis', hasPhoto: true };
      }
      if (action === 'skip_photo') {
        return { ...context, state: 'project_type' };
      }
      break;

    case 'photo_analysis':
      if (action === 'analysis_complete') {
        return { ...context, state: 'project_type', photoAnalyzed: true };
      }
      break;

    case 'project_type':
      if (action.startsWith('select_')) {
        const projectType = action.replace('select_', '');
        const questionState = getQuestionStateForProject(projectType);
        return { ...context, state: questionState, projectType };
      }
      break;

    case 'kitchen_questions':
    case 'bathroom_questions':
    case 'basement_questions':
    case 'flooring_questions':
    case 'other_questions':
      if (action === 'scope_confirmed') {
        return { ...context, state: 'scope_summary', scopeConfirmed: true };
      }
      break;

    case 'scope_summary':
      if (action === 'show_estimate') {
        return { ...context, state: 'estimate_display' };
      }
      break;

    case 'estimate_display':
      if (action === 'estimate_shown') {
        return { ...context, state: 'contact_capture', estimateProvided: true };
      }
      break;

    case 'contact_capture':
      if (action === 'contact_provided') {
        return { ...context, state: 'completion', contactCollected: true };
      }
      break;

    default:
      return context;
  }

  return context;
}

/**
 * Get the question state for a project type
 */
function getQuestionStateForProject(projectType: string): ConversationState {
  const stateMap: Record<string, ConversationState> = {
    kitchen: 'kitchen_questions',
    bathroom: 'bathroom_questions',
    basement: 'basement_questions',
    flooring: 'flooring_questions',
  };
  return stateMap[projectType] || 'other_questions';
}

/**
 * Project-specific questions
 */
export const PROJECT_QUESTIONS: Record<string, string[]> = {
  kitchen: [
    'Are you looking at a full kitchen remodel or updating specific elements?',
    'What are your thoughts on the cabinets - keep, refinish, or replace?',
    'What countertop material are you considering? (laminate, quartz, granite)',
    'Will you need new appliances included in the project?',
    'Any changes to the layout or just updating in place?',
  ],
  bathroom: [
    'Is this a full bathroom renovation or updating fixtures?',
    'What type of bathroom is this? (primary, secondary, powder room)',
    'Are you thinking of converting the tub to a walk-in shower?',
    'What kind of tile work are you envisioning?',
    'Any accessibility features needed?',
  ],
  basement: [
    'What do you want to use the finished basement for?',
    'Will you need a bathroom down there?',
    'Is there any existing finish we need to remove?',
    'Do you need egress windows for bedrooms?',
    'Any moisture or waterproofing concerns?',
  ],
  flooring: [
    'What rooms will need new flooring?',
    'What type of flooring are you considering? (hardwood, LVP, tile, carpet)',
    'Is there existing flooring that needs removal?',
    'Do you need transitions to other flooring types?',
    'Any subfloor repairs needed?',
  ],
};

