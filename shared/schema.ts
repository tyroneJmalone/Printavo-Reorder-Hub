import { z } from "zod";

export const lineItemSizeSchema = z.object({
  size: z.string(),
  count: z.number().nullable(),
});

export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  itemNumber: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  totalQty: z.number().optional(),
  sizes: z.array(lineItemSizeSchema).optional(),
  mockupUrl: z.string().optional().nullable(),
});

export type LineItem = z.infer<typeof lineItemSchema>;

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
  orderTotalQty: z.number().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export type PrintavoOrder = z.infer<typeof printavoOrderSchema>;

export const printavoStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional().nullable(),
});

export type PrintavoStatus = z.infer<typeof printavoStatusSchema>;

export const lineItemReorderSchema = z.object({
  lineItemId: z.string(),
  productName: z.string().optional(),
  color: z.string().optional(),
  itemNumber: z.string().optional(),
  sizes: z.array(z.object({
    size: z.string(),
    qty: z.number().min(0),
  })),
});

export type LineItemReorder = z.infer<typeof lineItemReorderSchema>;

export const reorderRequestSchema = z.object({
  orderId: z.string(),
  visualId: z.string().optional(),
  orderNickname: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string(),
  notes: z.string().optional(),
  lineItemOrders: z.array(lineItemReorderSchema).optional(),
});

export type ReorderRequest = z.infer<typeof reorderRequestSchema>;

export const SIZE_LABEL_MAP: Record<string, string> = {
  size_yxs: "Youth XS",
  size_ys: "Youth S",
  size_ym: "Youth M",
  size_yl: "Youth L",
  size_yxl: "Youth XL",
  size_xs: "XS",
  size_s: "S",
  size_m: "M",
  size_l: "L",
  size_xl: "XL",
  size_2xl: "2XL",
  size_3xl: "3XL",
  size_4xl: "4XL",
  size_5xl: "5XL",
  size_6xl: "6XL",
  size_other: "Other",
  size_6m: "6M",
  size_12m: "12M",
  size_18m: "18M",
  size_24m: "24M",
  size_2t: "2T",
  size_3t: "3T",
  size_4t: "4T",
  size_5t: "5T",
};

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
