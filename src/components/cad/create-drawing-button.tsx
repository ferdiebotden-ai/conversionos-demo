'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateDrawingButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Drawing' }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/drawings/${data.data.id}`);
      }
    } catch {
      // Allow retry on failure
    } finally {
      setCreating(false);
    }
  };

  return (
    <Button onClick={handleCreate} disabled={creating} size="sm">
      {creating ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 mr-1" />
      )}
      New Drawing
    </Button>
  );
}
