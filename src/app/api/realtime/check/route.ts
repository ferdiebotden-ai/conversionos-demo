/**
 * Voice Mode API Configuration Check
 * Returns whether voice service is properly configured
 * [DEV-075]
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!process.env['OPENAI_API_KEY'];

  if (isConfigured) {
    return NextResponse.json({ configured: true });
  }

  return NextResponse.json(
    { configured: false, message: 'Voice service not configured' },
    { status: 503 }
  );
}
