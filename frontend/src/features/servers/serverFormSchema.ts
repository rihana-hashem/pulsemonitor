import { z } from 'zod'

const ipAddress = z.union([z.ipv4(), z.ipv6()])

/**
 * Client-side copy of the API's ServerFieldsValidator rules (lengths match the
 * dbo.Servers columns). The API remains the authority; its errors are shown too.
 */
export const serverFormSchema = z.object({
  serverName: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(150, 'Name must be 150 characters or fewer.'),
  ipAddress: z
    .string()
    .trim()
    .min(1, 'IP address is required.')
    .max(45, 'IP address must be 45 characters or fewer.')
    .refine((value) => ipAddress.safeParse(value).success, {
      message: 'Enter a valid IPv4 (e.g. 192.0.2.10) or IPv6 address.',
    }),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer.'),
  isActive: z.boolean(),
})

export type ServerFormValues = z.infer<typeof serverFormSchema>
