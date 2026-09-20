import { z } from 'zod'

/** Indian mobile numbers are ten digits beginning 6-9. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number')

export const placeOrderSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(1).max(60).optional(),
  tableLabel: z.string().trim().max(12).nullish(),
  mode: z.enum(['DINE_IN', 'TAKEAWAY']),
  lines: z
    .array(
      z.object({
        menuItemSlug: z.string().min(1),
        variantKey: z.string().min(1).nullable(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Cart is empty'),
  redeemRequested: z.number().int().min(0).default(0),
})

export type PlaceOrderBody = z.infer<typeof placeOrderSchema>

export const simulatePointsSchema = z.object({
  phone: phoneSchema,
  points: z.number().int().min(1).max(5000),
})
