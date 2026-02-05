/**
 * Visualizer Conversation State Machine Tests
 * Tests for the conversation flow and state transitions
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialContext,
  addPhotoAnalysis,
  addMessage,
  checkGenerationReadiness,
  shouldTransitionState,
  updateState,
  getNextQuestion,
  buildVisualizerSystemPrompt,
} from '@/lib/ai/visualizer-conversation';
import type { RoomAnalysis } from '@/lib/ai/photo-analyzer';

describe('Visualizer Conversation State Machine', () => {
  describe('createInitialContext', () => {
    it('creates context with initial state', () => {
      const context = createInitialContext();

      expect(context.state).toBe('photo_analysis');
      expect(context.turnCount).toBe(0);
      expect(context.extractedData.desiredChanges).toEqual([]);
      expect(context.extractedData.constraintsToPreserve).toEqual([]);
      expect(context.extractedData.materialPreferences).toEqual([]);
      expect(context.extractedData.confidenceScore).toBe(0);
      expect(context.conversationHistory).toEqual([]);
    });

    it('accepts optional sessionId', () => {
      const context = createInitialContext('session-abc-123');

      expect(context.sessionId).toBe('session-abc-123');
    });

    it('does not include sessionId when not provided', () => {
      const context = createInitialContext();

      expect(context.sessionId).toBeUndefined();
    });
  });

  describe('addPhotoAnalysis', () => {
    const mockAnalysis: RoomAnalysis = {
      roomType: 'kitchen',
      currentCondition: 'dated',
      structuralElements: ['load-bearing wall', 'ceiling beam'],
      identifiedFixtures: ['island', 'corner sink'],
      layoutType: 'galley',
      lightingConditions: 'natural light from window',
      perspectiveNotes: 'front view from doorway',
      preservationConstraints: ['plumbing locations', 'window position'],
      confidenceScore: 0.9,
    };

    it('transitions to intent_gathering state', () => {
      const initial = createInitialContext();
      const updated = addPhotoAnalysis(initial, mockAnalysis);

      expect(updated.state).toBe('intent_gathering');
    });

    it('stores photo analysis', () => {
      const initial = createInitialContext();
      const updated = addPhotoAnalysis(initial, mockAnalysis);

      expect(updated.photoAnalysis).toEqual(mockAnalysis);
    });

    it('extracts room type from analysis', () => {
      const initial = createInitialContext();
      const updated = addPhotoAnalysis(initial, mockAnalysis);

      expect(updated.extractedData.roomType).toBe('kitchen');
    });

    it('merges preservation constraints', () => {
      const initial = createInitialContext();
      const updated = addPhotoAnalysis(initial, mockAnalysis);

      expect(updated.extractedData.constraintsToPreserve).toContain('plumbing locations');
      expect(updated.extractedData.constraintsToPreserve).toContain('window position');
    });

    it('preserves existing context data', () => {
      let context = createInitialContext('test-session');
      context = {
        ...context,
        extractedData: {
          ...context.extractedData,
          desiredChanges: ['new counters'],
        },
      };

      const updated = addPhotoAnalysis(context, mockAnalysis);

      expect(updated.extractedData.desiredChanges).toContain('new counters');
      expect(updated.sessionId).toBe('test-session');
    });
  });

  describe('addMessage', () => {
    it('adds user message and increments turn count', () => {
      const initial = createInitialContext();
      const updated = addMessage(initial, 'user', 'I want modern countertops');

      expect(updated.turnCount).toBe(1);
      expect(updated.conversationHistory).toHaveLength(1);
      expect(updated.conversationHistory[0].role).toBe('user');
      expect(updated.conversationHistory[0].content).toBe('I want modern countertops');
    });

    it('adds assistant message without incrementing turn count', () => {
      const initial = createInitialContext();
      const updated = addMessage(initial, 'assistant', 'What style do you prefer?');

      expect(updated.turnCount).toBe(0);
      expect(updated.conversationHistory).toHaveLength(1);
      expect(updated.conversationHistory[0].role).toBe('assistant');
    });

    it('merges extracted data when provided', () => {
      const initial = createInitialContext();
      const updated = addMessage(initial, 'user', 'I want quartz counters in a modern style', {
        desiredChanges: ['quartz countertops'],
        materialPreferences: ['quartz'],
        stylePreference: 'modern',
      });

      expect(updated.extractedData.desiredChanges).toContain('quartz countertops');
      expect(updated.extractedData.materialPreferences).toContain('quartz');
      expect(updated.extractedData.stylePreference).toBe('modern');
    });

    it('accumulates multiple extracted data across messages', () => {
      let context = createInitialContext();

      context = addMessage(context, 'user', 'I want new counters', {
        desiredChanges: ['new countertops'],
      });

      context = addMessage(context, 'user', 'Also new lighting', {
        desiredChanges: ['new lighting fixtures'],
      });

      expect(context.extractedData.desiredChanges).toContain('new countertops');
      expect(context.extractedData.desiredChanges).toContain('new lighting fixtures');
      expect(context.turnCount).toBe(2);
    });

    it('deduplicates extracted changes', () => {
      let context = createInitialContext();

      context = addMessage(context, 'user', 'I want quartz', {
        materialPreferences: ['quartz'],
      });

      context = addMessage(context, 'user', 'Definitely quartz', {
        materialPreferences: ['quartz'],
      });

      expect(context.extractedData.materialPreferences.filter(m => m === 'quartz')).toHaveLength(1);
    });

    it('generates unique message IDs', () => {
      let context = createInitialContext();
      context = addMessage(context, 'user', 'First message');
      context = addMessage(context, 'user', 'Second message');

      expect(context.conversationHistory[0].id).not.toBe(context.conversationHistory[1].id);
    });

    it('adds timestamp to messages', () => {
      const initial = createInitialContext();
      const updated = addMessage(initial, 'user', 'Test message');

      expect(updated.conversationHistory[0].timestamp).toBeDefined();
      expect(() => new Date(updated.conversationHistory[0].timestamp)).not.toThrow();
    });
  });

  describe('updateState', () => {
    it('updates state correctly', () => {
      const initial = createInitialContext();
      const updated = updateState(initial, 'intent_gathering');

      expect(updated.state).toBe('intent_gathering');
    });

    it('preserves other context properties', () => {
      let context = createInitialContext('session-123');
      context = addMessage(context, 'user', 'Test');
      context = updateState(context, 'refinement');

      expect(context.sessionId).toBe('session-123');
      expect(context.turnCount).toBe(1);
    });
  });

  describe('checkGenerationReadiness', () => {
    it('returns not ready with empty context', () => {
      const context = createInitialContext();
      const readiness = checkGenerationReadiness(context);

      expect(readiness.isReady).toBe(false);
      expect(readiness.missingInfo).toContain('room type');
    });

    it('requires design style preference', () => {
      let context = createInitialContext();
      context = addPhotoAnalysis(context, {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'L-shaped',
        lightingConditions: 'natural',
        perspectiveNotes: 'front',
        preservationConstraints: [],
        confidenceScore: 0.9,
      });

      const readiness = checkGenerationReadiness(context);

      expect(readiness.isReady).toBe(false);
      expect(readiness.missingInfo).toContain('design style preference');
    });

    it('returns ready with sufficient context', () => {
      let context = createInitialContext();
      context = addPhotoAnalysis(context, {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'L-shaped',
        lightingConditions: 'natural',
        perspectiveNotes: 'front',
        preservationConstraints: [],
        confidenceScore: 0.9,
      });
      context = addMessage(context, 'user', 'Modern style please', {
        desiredChanges: ['modern cabinets'],
        stylePreference: 'modern',
      });

      const readiness = checkGenerationReadiness(context);

      expect(readiness.isReady).toBe(true);
      expect(readiness.qualityConfidence).toBeGreaterThan(0.5);
    });

    it('becomes ready after 3 turns with style preference', () => {
      let context = createInitialContext();
      context = addMessage(context, 'user', 'I want modern', { stylePreference: 'modern' });
      context = addMessage(context, 'user', 'Yes modern');
      context = addMessage(context, 'user', 'That looks good');

      const readiness = checkGenerationReadiness(context);

      expect(readiness.isReady).toBe(true);
    });

    it('provides generation summary', () => {
      let context = createInitialContext();
      context = addPhotoAnalysis(context, {
        roomType: 'bathroom',
        currentCondition: 'good',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'full',
        lightingConditions: 'natural',
        perspectiveNotes: 'corner',
        preservationConstraints: [],
        confidenceScore: 0.85,
      });
      context = addMessage(context, 'user', 'Farmhouse style with subway tile', {
        stylePreference: 'farmhouse',
        desiredChanges: ['subway tile backsplash'],
      });

      const readiness = checkGenerationReadiness(context);

      expect(readiness.generationSummary).toContain('farmhouse');
      expect(readiness.generationSummary).toContain('bathroom');
    });

    it('suggests a style when not provided', () => {
      const context = createInitialContext();
      const readiness = checkGenerationReadiness(context);

      expect(readiness.suggestedStyle).toBeDefined();
    });

    it('calculates confidence score based on available info', () => {
      let context = createInitialContext();

      // Empty context
      let readiness = checkGenerationReadiness(context);
      const emptyConfidence = readiness.qualityConfidence;

      // With photo analysis
      context = addPhotoAnalysis(context, {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'open',
        lightingConditions: 'bright',
        perspectiveNotes: 'front',
        preservationConstraints: [],
        confidenceScore: 0.85,
      });
      readiness = checkGenerationReadiness(context);
      const withAnalysisConfidence = readiness.qualityConfidence;

      expect(withAnalysisConfidence).toBeGreaterThan(emptyConfidence);
    });
  });

  describe('shouldTransitionState', () => {
    it('transitions from photo_analysis to intent_gathering', () => {
      const context = createInitialContext();
      const newState = shouldTransitionState(context);

      expect(newState).toBe('intent_gathering');
    });

    it('transitions to style_selection when changes exist but no style', () => {
      let context = createInitialContext();
      context = updateState(context, 'intent_gathering');
      context = addMessage(context, 'user', 'I want new counters', {
        desiredChanges: ['new countertops'],
      });

      const newState = shouldTransitionState(context);

      expect(newState).toBe('style_selection');
    });

    it('transitions to refinement when style is selected', () => {
      let context = createInitialContext();
      context = updateState(context, 'intent_gathering');
      context = addMessage(context, 'user', 'Modern style please', {
        stylePreference: 'modern',
      });

      const newState = shouldTransitionState(context);

      expect(newState).toBe('refinement');
    });

    it('transitions to generation_ready when all info gathered', () => {
      let context = createInitialContext();
      context = addPhotoAnalysis(context, {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'L-shaped',
        lightingConditions: 'natural',
        perspectiveNotes: 'front',
        preservationConstraints: [],
        confidenceScore: 0.9,
      });
      context = addMessage(context, 'user', 'Modern with quartz', {
        stylePreference: 'modern',
        desiredChanges: ['quartz counters'],
      });

      const newState = shouldTransitionState(context);

      expect(newState).toBe('generation_ready');
    });
  });

  describe('getNextQuestion', () => {
    it('returns null in photo_analysis state', () => {
      const context = createInitialContext();
      const question = getNextQuestion(context);

      expect(question).toBeNull();
    });

    it('asks about desired changes when none provided', () => {
      let context = createInitialContext();
      context = updateState(context, 'intent_gathering');

      const question = getNextQuestion(context);

      expect(question).toBeTruthy();
      expect(question?.toLowerCase()).toContain('change');
    });

    it('asks about style when changes exist but no style', () => {
      let context = createInitialContext();
      context = updateState(context, 'intent_gathering');
      context = {
        ...context,
        extractedData: {
          ...context.extractedData,
          desiredChanges: ['new counters'],
        },
      };

      const question = getNextQuestion(context);

      expect(question).toBeTruthy();
      expect(question?.toLowerCase()).toContain('style');
    });

    it('returns null when ready for generation', () => {
      let context = createInitialContext();
      context = updateState(context, 'generation_ready');

      const question = getNextQuestion(context);

      expect(question).toBeNull();
    });

    it('returns null after 5 turns', () => {
      let context = createInitialContext();
      context = updateState(context, 'refinement');
      // Simulate 5 turns
      for (let i = 0; i < 5; i++) {
        context = addMessage(context, 'user', `Message ${i}`);
      }

      const question = getNextQuestion(context);

      expect(question).toBeNull();
    });
  });

  describe('buildVisualizerSystemPrompt', () => {
    it('includes current state in prompt', () => {
      const context = createInitialContext();
      const prompt = buildVisualizerSystemPrompt(context);

      expect(prompt).toContain('CURRENT STATE: photo_analysis');
    });

    it('includes turn count', () => {
      let context = createInitialContext();
      context = addMessage(context, 'user', 'Test');
      context = addMessage(context, 'user', 'Test 2');

      const prompt = buildVisualizerSystemPrompt(context);

      expect(prompt).toContain('TURN COUNT: 2');
    });

    it('includes photo analysis when available', () => {
      let context = createInitialContext();
      context = addPhotoAnalysis(context, {
        roomType: 'bathroom',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: ['pedestal sink', 'clawfoot tub'],
        layoutType: 'full bath',
        lightingConditions: 'natural light',
        perspectiveNotes: 'corner angle',
        preservationConstraints: ['plumbing'],
        confidenceScore: 0.88,
      });

      const prompt = buildVisualizerSystemPrompt(context);

      expect(prompt).toContain('PHOTO ANALYSIS');
      expect(prompt).toContain('Room Type: bathroom');
      expect(prompt).toContain('full bath');
    });

    it('includes gathered data when available', () => {
      let context = createInitialContext();
      context = addMessage(context, 'user', 'Modern with marble', {
        stylePreference: 'modern',
        materialPreferences: ['marble'],
      });

      const prompt = buildVisualizerSystemPrompt(context);

      expect(prompt).toContain('GATHERED SO FAR');
      expect(prompt).toContain('Style Preference: modern');
      expect(prompt).toContain('marble');
    });

    it('includes design style references', () => {
      const context = createInitialContext();
      const prompt = buildVisualizerSystemPrompt(context);

      expect(prompt).toContain('DESIGN STYLES TO REFERENCE');
      expect(prompt).toContain('Modern');
      expect(prompt).toContain('Traditional');
      expect(prompt).toContain('Farmhouse');
    });

    it('includes conversation guidelines', () => {
      const context = createInitialContext();
      const prompt = buildVisualizerSystemPrompt(context);

      expect(prompt).toContain('GUIDELINES');
      expect(prompt).toContain('ONE question at a time');
    });
  });

  describe('state transitions', () => {
    it('transitions through expected full flow', () => {
      let context = createInitialContext();
      expect(context.state).toBe('photo_analysis');

      // After photo analysis
      context = addPhotoAnalysis(context, {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'open',
        lightingConditions: 'bright',
        perspectiveNotes: 'corner',
        preservationConstraints: [],
        confidenceScore: 0.85,
      });
      expect(context.state).toBe('intent_gathering');

      // After user provides changes
      context = addMessage(context, 'user', 'I want new cabinets', {
        desiredChanges: ['new cabinets'],
      });
      let newState = shouldTransitionState(context);
      if (newState) context = updateState(context, newState);
      expect(context.state).toBe('style_selection');

      // After style selection
      context = addMessage(context, 'user', 'Modern style', {
        stylePreference: 'modern',
      });
      newState = shouldTransitionState(context);
      if (newState) context = updateState(context, newState);

      // Should be either refinement or generation_ready
      expect(['refinement', 'generation_ready']).toContain(context.state);
    });
  });
});
