'use client';

/**
 * Quote Editor
 * Full quote editor with line items, totals, assumptions/exclusions, and AI integration
 * [DEV-054, DEV-055, DEV-056, DEV-072]
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QuoteLineItem, type LineItem } from './quote-line-item';
import { AIQuoteSuggestions } from './ai-quote-suggestions';
import { QuoteSendWizard } from './quote-send-wizard';
import type { QuoteDraft, Json } from '@/types/database';
import type { AIGeneratedQuote, AIQuoteLineItem } from '@/lib/schemas/ai-quote';
import {
  Plus,
  Save,
  Loader2,
  FileText,
  AlertCircle,
  Download,
  Send,
  Check,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

// Business constants
const HST_PERCENT = 13;
const DEPOSIT_PERCENT = 50;
const DEFAULT_CONTINGENCY_PERCENT = 10;

// Default templates
const DEFAULT_ASSUMPTIONS = [
  'All work to be completed during regular business hours (Mon-Fri, 8am-5pm)',
  'Customer provides access to work area and utilities',
  'Existing structure is sound and code-compliant',
  'No hidden damage or issues behind walls/floors',
];

const DEFAULT_EXCLUSIONS = [
  'Permit fees (if required)',
  'Moving or storage of customer belongings',
  'Repairs to existing structural damage',
  'Hazardous material removal (asbestos, mold, etc.)',
];

interface QuoteEditorProps {
  leadId: string;
  initialQuote: QuoteDraft | null;
  initialEstimate: Json | null;
  customerEmail?: string;
  customerName?: string;
  projectType?: string;
  goalsText?: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface ParsedLineItem {
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total?: number;
  isFromAI?: boolean;
  isModified?: boolean;
  isAccepted?: boolean;
}

function isLineItemObject(item: Json): item is { [key: string]: Json | undefined } {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

function parseLineItems(lineItems: Json | null): LineItem[] {
  if (!Array.isArray(lineItems)) return [];
  return lineItems
    .filter(isLineItemObject)
    .map((item) => {
      const parsed = item as unknown as ParsedLineItem;
      return {
        id: generateId(),
        description: parsed.description || '',
        category: (parsed.category as LineItem['category']) || 'other',
        quantity: parsed.quantity || 1,
        unit: parsed.unit || 'ea',
        unit_price: parsed.unit_price || 0,
        total: parsed.total || 0,
        isFromAI: parsed.isFromAI || false,
        isModified: parsed.isModified || false,
        isAccepted: parsed.isAccepted || false,
      };
    });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

// Extract AI quote from initialEstimate
function extractAIQuote(estimate: Json | null): AIGeneratedQuote | null {
  if (!estimate || typeof estimate !== 'object' || Array.isArray(estimate)) {
    return null;
  }
  const obj = estimate as { aiQuote?: AIGeneratedQuote };
  return obj.aiQuote || null;
}

export function QuoteEditor({
  leadId,
  initialQuote,
  initialEstimate,
  customerEmail,
  customerName,
  projectType = 'other',
  goalsText,
}: QuoteEditorProps) {
  // Extract AI quote from initial estimate
  const aiQuoteFromEstimate = extractAIQuote(initialEstimate);

  // State
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (initialQuote) {
      return parseLineItems(initialQuote.line_items);
    }
    return [];
  });

  const [aiQuote, setAiQuote] = useState<AIGeneratedQuote | null>(aiQuoteFromEstimate);
  const [acceptedAIItemIds, setAcceptedAIItemIds] = useState<Set<string>>(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [contingencyPercent, setContingencyPercent] = useState(
    initialQuote?.contingency_percent ?? DEFAULT_CONTINGENCY_PERCENT
  );

  const [assumptions, setAssumptions] = useState<string>(() => {
    // Use AI assumptions if available and no existing quote
    if (!initialQuote && aiQuoteFromEstimate?.assumptions?.length) {
      return aiQuoteFromEstimate.assumptions.join('\n');
    }
    return (initialQuote?.assumptions || DEFAULT_ASSUMPTIONS).join('\n');
  });

  const [exclusions, setExclusions] = useState<string>(() => {
    // Use AI exclusions if available and no existing quote
    if (!initialQuote && aiQuoteFromEstimate?.exclusions?.length) {
      return aiQuoteFromEstimate.exclusions.join('\n');
    }
    return (initialQuote?.exclusions || DEFAULT_EXCLUSIONS).join('\n');
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF and send quote state
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSendWizard, setShowSendWizard] = useState(false);
  const [sentAt, setSentAt] = useState<Date | null>(
    initialQuote?.sent_at ? new Date(initialQuote.sent_at) : null
  );

  // Debounce ref for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const contingencyAmount = subtotal * (contingencyPercent / 100);
  const subtotalWithContingency = subtotal + contingencyAmount;
  const hstAmount = subtotalWithContingency * (HST_PERCENT / 100);
  const total = subtotalWithContingency + hstAmount;
  const depositRequired = total * (DEPOSIT_PERCENT / 100);

  // Count AI items
  const aiItemCount = lineItems.filter((item) => item.isFromAI).length;

  // Save function
  const saveQuote = useCallback(async () => {
    if (lineItems.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items: lineItems.map(({ id, ...item }) => item),
          assumptions: assumptions.split('\n').filter((a) => a.trim()),
          exclusions: exclusions.split('\n').filter((e) => e.trim()),
          contingency_percent: contingencyPercent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save quote');
      }

      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving quote:', err);
      setError('Failed to save quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [leadId, lineItems, assumptions, exclusions, contingencyPercent]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveQuote();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasChanges, saveQuote]);

  // Mark as changed
  function markChanged() {
    setHasChanges(true);
  }

  // Line item handlers
  function handleAddItem() {
    const newItem: LineItem = {
      id: generateId(),
      description: '',
      category: 'materials',
      quantity: 1,
      unit: 'ea',
      unit_price: 0,
      total: 0,
      isFromAI: false,
    };
    setLineItems([...lineItems, newItem]);
    markChanged();
  }

  function handleUpdateItem(index: number, updatedItem: LineItem) {
    const newItems = [...lineItems];
    // If editing an AI item, mark it as modified
    if (newItems[index]?.isFromAI) {
      updatedItem.isFromAI = false; // Mark as modified
    }
    newItems[index] = updatedItem;
    setLineItems(newItems);
    markChanged();
  }

  function handleDeleteItem(index: number) {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    markChanged();
  }

  function handleDuplicateItem(index: number) {
    const itemToDuplicate = lineItems[index];
    if (!itemToDuplicate) return;

    const duplicatedItem: LineItem = {
      ...itemToDuplicate,
      id: generateId(),
      description: `${itemToDuplicate.description} (copy)`,
      isFromAI: false, // Duplicates are manual
      isModified: false,
      isAccepted: false,
    };

    const newItems = [...lineItems];
    newItems.splice(index + 1, 0, duplicatedItem);
    setLineItems(newItems);
    markChanged();
  }

  // AI integration handlers
  function handleAcceptAIItem(item: AIQuoteLineItem) {
    const newLineItem: LineItem = {
      id: generateId(),
      description: item.description,
      category: item.category as LineItem['category'],
      quantity: 1,
      unit: 'lot',
      unit_price: item.total,
      total: item.total,
      isFromAI: true,
      isModified: false,
      isAccepted: true,
    };
    setLineItems([...lineItems, newLineItem]);

    // Track accepted item
    const itemIndex = aiQuote?.lineItems.findIndex(
      (i) => i.description === item.description && i.total === item.total
    );
    if (itemIndex !== undefined && itemIndex >= 0) {
      setAcceptedAIItemIds((prev) => new Set([...prev, `ai-${itemIndex}`]));
    }

    markChanged();
  }

  function handleAcceptAllAIItems() {
    if (!aiQuote) return;

    const newItems: LineItem[] = aiQuote.lineItems
      .filter((_, i) => !acceptedAIItemIds.has(`ai-${i}`))
      .map((item) => ({
        id: generateId(),
        description: item.description,
        category: item.category as LineItem['category'],
        quantity: 1,
        unit: 'lot',
        unit_price: item.total,
        total: item.total,
        isFromAI: true,
        isModified: false,
        isAccepted: true,
      }));

    setLineItems([...lineItems, ...newItems]);

    // Mark all as accepted
    const allIds = new Set(aiQuote.lineItems.map((_, i) => `ai-${i}`));
    setAcceptedAIItemIds(allIds);

    // Also update assumptions/exclusions from AI if not already modified
    if (aiQuote.assumptions.length > 0) {
      setAssumptions(aiQuote.assumptions.join('\n'));
    }
    if (aiQuote.exclusions.length > 0) {
      setExclusions(aiQuote.exclusions.join('\n'));
    }

    markChanged();
  }

  async function handleRegenerateAIQuote(guidance?: string) {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${leadId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidance }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate quote');
      }

      const data = await response.json();
      setAiQuote(data.aiQuote);
      setAcceptedAIItemIds(new Set()); // Reset accepted items
    } catch (err) {
      console.error('Error regenerating quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate quote');
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleResetToAI() {
    if (!aiQuote) return;

    // Clear existing items and replace with AI items
    const aiItems: LineItem[] = aiQuote.lineItems.map((item) => ({
      id: generateId(),
      description: item.description,
      category: item.category as LineItem['category'],
      quantity: 1,
      unit: 'lot',
      unit_price: item.total,
      total: item.total,
      isFromAI: true,
      isModified: false,
      isAccepted: true,
    }));

    setLineItems(aiItems);

    // Mark all as accepted
    const allIds = new Set(aiQuote.lineItems.map((_, i) => `ai-${i}`));
    setAcceptedAIItemIds(allIds);

    // Reset assumptions/exclusions
    if (aiQuote.assumptions.length > 0) {
      setAssumptions(aiQuote.assumptions.join('\n'));
    }
    if (aiQuote.exclusions.length > 0) {
      setExclusions(aiQuote.exclusions.join('\n'));
    }

    markChanged();
  }

  // Download PDF
  async function handleDownloadPdf() {
    if (lineItems.length === 0) {
      setError('Add line items before downloading PDF');
      return;
    }

    // Save first if there are unsaved changes
    if (hasChanges) {
      await saveQuote();
    }

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${leadId}/pdf`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'quote.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  }

  // Handle send wizard opening - save first if needed
  async function handleOpenSendWizard() {
    if (lineItems.length === 0) {
      setError('Add line items before sending quote');
      return;
    }

    if (!customerEmail) {
      setError('No email address available for this customer');
      return;
    }

    // Save first if there are unsaved changes
    if (hasChanges) {
      await saveQuote();
    }

    setShowSendWizard(true);
  }

  // Handle send complete - refresh the page
  function handleSendComplete() {
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      {/* AI Quote Suggestions */}
      {aiQuote && (
        <AIQuoteSuggestions
          aiQuote={aiQuote}
          onAcceptItem={handleAcceptAIItem}
          onAcceptAll={handleAcceptAllAIItems}
          onRegenerate={handleRegenerateAIQuote}
          isRegenerating={isRegenerating}
          acceptedItemIds={acceptedAIItemIds}
        />
      )}

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Line Items
            </CardTitle>
            {aiItemCount > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                {aiItemCount} from AI
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {hasChanges && !isSaving && (
              <span className="text-xs text-amber-600">Unsaved changes</span>
            )}
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            <Button onClick={saveQuote} disabled={isSaving || !hasChanges} size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Initial estimate info (legacy display) */}
          {initialEstimate && !initialQuote && !aiQuote && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                AI Estimate:{' '}
                {formatCurrency((initialEstimate as { estimateLow?: number }).estimateLow || 0)} -{' '}
                {formatCurrency((initialEstimate as { estimateHigh?: number }).estimateHigh || 0)}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Qty</TableHead>
                  <TableHead className="w-[80px]">Unit</TableHead>
                  <TableHead className="w-[120px]">Unit Price</TableHead>
                  <TableHead className="text-right w-[120px]">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <QuoteLineItem
                    key={item.id}
                    item={item}
                    onChange={(updated) => handleUpdateItem(index, updated)}
                    onDelete={() => handleDeleteItem(index)}
                    onDuplicate={() => handleDuplicateItem(index)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line Item
            </Button>
            {aiQuote && lineItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToAI}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset to AI Quote
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quote Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-md">
            {/* Subtotal */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            {/* Contingency */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Contingency</span>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={contingencyPercent}
                  onChange={(e) => {
                    setContingencyPercent(parseFloat(e.target.value) || 0);
                    markChanged();
                  }}
                  className="w-[70px] h-8"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <span className="font-medium">{formatCurrency(contingencyAmount)}</span>
            </div>

            {/* HST */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">HST ({HST_PERCENT}%)</span>
              <span className="font-medium">{formatCurrency(hstAmount)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between pt-3 border-t">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>

            {/* Deposit */}
            <div className="flex justify-between text-primary">
              <span className="font-medium">
                Deposit Required ({DEPOSIT_PERCENT}%)
              </span>
              <span className="font-bold">{formatCurrency(depositRequired)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions & Exclusions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="assumptions" className="text-sm text-muted-foreground">
                One assumption per line
              </Label>
              <Textarea
                id="assumptions"
                value={assumptions}
                onChange={(e) => {
                  setAssumptions(e.target.value);
                  markChanged();
                }}
                placeholder="Enter assumptions..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="exclusions" className="text-sm text-muted-foreground">
                One exclusion per line
              </Label>
              <Textarea
                id="exclusions"
                value={exclusions}
                onChange={(e) => {
                  setExclusions(e.target.value);
                  markChanged();
                }}
                placeholder="Enter exclusions..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions: Download PDF & Send Quote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quote Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              {sentAt && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>
                    Sent to {initialQuote?.sent_to_email || customerEmail} on{' '}
                    {sentAt.toLocaleDateString('en-CA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isDownloading || lineItems.length === 0}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
              </Button>

              <Button
                onClick={handleOpenSendWizard}
                disabled={lineItems.length === 0 || !customerEmail}
                className="bg-[#D32F2F] hover:bg-[#B71C1C]"
              >
                <Send className="h-4 w-4 mr-2" />
                {sentAt ? 'Resend Quote' : 'Send Quote'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Quote Wizard with Email Preview */}
      <QuoteSendWizard
        open={showSendWizard}
        onOpenChange={setShowSendWizard}
        leadId={leadId}
        customerName={customerName || 'Customer'}
        customerEmail={customerEmail || ''}
        projectType={projectType}
        quoteTotal={total}
        depositRequired={depositRequired}
        lineItemCount={lineItems.length}
        goalsText={goalsText}
        sentAt={sentAt}
        onSendComplete={handleSendComplete}
      />
    </div>
  );
}
