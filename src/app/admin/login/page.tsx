import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { LoginForm } from '@/components/admin/login-form';
import { createClient } from '@/lib/db/server';

export default async function AdminLoginPage() {
  // Check if user is already authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is already logged in, redirect to admin
  if (user) {
    redirect('/admin');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">AI Reno Demo</h1>
          <p className="text-muted-foreground">Admin Dashboard</p>
        </div>

        {/* Login card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-center mb-6">
            Sign in to your account
          </h2>
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Lead-to-Quote Engine v2 &bull; Powered by AI
        </p>
      </div>
    </main>
  );
}
