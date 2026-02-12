/**
 * Invoice & Payment Zod Schemas
 * Validation for invoice creation, payment recording, and Sage export
 * [DEV-076]
 */

import { z } from 'zod';

export const InvoiceCreateSchema = z.object({
  lead_id: z.string().uuid(),
  quote_draft_id: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  due_date: z.string().date().optional(),
});

export const InvoiceUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().max(2000).optional().nullable(),
  internal_notes: z.string().max(2000).optional().nullable(),
  due_date: z.string().date().optional(),
});

export const PaymentRecordSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'cheque', 'etransfer', 'credit_card']),
  payment_date: z.string().date().optional(),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const SageExportSchema = z.object({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  status: z.enum(['all', 'sent', 'partially_paid', 'paid']).default('all'),
});

export const InvoiceSendSchema = z.object({
  to_email: z.string().email(),
  custom_message: z.string().max(1000).optional(),
});

export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;
export type InvoiceUpdateInput = z.infer<typeof InvoiceUpdateSchema>;
export type PaymentRecordInput = z.infer<typeof PaymentRecordSchema>;
export type SageExportInput = z.infer<typeof SageExportSchema>;
export type InvoiceSendInput = z.infer<typeof InvoiceSendSchema>;
