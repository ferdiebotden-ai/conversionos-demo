import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (formerly Middleware)
 * DEMO: Auth bypassed — restore before production handoff
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/admin/:path*'],
};
