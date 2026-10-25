import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { isApiError } from '../api/ApiError'
import { PasswordField } from '../components/PasswordField'
import { AuthCard } from '../features/auth/AuthCard'
import { registerSchema, type RegisterValues } from '../features/auth/authSchemas'
import { signUp } from '../features/auth/session'

const apiFields = ['userName', 'email', 'password'] as const

// Rendered inside GuestOnly: after sign-up the user is signed in and redirected.
export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { userName: '', email: '', password: '', confirmPassword: '' },
  })

  const submit = handleSubmit(async ({ userName, email, password }) => {
    setFormError(null)
    try {
      await signUp({ userName, email, password })
    } catch (error) {
      if (!isApiError(error)) throw error

      // Field-level validation messages from the API, next to the matching input.
      let mapped = false
      for (const field of apiFields) {
        const messages = error.fieldErrors[field]
        if (messages) {
          setError(field, { message: messages.join(' ') })
          mapped = true
        }
      }
      // 409 (name or email taken) and anything else.
      if (!mapped) setFormError(error.message)
    }
  })

  const returnTo = searchParams.get('returnTo')
  const loginLink = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'

  return (
    <AuthCard title="Create an account" subtitle="New accounts can view servers, metrics and alerts.">
      <Box component="form" onSubmit={submit} noValidate>
        <Stack spacing={2.5}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="User name"
            autoComplete="username"
            autoFocus
            fullWidth
            {...register('userName')}
            error={!!errors.userName}
            helperText={errors.userName?.message ?? 'Letters, digits, dots, dashes and underscores'}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message ?? 'At least 8 characters, with a letter and a digit'}
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            fullWidth
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
          <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
            Create account
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to={loginLink}>
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthCard>
  )
}
