import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(72),
});

export const transactionSchema = z.object({
  title: z.string().trim().min(1).max(100),
  amount: z.coerce.number().finite().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1).max(50),
  date: z.coerce.date().optional(),
});

export const transactionUpdateSchema = transactionSchema.partial();