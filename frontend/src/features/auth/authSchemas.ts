import { z } from 'zod'

export const loginSchema = z.object({
  userNameOrEmail: z.string().trim().min(1, 'Enter your user name or email.').max(256),
  password: z.string().min(1, 'Enter your password.').max(128),
})

export type LoginValues = z.infer<typeof loginSchema>

/** Mirrors the API's RegisterValidator, plus a confirmation field. */
export const registerSchema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(3, 'User name must be at least 3 characters.')
      .max(100, 'User name must be 100 characters or fewer.')
      .regex(/^[A-Za-z0-9._-]+$/, 'Use only letters, digits, dots, dashes and underscores.'),
    email: z.string().trim().max(256).pipe(z.email('Enter a valid email address.')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password must be 128 characters or fewer.')
      .refine((p) => /\p{L}/u.test(p) && /\d/.test(p), 'Password must contain a letter and a digit.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type RegisterValues = z.infer<typeof registerSchema>
