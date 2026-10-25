import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isApiError } from '../../api/ApiError'
import { serverFormSchema, type ServerFormValues } from './serverFormSchema'
import type { Server } from './types'

/**
 * The form reads `server` only when it mounts, so give the dialog a new `key` each
 * time it is opened to start from fresh values.
 */
type ServerFormDialogProps = {
  open: boolean
  /** The server being edited; omit to add a new one. */
  server?: Server
  /** Saves the values. Reject with an ApiError to show the API's validation messages. */
  onSubmit: (values: ServerFormValues) => Promise<void>
  onClose: () => void
}

const emptyValues: ServerFormValues = {
  serverName: '',
  ipAddress: '',
  description: '',
  isActive: true,
}

const fieldNames = Object.keys(emptyValues) as (keyof ServerFormValues)[]

function toFormValues(server: Server): ServerFormValues {
  return {
    serverName: server.serverName,
    ipAddress: server.ipAddress,
    description: server.description ?? '',
    isActive: server.isActive,
  }
}

export function ServerFormDialog({ open, server, onSubmit, onClose }: ServerFormDialogProps) {
  const isEdit = server !== undefined
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: server ? toFormValues(server) : emptyValues,
  })

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      if (!isApiError(error)) throw error

      if (error.status === 409) {
        setError('serverName', { message: error.message }, { shouldFocus: true })
        return
      }

      // Show the API's field messages next to the matching inputs.
      let mapped = false
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        if (fieldNames.includes(field as keyof ServerFormValues)) {
          setError(field as keyof ServerFormValues, { message: messages.join(' ') })
          mapped = true
        }
      }
      if (!mapped) setFormError(error.message)
    }
  })

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      {/* noValidate: zod shows the messages, not the browser's built-in bubbles. */}
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle>{isEdit ? `Edit ${server.serverName}` : 'Add server'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Name"
              required
              autoFocus
              fullWidth
              {...register('serverName')}
              error={!!errors.serverName}
              helperText={errors.serverName?.message ?? 'Unique name, e.g. APP-SERVER-02'}
            />
            <TextField
              label="IP address"
              required
              fullWidth
              {...register('ipAddress')}
              error={!!errors.ipAddress}
              helperText={errors.ipAddress?.message ?? 'IPv4 or IPv6'}
              slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'off' } }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            {isEdit && (
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div>
                    <FormControlLabel
                      control={
                        <Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      }
                      label="Monitoring enabled"
                    />
                    <FormHelperText sx={{ mt: 0 }}>
                      Turn off to pause metric collection without deleting the server.
                    </FormHelperText>
                  </div>
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add server'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
