/**
 * Admin Auth Helpers
 * Functions for admin authentication and authorization
 */

import { createClient as createServerClient } from '@/lib/db/server';
import type { User } from '@supabase/supabase-js';

/**
 * Check if a user has admin role in their metadata
 */
export function isAdminRole(user: User | null): boolean {
  if (!user) return false;
  // Cast to access role property - Supabase User type doesn't include custom metadata
  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  return metadata?.['role'] === 'admin';
}

/**
 * Check if the current user is authenticated as admin
 * Call this in Server Components or Route Handlers
 * Returns user only if they have admin role
 */
export async function getAdminUser() {
  const supabase = await createServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Verify admin role via app_metadata
  if (!isAdminRole(user)) {
    return null;
  }

  return user;
}

/**
 * Require admin authentication
 * Throws an error if not authenticated
 */
export async function requireAdmin() {
  const user = await getAdminUser();

  if (!user) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

/**
 * Sign out the current user
 */
export async function signOutAdmin() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
}
