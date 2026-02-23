import { z } from "zod";

export const printavoOrderSchema = z.object({
  id: z.string(),
  visualId: z.string().optional(),
  orderNickname: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerEmail: z.string().optional().nullable(),
  customerCompany: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  statusColor: z.string().optional().nullable(),
  total: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  customerDueDate: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  publicUrl: z.string().optional().nullable(),
  mockupUrl: z.string().optional().nullable(),
  lineItemCount: z.number().optional(),
});

export type PrintavoOrder = z.infer<typeof printavoOrderSchema>;

export const printavoStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional().nullable(),
});

export type PrintavoStatus = z.infer<typeof printavoStatusSchema>;

export const reorderRequestSchema = z.object({
  orderId: z.string(),
  visualId: z.string().optional(),
  orderNickname: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string(),
  notes: z.string().optional(),
});

export type ReorderRequest = z.infer<typeof reorderRequestSchema>;

export const customerLookupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type CustomerLookup = z.infer<typeof customerLookupSchema>;
