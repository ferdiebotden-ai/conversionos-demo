'use client';

/**
 * Visualization Metrics Widget
 * Dashboard widget showing AI visualizer performance metrics
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Image,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface VisualizationMetrics {
  total_visualizations: number;
  avg_generation_time_ms: number;
  avg_validation_score: number | null;
  retry_rate: number;
  quote_conversion_rate: number;
  admin_selection_rate: number;
  conversation_mode_rate: number;
  total_cost_usd: number;
  avg_cost_per_visualization: number;
}

interface VisualizationMetricsWidgetProps {
  className?: string;
}

export function VisualizationMetricsWidget({
  className,
}: VisualizationMetricsWidgetProps) {
  const [metrics, setMetrics] = useState<VisualizationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/visualizations/metrics?days=30');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data.summary);
      } catch (err) {
        console.error('Error fetching visualization metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            AI Visualizer Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            AI Visualizer Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm">No metrics available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          AI Visualizer Metrics
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Last 30 days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Total Visualizations */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Image className="w-4 h-4" />
              Total Generated
            </div>
            <div className="text-2xl font-bold">
              {metrics.total_visualizations.toLocaleString()}
            </div>
          </div>

          {/* Average Generation Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Avg Gen Time
            </div>
            <div className="text-2xl font-bold">
              {formatTime(metrics.avg_generation_time_ms)}
            </div>
          </div>

          {/* Quote Conversion */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              Quote Conversion
            </div>
            <div className="text-2xl font-bold">
              {metrics.quote_conversion_rate.toFixed(1)}%
            </div>
          </div>

          {/* Admin Selection Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              Admin Selected
            </div>
            <div className="text-2xl font-bold">
              {metrics.admin_selection_rate.toFixed(1)}%
            </div>
          </div>

          {/* Conversation Mode Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              Chat Mode
            </div>
            <div className="text-2xl font-bold">
              {metrics.conversation_mode_rate.toFixed(1)}%
            </div>
          </div>

          {/* Total Cost */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              Total Cost
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.total_cost_usd)}
            </div>
          </div>
        </div>

        {/* Validation Score Bar */}
        {metrics.avg_validation_score !== null && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Structure Preservation</span>
              <span className="font-medium">
                {Math.round(metrics.avg_validation_score * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  metrics.avg_validation_score >= 0.85
                    ? 'bg-green-500'
                    : metrics.avg_validation_score >= 0.7
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${metrics.avg_validation_score * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Cost per visualization */}
        <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
          Average cost per visualization:{' '}
          <span className="font-medium text-foreground">
            {formatCurrency(metrics.avg_cost_per_visualization)}
          </span>
          {' '}| Retry rate:{' '}
          <span className="font-medium text-foreground">
            {metrics.retry_rate.toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
