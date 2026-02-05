#!/usr/bin/env npx tsx
/**
 * Setup Test Admin User
 * Creates the test admin user for E2E testing
 *
 * Usage: npx tsx scripts/setup-test-admin.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

const TEST_ADMIN_EMAIL = 'admin@airenodemo.com';
const TEST_ADMIN_PASSWORD = 'testpassword123';

async function main() {
  console.log('🔧 Setting up test admin user...\n');

  if (!SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    console.log('\nTo get your service role key:');
    console.log('1. Go to Supabase Dashboard → Settings → API');
    console.log('2. Copy the "service_role" key (NOT the anon key)');
    console.log('3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  const existingUser = existingUsers.users.find(u => u.email === TEST_ADMIN_EMAIL);

  if (existingUser) {
    console.log(`✅ User ${TEST_ADMIN_EMAIL} already exists (ID: ${existingUser.id})`);

    // Check if already admin
    const isAdmin = existingUser.app_metadata?.['role'] === 'admin';
    if (isAdmin) {
      console.log('✅ User already has admin role');
      console.log('\n🎉 Test admin user is ready!');
      return;
    }

    // Update to add admin role
    console.log('📝 Adding admin role...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      app_metadata: { ...existingUser.app_metadata, role: 'admin' },
    });

    if (updateError) {
      console.error('❌ Failed to update user:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Admin role added');
  } else {
    // Create new user with admin role
    console.log(`📝 Creating user ${TEST_ADMIN_EMAIL}...`);

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      app_metadata: { role: 'admin' },
    });

    if (createError) {
      console.error('❌ Failed to create user:', createError.message);
      process.exit(1);
    }

    console.log(`✅ User created (ID: ${newUser.user?.id})`);
    console.log('✅ Email auto-confirmed');
    console.log('✅ Admin role assigned');
  }

  console.log('\n🎉 Test admin user is ready!');
  console.log('\nCredentials:');
  console.log(`  Email:    ${TEST_ADMIN_EMAIL}`);
  console.log(`  Password: ${TEST_ADMIN_PASSWORD}`);
  console.log('\nYou can now run the E2E tests or start the ralph-loop.');
}

main().catch(console.error);
