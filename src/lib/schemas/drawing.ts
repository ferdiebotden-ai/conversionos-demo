/**
 * Drawing Zod Schemas
 * Validation for CAD/architecture drawing management
 * [DEV-076]
 */

import { z } from 'zod';
import { DrawingDataSchema } from '@/components/cad/state/drawing-serializer';

export const DrawingCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  lead_id: z.string().uuid().optional(),
});

export const DrawingUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  drawing_data: DrawingDataSchema.optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
  permit_number: z.string().max(50).optional().nullable(),
});

export type DrawingCreateInput = z.infer<typeof DrawingCreateSchema>;
export type DrawingUpdateInput = z.infer<typeof DrawingUpdateSchema>;
