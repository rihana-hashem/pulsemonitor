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
import { loginSchema, type LoginValues } from '../features/auth/authSchemas'
import { signIn } from '../features/auth/session'

// Rendered inside GuestOnly: once signed in, it redirects to ?returnTo (or the dashboard).
export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userNameOrEmail: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signIn(values)
    } catch (error) {
      // 401 carries a safe message ("Invalid user name or password.", "This account is disabled.").
      setFormError(isApiError(error) ? error.message : 'Sign-in failed. Please try again.')
    }
  })

  const returnTo = searchParams.get('returnTo')
  const registerLink = returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register'

  return (
    <AuthCard title="Sign in" subtitle="Welcome back. Sign in to see your servers.">
      <Box component="form" onSubmit={submit} noValidate>
        <Stack spacing={2.5}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="User name or email"
            autoComplete="username"
            autoFocus
            fullWidth
            {...register('userNameOrEmail')}
            error={!!errors.userNameOrEmail}
            helperText={errors.userNameOrEmail?.message}
          />
          <PasswordField
            label="Password"
            autoComplete="current-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
            Sign in
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            No account yet?{' '}
            <Link component={RouterLink} to={registerLink}>
              Create one
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthCard>
  )
}
