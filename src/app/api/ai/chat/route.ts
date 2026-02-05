import { streamText, type UserModelMessage, type AssistantModelMessage } from 'ai';
import { openai } from '@/lib/ai/providers';
import { AI_CONFIG } from '@/lib/ai/config';
import { QUOTE_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const runtime = 'edge';

interface MessagePart {
  type: 'text' | 'image';
  text?: string;
  image?: string;
}

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: MessagePart[];
  data?: { images?: string[] };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Helper to extract text content from message (handles both old and new formats)
    const getMessageContent = (msg: IncomingMessage): string => {
      // New format: parts array
      if (msg.parts && msg.parts.length > 0) {
        return msg.parts
          .filter((part): part is MessagePart & { text: string } => part.type === 'text' && !!part.text)
          .map(part => part.text)
          .join('');
      }
      // Old format: content string
      return msg.content || '';
    };

    // Helper to extract images from message parts
    const getMessageImages = (msg: IncomingMessage): string[] => {
      if (msg.parts) {
        return msg.parts
          .filter((part): part is MessagePart & { image: string } => part.type === 'image' && !!part.image)
          .map(part => part.image);
      }
      return msg.data?.images || [];
    };

    // Convert messages to the format expected by the AI SDK
    const formattedMessages: Array<UserModelMessage | AssistantModelMessage> = messages
      .filter((msg: IncomingMessage) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: IncomingMessage) => {
        const content = getMessageContent(msg);
        const images = getMessageImages(msg);

        // Handle user messages with images
        if (msg.role === 'user' && images.length > 0) {
          return {
            role: 'user' as const,
            content: [
              { type: 'text' as const, text: content },
              ...images.map((img: string) => ({
                type: 'image' as const,
                image: img,
              })),
            ],
          };
        }

        // Handle user messages without images
        if (msg.role === 'user') {
          return {
            role: 'user' as const,
            content: content,
          };
        }

        // Handle assistant messages
        return {
          role: 'assistant' as const,
          content: content,
        };
      });

    const result = streamText({
      model: openai(AI_CONFIG.openai.chat),
      system: QUOTE_ASSISTANT_SYSTEM_PROMPT,
      messages: formattedMessages,
      maxOutputTokens: AI_CONFIG.parameters.chat.maxTokens,
      temperature: AI_CONFIG.parameters.chat.temperature,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
