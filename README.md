# AI Reno Demo

AI-native renovation lead capture and quoting platform for contractors. This is a product demonstration showcasing AI-powered renovation tools.

---

## Features

| Feature | Description |
|---------|-------------|
| **AI Quote Assistant** | Conversational chat interface that captures project details and generates instant ballpark estimates |
| **AI Design Visualizer** | Upload photos and generate photorealistic "after" renderings using Gemini 3 Pro Image |
| **Admin Dashboard** | Full lead management, quote editing, PDF generation, and email delivery |
| **Mobile-First Design** | Optimized for smartphone users (60% of renovation research starts on mobile) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 (strict mode) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL + Auth) |
| AI Services | OpenAI GPT-5.2, Gemini 3 Pro Image |
| Email | Resend |
| Testing | Vitest (unit), Playwright (E2E) |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Supabase CLI (optional): `npm install -g supabase`

### Installation

```bash
# Clone the repository
git clone https://github.com/ferdiebotden-ai/AI-Reno-App-Demo.git
cd AI-Reno-App-Demo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see Environment Variables section)

# Run development server
npm run dev
```

Visit `http://localhost:3000`

---

## Environment Variables

Create `.env.local` with these variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services (Required)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...  # For Gemini image generation

# Email (Required for quote delivery)
RESEND_API_KEY=re_...

# Optional
NEXT_PUBLIC_DEMO_MODE=true
```

---

## Development

### Available Scripts

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build with type checking
npm run lint         # ESLint check
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
```

### Project Structure

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── admin/        # Admin dashboard (protected)
│   │   ├── api/          # API routes
│   │   ├── about/
│   │   ├── contact/
│   │   ├── estimate/     # AI Quote Assistant
│   │   ├── services/     # Service pages
│   │   └── visualizer/   # AI Design Visualizer
│   ├── components/       # React components
│   │   ├── admin/        # Admin dashboard components
│   │   ├── chat/         # Chat interface
│   │   ├── ui/           # shadcn/ui components
│   │   └── visualizer/   # Visualizer components
│   ├── lib/              # Utilities and services
│   │   ├── ai/           # AI integrations (OpenAI, Gemini)
│   │   ├── auth/         # Authentication helpers
│   │   ├── db/           # Database queries
│   │   ├── email/        # Email templates
│   │   ├── pdf/          # PDF generation
│   │   └── schemas/      # Zod validation schemas
│   └── types/            # TypeScript types
├── supabase/
│   └── migrations/       # Database migrations
├── tests/
│   ├── e2e/              # Playwright E2E tests
│   └── unit/             # Vitest unit tests
└── public/               # Static assets
```

---

## Admin Access

1. Navigate to `/admin/login`
2. Sign in with admin credentials
3. Dashboard shows lead metrics and recent activity

**Setting up first admin:**
```sql
-- In Supabase SQL Editor
SELECT set_admin_role('your-email@example.com');
```

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Streaming chat with GPT-5.2 |
| `/api/ai/visualize` | POST | Generate design concepts with Gemini |
| `/api/leads` | POST | Submit new lead |
| `/api/leads/[id]` | GET/PATCH | Get/update lead |
| `/api/quotes/[leadId]` | GET/POST | Get/create quote draft |
| `/api/quotes/[leadId]/pdf` | GET | Generate PDF quote |
| `/api/quotes/[leadId]/send` | POST | Email quote to customer |
| `/api/sessions/save` | POST | Save chat session |
| `/api/sessions/[id]` | GET | Resume chat session |
| `/api/visualizations` | POST | Save visualization |

---

## License

MIT
