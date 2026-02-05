'use client';

/**
 * Admin Header
 * Top header bar with mobile menu toggle and user info
 */

import { Button } from '@/components/ui/button';
import { Menu, Bell } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export function AdminHeader({ onMenuClick, title = 'Dashboard' }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page title */}
      <h1 className="text-lg font-semibold flex-1">{title}</h1>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User avatar */}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
          RW
        </div>
      </div>
    </header>
  );
}
