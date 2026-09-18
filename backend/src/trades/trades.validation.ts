import { z } from "zod";

export const createTradeSchema = z.object({
  symbol: z.string().trim().min(1, "symbol is required").toUpperCase(),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive("quantity must be positive"),
  price: z.number().positive("price must be positive"),
  trader: z.string().trim().min(1, "trader is required"),
  book: z.string().trim().min(1).optional(),
  counterparty: z.string().trim().min(1).optional(),
  tradeDate: z.string().datetime({ offset: true }).optional(),
});

export const amendTradeSchema = createTradeSchema.partial();

export type CreateTradeBody = z.infer<typeof createTradeSchema>;
export type AmendTradeBody = z.infer<typeof amendTradeSchema>;
