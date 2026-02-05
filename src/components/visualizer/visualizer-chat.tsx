'use client';

/**
 * Visualizer Chat Component
 * Conversational design intent gathering for enhanced AI visualizations
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import type { DesignStyle, RoomType } from '@/lib/schemas/visualization';
import type { RoomAnalysis } from '@/lib/ai/photo-analyzer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedData {
  desiredChanges: string[];
  constraintsToPreserve: string[];
  stylePreference?: DesignStyle;
  materialPreferences: string[];
  roomType?: RoomType;
  confidenceScore: number;
}

interface VisualizerChatProps {
  imageBase64: string;
  onGenerate: (config: {
    roomType: RoomType;
    style: DesignStyle;
    constraints?: string;
    photoAnalysis?: RoomAnalysis;
    designIntent?: {
      desiredChanges: string[];
      constraintsToPreserve: string[];
      materialPreferences?: string[];
    };
  }) => void | Promise<void>;
  onBack: () => void;
  className?: string;
}

export function VisualizerChat({
  imageBase64,
  onGenerate,
  onBack,
  className,
}: VisualizerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [photoAnalysis, setPhotoAnalysis] = useState<RoomAnalysis | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    desiredChanges: [],
    constraintsToPreserve: [],
    materialPreferences: [],
    confidenceScore: 0,
  });
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation with photo analysis
  useEffect(() => {
    const initializeConversation = async () => {
      setIsAnalyzing(true);

      try {
        const response = await fetch('/api/ai/visualizer-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'analyze',
            imageBase64,
            isInitial: true,
          }),
        });

        if (!response.ok) throw new Error('Failed to analyze photo');

        const data = await response.json();

        if (data.photoAnalysis) {
          setPhotoAnalysis(data.photoAnalysis);
          setExtractedData((prev) => ({
            ...prev,
            roomType: data.photoAnalysis.roomType,
            constraintsToPreserve: data.photoAnalysis.preservationConstraints || [],
          }));
        }

        if (data.message) {
          setMessages([
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: data.message,
            },
          ]);
        }
      } catch (error) {
        console.error('Photo analysis failed:', error);
        // Add fallback message
        setMessages([
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              "I've received your photo! What kind of changes would you like to see in this space? Tell me about your dream renovation - the style you love, specific materials you want, or anything you'd like to keep or change.",
          },
        ]);
      } finally {
        setIsAnalyzing(false);
      }
    };

    initializeConversation();
  }, [imageBase64]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  // Focus input after analysis
  useEffect(() => {
    if (!isAnalyzing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAnalyzing]);

  // Check readiness when extracted data changes
  useEffect(() => {
    const hasStyle = !!extractedData.stylePreference;
    const hasChanges = extractedData.desiredChanges.length > 0;
    const hasEnoughTurns = messages.filter((m) => m.role === 'user').length >= 2;

    setIsReady(hasStyle && (hasChanges || hasEnoughTurns));
  }, [extractedData, messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build context for API
      const context = {
        state: 'intent_gathering',
        extractedData,
        conversationHistory: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
        })),
        turnCount: messages.filter((m) => m.role === 'user').length,
        photoAnalysis,
      };

      const response = await fetch('/api/ai/visualizer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      // Parse streamed response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantContent = '';
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
      };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        // Parse SSE data chunks
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Text chunk format: 0:"text content"
            const textMatch = line.match(/^0:"(.*)"/);
            if (textMatch?.[1]) {
              assistantContent += textMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"');
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          }
        }
      }

      // Parse context from headers
      const contextHeader = response.headers.get('X-Conversation-Context');
      if (contextHeader) {
        try {
          const newContext = JSON.parse(decodeURIComponent(contextHeader));
          if (newContext.extractedData) {
            setExtractedData((prev) => ({
              ...prev,
              ...newContext.extractedData,
              // Merge arrays instead of replacing
              desiredChanges: [
                ...new Set([
                  ...prev.desiredChanges,
                  ...(newContext.extractedData.desiredChanges || []),
                ]),
              ],
              constraintsToPreserve: [
                ...new Set([
                  ...prev.constraintsToPreserve,
                  ...(newContext.extractedData.constraintsToPreserve || []),
                ]),
              ],
              materialPreferences: [
                ...new Set([
                  ...prev.materialPreferences,
                  ...(newContext.extractedData.materialPreferences || []),
                ]),
              ],
            }));
          }
        } catch {
          // Ignore parse errors
        }
      }

      // Check readiness header
      const readyHeader = response.headers.get('X-Generation-Ready');
      if (readyHeader === 'true') {
        setIsReady(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            "I'm having trouble right now. Could you tell me more about what style you're looking for? (modern, traditional, farmhouse, industrial, minimalist, or contemporary)",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, extractedData, photoAnalysis]);

  const handleGenerate = () => {
    // Determine best style
    const style: DesignStyle = extractedData.stylePreference || 'modern';
    const roomType: RoomType = extractedData.roomType || photoAnalysis?.roomType as RoomType || 'kitchen';

    // Build constraints text from extracted data
    const constraintParts: string[] = [];
    if (extractedData.desiredChanges.length > 0) {
      constraintParts.push(`Changes: ${extractedData.desiredChanges.join(', ')}`);
    }
    if (extractedData.constraintsToPreserve.length > 0) {
      constraintParts.push(`Preserve: ${extractedData.constraintsToPreserve.join(', ')}`);
    }
    if (extractedData.materialPreferences.length > 0) {
      constraintParts.push(`Materials: ${extractedData.materialPreferences.join(', ')}`);
    }

    // Build config with proper handling for exactOptionalPropertyTypes
    const generateConfig: Parameters<typeof onGenerate>[0] = {
      roomType,
      style,
      designIntent: {
        desiredChanges: extractedData.desiredChanges,
        constraintsToPreserve: extractedData.constraintsToPreserve,
        ...(extractedData.materialPreferences.length > 0 && {
          materialPreferences: extractedData.materialPreferences,
        }),
      },
    };
    // Only add optional properties if they have values
    if (constraintParts.length > 0) {
      generateConfig.constraints = constraintParts.join('. ');
    }
    if (photoAnalysis) {
      generateConfig.photoAnalysis = photoAnalysis;
    }
    onGenerate(generateConfig);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Style buttons for quick selection
  const styleOptions: { value: DesignStyle; label: string }[] = [
    { value: 'modern', label: 'Modern' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'farmhouse', label: 'Farmhouse' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'contemporary', label: 'Contemporary' },
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h2 className="font-semibold">Design Consultation</h2>
            <p className="text-xs text-muted-foreground">
              Tell us about your dream space
            </p>
          </div>
        </div>

        {/* Readiness indicator */}
        {isReady && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            Ready to generate
          </div>
        )}
      </div>

      {/* Photo thumbnail */}
      <div className="p-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
            <img
              src={imageBase64}
              alt="Your room"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            {photoAnalysis ? (
              <div className="text-sm">
                <span className="font-medium capitalize">
                  {photoAnalysis.roomType.replace('_', ' ')}
                </span>
                <span className="text-muted-foreground"> • </span>
                <span className="text-muted-foreground capitalize">
                  {photoAnalysis.layoutType}
                </span>
              </div>
            ) : isAnalyzing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyzing your space...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Your room</div>
            )}
          </div>
        </div>
      </div>

      {/* Extracted data summary */}
      {(extractedData.stylePreference ||
        extractedData.desiredChanges.length > 0) && (
        <div className="p-3 bg-primary/5 border-b border-border">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              {extractedData.stylePreference && (
                <div>
                  <span className="text-muted-foreground">Style:</span>{' '}
                  <span className="font-medium capitalize">
                    {extractedData.stylePreference}
                  </span>
                </div>
              )}
              {extractedData.desiredChanges.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Changes:</span>{' '}
                  {extractedData.desiredChanges.slice(0, 3).join(', ')}
                  {extractedData.desiredChanges.length > 3 && '...'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick style selection (show if no style selected yet) */}
      {!extractedData.stylePreference &&
        !isAnalyzing &&
        messages.length > 0 && (
          <div className="p-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">
              Quick select a style:
            </p>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setExtractedData((prev) => ({
                      ...prev,
                      stylePreference: option.value,
                    }));
                    setInput(`I'd like a ${option.label.toLowerCase()} style`);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your ideal renovation..."
            disabled={isLoading || isAnalyzing}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isAnalyzing}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Generate button */}
        {isReady && (
          <Button
            onClick={handleGenerate}
            className="w-full mt-3 bg-primary"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate My Vision
          </Button>
        )}

        {/* Skip to generate option */}
        {!isReady && messages.length >= 2 && extractedData.stylePreference && (
          <div className="text-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              className="text-xs"
            >
              Skip chat and generate with{' '}
              <span className="capitalize ml-1">
                {extractedData.stylePreference}
              </span>{' '}
              style
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
