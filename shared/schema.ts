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

export const sizeQuantitySchema = z.object({
  size: z.string(),
  qty: z.number().min(0),
});

export type SizeQuantity = z.infer<typeof sizeQuantitySchema>;

export const reorderRequestSchema = z.object({
  orderId: z.string(),
  visualId: z.string().optional(),
  orderNickname: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string(),
  notes: z.string().optional(),
  sizes: z.array(sizeQuantitySchema).optional(),
});

export type ReorderRequest = z.infer<typeof reorderRequestSchema>;

export const SIZE_CATEGORIES = {
  unisex: {
    label: "Unisex",
    sizes: ["Unisex XS", "Unisex S", "Unisex M", "Unisex L", "Unisex XL", "Unisex XXL"],
  },
  youth: {
    label: "Youth",
    sizes: ["Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"],
  },
  ladies: {
    label: "Ladies",
    sizes: ["Ladies XS", "Ladies S", "Ladies M", "Ladies L", "Ladies XL", "Ladies XXL"],
  },
  other: {
    label: "Caps/Bags/Etc",
    sizes: ["Adult XXL", "One Size"],
  },
} as const;

export const customerLookupSchema = z.object({
  searchType: z.enum(["email", "company"]),
  searchValue: z.string().min(1, "Please enter a search value"),
}).refine((data) => {
  if (data.searchType === "email") {
    return z.string().email().safeParse(data.searchValue).success;
  }
  return data.searchValue.trim().length >= 2;
}, {
  message: "Please enter a valid email address or company name (at least 2 characters)",
  path: ["searchValue"],
});

export type CustomerLookup = z.infer<typeof customerLookupSchema>;
