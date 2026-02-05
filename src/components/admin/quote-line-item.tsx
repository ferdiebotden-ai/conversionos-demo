'use client';

/**
 * Quote Line Item
 * Individual editable row in the quote editor
 * Enhanced with duplicate, adjust, and visual state indicators
 * [DEV-054]
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2, Sparkles, Copy, GripVertical, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LineItem {
  id: string;
  description: string;
  category: 'materials' | 'labor' | 'contract' | 'permit' | 'other';
  customCategory?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  isFromAI?: boolean;
  isModified?: boolean;
  isAccepted?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'contract', label: 'Contract' },
  { value: 'permit', label: 'Permit' },
  { value: 'other', label: 'Other' },
];

interface QuoteLineItemProps {
  item: LineItem;
  onChange: (item: LineItem) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  isDraggable?: boolean;
}

export function QuoteLineItem({
  item,
  onChange,
  onDelete,
  onDuplicate,
  isDraggable = false,
}: QuoteLineItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  function handleFieldChange<K extends keyof LineItem>(
    field: K,
    value: LineItem[K]
  ) {
    const updated = { ...item, [field]: value };

    // Recalculate total when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updated.total = updated.quantity * updated.unit_price;
    }

    // Mark as modified if it was from AI
    if (item.isFromAI && !item.isModified) {
      updated.isModified = true;
    }

    onChange(updated);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  }

  // Determine the visual state
  const getItemState = () => {
    if (item.isFromAI && item.isModified) return 'modified';
    if (item.isFromAI && item.isAccepted) return 'accepted';
    if (item.isFromAI) return 'ai-suggested';
    return 'manual';
  };

  const itemState = getItemState();

  const stateStyles = {
    'ai-suggested': 'bg-purple-50/50 border-l-2 border-l-purple-400',
    'accepted': 'bg-green-50/50 border-l-2 border-l-green-400',
    'modified': 'bg-amber-50/50 border-l-2 border-l-amber-400',
    'manual': '',
  };

  return (
    <TooltipProvider>
      <tr className={cn('group transition-colors', stateStyles[itemState])}>
        {/* Drag handle (if draggable) */}
        {isDraggable && (
          <td className="p-2 w-8">
            <div className="cursor-grab opacity-0 group-hover:opacity-50 hover:opacity-100">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </td>
        )}

        {/* Description */}
        <td className="p-2">
          <div className="flex items-center gap-2">
            <Input
              value={item.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Item description"
              className="min-w-[200px]"
            />
            {/* Status badges */}
            {item.isFromAI && !item.isModified && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs bg-purple-50 text-purple-600 border-purple-200"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>AI-suggested item</TooltipContent>
              </Tooltip>
            )}
            {item.isFromAI && item.isModified && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs bg-amber-50 text-amber-600 border-amber-200"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Adjusted
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>AI item modified by admin</TooltipContent>
              </Tooltip>
            )}
            {item.isAccepted && !item.isModified && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs bg-green-50 text-green-600 border-green-200"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accepted
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Accepted from AI suggestions</TooltipContent>
              </Tooltip>
            )}
          </div>
        </td>

      {/* Category */}
      <td className="p-2">
        {item.category === 'other' ? (
          <div className="flex items-center gap-1">
            <Input
              value={item.customCategory || ''}
              onChange={(e) => handleFieldChange('customCategory', e.target.value)}
              placeholder="Category..."
              className="w-[100px]"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleFieldChange('category', 'materials')}
              title="Switch to dropdown"
            >
              ×
            </Button>
          </div>
        ) : (
          <Select
            value={item.category}
            onValueChange={(value) =>
              handleFieldChange('category', value as LineItem['category'])
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </td>

      {/* Quantity */}
      <td className="p-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.quantity}
          onChange={(e) =>
            handleFieldChange('quantity', parseFloat(e.target.value) || 0)
          }
          className="w-[80px]"
        />
      </td>

      {/* Unit */}
      <td className="p-2">
        <Input
          value={item.unit}
          onChange={(e) => handleFieldChange('unit', e.target.value)}
          placeholder="ea"
          className="w-[80px]"
        />
      </td>

      {/* Unit Price */}
      <td className="p-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unit_price}
          onChange={(e) =>
            handleFieldChange('unit_price', parseFloat(e.target.value) || 0)
          }
          className="w-[120px]"
        />
      </td>

        {/* Total (read-only) */}
        <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>

        {/* Actions */}
        <td className="p-2">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Duplicate button */}
            {onDuplicate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={onDuplicate}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicate item</TooltipContent>
              </Tooltip>
            )}

            {/* Delete button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove item</TooltipContent>
            </Tooltip>
          </div>
        </td>
      </tr>
    </TooltipProvider>
  );
}
