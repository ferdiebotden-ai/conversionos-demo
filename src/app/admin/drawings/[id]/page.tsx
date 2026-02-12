'use client';

/**
 * Drawing Detail / Editor Page
 * Shows drawing metadata and placeholder for future Chili3D CAD embed
 * [DEV-093 to DEV-096]
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { ArrowLeft, Save, FileText, Pencil } from 'lucide-react';
import type { Drawing, DrawingStatus } from '@/types/database';

const CadEditor = dynamic(() => import('@/components/cad/cad-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[600px] rounded-lg border bg-background overflow-hidden">
      <div className="w-12 bg-card border-r" />
      <div className="flex flex-col flex-1">
        <div className="h-10 bg-card border-b" />
        <div className="flex-1 bg-muted/30 flex items-center justify-center">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="h-7 bg-muted border-t" />
      </div>
    </div>
  ),
});

const STATUS_CONFIG: Record<DrawingStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  approved: { label: 'Approved', variant: 'outline' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function DrawingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params['id'] as string;

  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<DrawingStatus>('draft');
  const [permitNumber, setPermitNumber] = useState('');

  const fetchDrawing = useCallback(async () => {
    const res = await fetch(`/api/drawings/${id}`);
    if (res.ok) {
      const data = await res.json();
      setDrawing(data.data);
      setName(data.data.name);
      setDescription(data.data.description || '');
      setStatus(data.data.status);
      setPermitNumber(data.data.permit_number || '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDrawing();
  }, [fetchDrawing]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/drawings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, status, permit_number: permitNumber || null }),
    });
    if (res.ok) {
      const data = await res.json();
      setDrawing(data.data);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!drawing) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Drawing not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/drawings">Back to Drawings</Link>
        </Button>
      </div>
    );
  }

  const config = STATUS_CONFIG[drawing.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/drawings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{drawing.name}</h2>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            {drawing.permit_number && (
              <p className="text-muted-foreground">Permit: {drawing.permit_number}</p>
            )}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save Details'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Saves name, description, and status. Drawing content autosaves.</TooltipContent>
        </Tooltip>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: CAD Editor */}
        <div className="lg:col-span-2 min-h-[600px]">
          <CadEditor
            drawingId={id}
            initialData={drawing.drawing_data ?? null}
            drawingName={name}
          />
        </div>

        {/* Right: Metadata panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Drawing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drawing-name">Name</Label>
                <Input
                  id="drawing-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawing-desc">Description</Label>
                <Textarea
                  id="drawing-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawing-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as DrawingStatus)}>
                  <SelectTrigger id="drawing-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawing-permit">Permit Number</Label>
                <Input
                  id="drawing-permit"
                  value={permitNumber}
                  onChange={(e) => setPermitNumber(e.target.value)}
                  placeholder="e.g. BP-2026-0042"
                />
              </div>
            </CardContent>
          </Card>

          {drawing.lead_id && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="link" size="sm" className="p-0 h-auto">
                  <Link href={`/admin/leads/${drawing.lead_id}`}>
                    View Lead &rarr;
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
