/**
 * OpenAI Realtime API Session Route
 * Generates ephemeral client tokens for secure browser-based WebRTC connections
 * [DEV-075]
 */

import { NextResponse } from 'next/server';
import { REALTIME_MODEL, TRANSCRIPTION_MODEL, VAD_CONFIG } from '@/lib/realtime/config';

const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
const USE_SEMANTIC_VAD = process.env['USE_SEMANTIC_VAD'] !== 'false';

// System prompt for renovation intake voice agent
const RENOVATION_VOICE_SYSTEM_PROMPT = `You are a friendly and professional renovation consultant for AI Reno Demo, a trusted renovation company in Greater Ontario Area.

Your role is to help potential customers describe their renovation project through natural conversation. You should:

1. Be warm and conversational, like talking to a knowledgeable friend
2. Ask about their renovation goals one topic at a time
3. Listen carefully and ask follow-up questions to understand their vision
4. Confirm details as you go ("So you're thinking of a modern kitchen with white cabinets, is that right?")
5. Gently guide the conversation to cover:
   - What room/area they want to renovate
   - Their style preferences and inspirations
   - Must-have features and nice-to-haves
   - Any existing elements they want to keep
   - Budget range (if they're comfortable sharing)
   - Desired timeline

Important guidelines:
- Keep responses concise - this is voice, not text
- Don't overwhelm with multiple questions at once
- Be encouraging about their ideas
- If they seem unsure, offer 2-3 concrete options to choose from
- When you've gathered enough information, summarize and thank them

Remember: You're in Greater Ontario Area. Reference Ontario-specific things like:
- Seasonal considerations (cold winters, permits, etc.)
- Local building codes and permit requirements
- HST (13%) is included in quotes

Be professional but personable. Your goal is to make them feel heard and excited about their renovation project.`;

export async function POST() {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Voice service not configured' },
      { status: 503 }
    );
  }

  try {
    // Create ephemeral session token via OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: 'alloy',
        instructions: RENOVATION_VOICE_SYSTEM_PROMPT,
        input_audio_transcription: {
          model: TRANSCRIPTION_MODEL,
        },
        turn_detection: USE_SEMANTIC_VAD
          ? VAD_CONFIG.semantic
          : VAD_CONFIG.serverVad,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI Realtime session error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create voice session' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      client_secret: data.client_secret,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error('Error creating realtime session:', error);
    return NextResponse.json(
      { error: 'Failed to initialize voice service' },
      { status: 500 }
    );
  }
}
