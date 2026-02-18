import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (Next.js 16 replacement for middleware)
 * Demo mode: pass through all requests without auth checks
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}
