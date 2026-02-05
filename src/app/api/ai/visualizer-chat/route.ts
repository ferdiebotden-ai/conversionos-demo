/**
 * Visualizer Chat API Route
 * Conversational design intent gathering for enhanced visualizations
 */

import { streamText, generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@/lib/ai/providers';
import { AI_CONFIG } from '@/lib/ai/config';
import {
  analyzeRoomPhotoForVisualization,
  type RoomAnalysis,
} from '@/lib/ai/photo-analyzer';
import {
  type VisualizerConversationContext,
  createInitialContext,
  addPhotoAnalysis,
  addMessage,
  updateState,
  checkGenerationReadiness,
  shouldTransitionState,
  buildVisualizerSystemPrompt,
} from '@/lib/ai/visualizer-conversation';
import { designStyleSchema } from '@/lib/schemas/visualization';

export const maxDuration = 60;

// Request schema
const chatRequestSchema = z.object({
  message: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
  imageBase64: z.string().optional(),
  isInitial: z.boolean().optional().default(false),
});

// Extraction schema for user messages
const userMessageExtractionSchema = z.object({
  desiredChanges: z.array(z.string()).describe('Specific renovation changes mentioned'),
  constraintsToPreserve: z.array(z.string()).describe('Things to keep unchanged'),
  stylePreference: z.string().optional().describe('Design style if mentioned'),
  materialPreferences: z.array(z.string()).describe('Specific materials mentioned'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { error: 'Invalid request', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { message, context: providedContext, imageBase64, isInitial } = parseResult.data;

    // Initialize or restore context
    let context: VisualizerConversationContext = providedContext
      ? (providedContext as unknown as VisualizerConversationContext)
      : createInitialContext();

    // If initial message with image, perform photo analysis
    if (isInitial && imageBase64) {
      try {
        console.log('Analyzing uploaded photo...');
        const analysis = await analyzeRoomPhotoForVisualization(imageBase64);
        context = addPhotoAnalysis(context, analysis);

        // Generate initial response describing what we see
        const initialResponse = await generateInitialResponse(analysis);

        context = addMessage(context, 'assistant', initialResponse);

        return Response.json({
          message: initialResponse,
          context,
          photoAnalysis: analysis,
          readiness: checkGenerationReadiness(context),
        });
      } catch (error) {
        console.error('Photo analysis failed:', error);
        // Continue without analysis
        context = updateState(context, 'intent_gathering');
      }
    }

    // Extract design intent from user message
    const extraction = await extractFromMessage(message);

    // Add user message with extracted data
    context = addMessage(context, 'user', message, {
      desiredChanges: extraction.desiredChanges,
      constraintsToPreserve: extraction.constraintsToPreserve,
      stylePreference: extraction.stylePreference,
      materialPreferences: extraction.materialPreferences,
    });

    // Check for style preference specifically
    if (extraction.stylePreference) {
      const validStyles = ['modern', 'traditional', 'farmhouse', 'industrial', 'minimalist', 'contemporary'] as const;
      const normalizedStyle = extraction.stylePreference.toLowerCase();
      if (validStyles.includes(normalizedStyle as typeof validStyles[number])) {
        const validatedStyle = normalizedStyle as typeof validStyles[number];
        // Build extractedData with explicit stylePreference assignment
        const updatedExtractedData = {
          desiredChanges: context.extractedData.desiredChanges,
          constraintsToPreserve: context.extractedData.constraintsToPreserve,
          materialPreferences: context.extractedData.materialPreferences,
          confidenceScore: context.extractedData.confidenceScore,
          stylePreference: validatedStyle,
          ...(context.extractedData.roomType && { roomType: context.extractedData.roomType }),
        };
        context = {
          ...context,
          extractedData: updatedExtractedData,
        };
      }
    }

    // Check if state should transition
    const newState = shouldTransitionState(context);
    if (newState) {
      context = updateState(context, newState);
    }

    // Check readiness
    const readiness = checkGenerationReadiness(context);

    // Generate response
    const systemPrompt = buildVisualizerSystemPrompt(context);

    const result = streamText({
      model: openai(AI_CONFIG.openai.chat),
      system: systemPrompt,
      messages: context.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      maxOutputTokens: 300,
      temperature: 0.7,
      async onFinish({ text }) {
        // Add assistant response to context
        context = addMessage(context, 'assistant', text);
      },
    });

    // Return streaming response with context in headers
    const stream = result.toTextStreamResponse();

    // We need to return context separately since we can't modify the stream
    // The client will need to make a follow-up call or we use a different approach
    return new Response(stream.body, {
      headers: {
        ...Object.fromEntries(stream.headers.entries()),
        'X-Conversation-Context': encodeURIComponent(JSON.stringify(context)),
        'X-Generation-Ready': String(readiness.isReady),
        'X-Confidence': String(readiness.qualityConfidence),
      },
    });
  } catch (error) {
    console.error('Visualizer chat error:', error);
    return Response.json(
      { error: 'Chat failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate initial response based on photo analysis
async function generateInitialResponse(analysis: RoomAnalysis): Promise<string> {
  const roomType = analysis.roomType.replace('_', ' ');
  const condition = analysis.currentCondition;
  const layout = analysis.layoutType;
  const fixtures = analysis.identifiedFixtures.slice(0, 4);

  let response = `I can see this is ${/^[aeiou]/i.test(roomType) ? 'an' : 'a'} ${roomType} `;

  if (layout) {
    response += `with a ${layout.toLowerCase()} layout. `;
  }

  if (condition === 'excellent' || condition === 'good') {
    response += `It's in ${condition} condition! `;
  } else if (condition === 'dated') {
    response += `It looks like it could use some updating. `;
  } else {
    response += `I can see there's great potential here for a transformation. `;
  }

  if (fixtures.length > 0) {
    response += `I notice the ${fixtures.slice(0, 2).join(' and ')}. `;
  }

  response += `\n\nWhat kind of changes are you hoping to make? `;
  response += `Are you thinking of a complete style overhaul, or focusing on specific elements?`;

  return response;
}

// Extract design intent from user message
async function extractFromMessage(message: string): Promise<z.infer<typeof userMessageExtractionSchema>> {
  try {
    const result = await generateObject({
      model: openai(AI_CONFIG.openai.extraction),
      schema: userMessageExtractionSchema,
      prompt: `Extract renovation design intent from this message. Be specific and actionable.

User message: "${message}"

Extract:
- desiredChanges: Specific changes they want (e.g., "new countertops", "update lighting")
- constraintsToPreserve: Things they want to keep (e.g., "keep the layout", "preserve the cabinets")
- stylePreference: If they mention a style (modern, traditional, farmhouse, industrial, minimalist, contemporary)
- materialPreferences: Specific materials mentioned (e.g., "quartz", "subway tile", "brass")

Only include items actually mentioned or clearly implied.`,
      maxOutputTokens: 300,
      temperature: 0.2,
    });

    return result.object;
  } catch (error) {
    console.error('Extraction failed:', error);
    return {
      desiredChanges: [],
      constraintsToPreserve: [],
      materialPreferences: [],
    };
  }
}
