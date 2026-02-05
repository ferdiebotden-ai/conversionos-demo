/**
 * Shared TypeScript types for Lead-to-Quote Engine v2
 */

// Database types - regenerate from Supabase after schema changes:
// npx supabase gen types typescript --project-id bwvrtypzcvuojfsyiwch > src/types/database.ts
export type {
  Database,
  Json,
  // Lead types
  Lead,
  LeadInsert,
  LeadUpdate,
  LeadStatus,
  ProjectType,
  Timeline,
  BudgetBand,
  FinishLevel,
  // Quote types
  QuoteDraft,
  QuoteDraftInsert,
  QuoteDraftUpdate,
  QuoteLineItem,
  // Chat session types
  ChatSession,
  ChatSessionInsert,
  ChatSessionUpdate,
  ChatSessionState,
  // Audit log types
  AuditLog,
  AuditLogInsert,
} from './database';
