/**
 * Voice Service Configuration Check
 * Returns whether ElevenLabs voice service is properly configured
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!process.env['ELEVENLABS_API_KEY'];

  if (isConfigured) {
    return NextResponse.json({ configured: true });
  }

  return NextResponse.json(
    { configured: false, message: 'Voice service not configured' },
    { status: 503 }
  );
}
