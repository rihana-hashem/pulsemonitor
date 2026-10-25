import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { isApiError } from '../../api/ApiError'
import { useNotify } from '../../components/notifications/notificationContext'
import { useServers } from '../servers/queries'
import { useRequestReport } from './queries'
import { reportFormSchema, toLocalInput, toRange, type ReportFormValues, type ReportPeriod } from './reportFormSchema'

const periods: { value: ReportPeriod; label: string; ariaLabel: string }[] = [
  { value: '24h', label: '24h', ariaLabel: 'Last 24 hours' },
  { value: '7d', label: '7d', ariaLabel: 'Last 7 days' },
  { value: '30d', label: '30d', ariaLabel: 'Last 30 days' },
  { value: 'custom', label: 'Custom', ariaLabel: 'Custom period' },
]

// The server list shows at most this many servers (the API's page-size limit).
const serverOptionsLimit = 100

const fieldNames: (keyof ReportFormValues)[] = ['serverId', 'from', 'to']

function defaultValues(): ReportFormValues {
  const now = new Date()
  return {
    serverId: '',
    period: '24h',
    from: toLocalInput(new Date(now.getTime() - 24 * 60 * 60_000)),
    to: toLocalInput(now),
  }
}

export function RequestReportForm() {
  const notify = useNotify()
  const requestReport = useRequestReport()
  const servers = useServers({ sortBy: 'name', sortDirection: 'asc', page: 1, pageSize: serverOptionsLimit })
  const [formError, setFormError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: defaultValues(),
  })
  const custom = useWatch({ control, name: 'period' }) === 'custom'

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const report = await requestReport.mutateAsync({ serverId: Number(values.serverId), ...toRange(values) })
      notify(`Report #${report.reportId} requested. You will be notified when it is ready.`, 'info')
    } catch (error) {
      if (!isApiError(error)) throw error

      // The server was deleted after the list loaded.
      if (error.status === 404) {
        setError('serverId', { message: error.message })
        return
      }

      // Show the API's field messages next to the matching inputs.
      let mapped = false
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        if (fieldNames.includes(field as keyof ReportFormValues)) {
          setError(field as keyof ReportFormValues, { message: messages.join(' ') })
          mapped = true
        }
      }
      if (!mapped) setFormError(error.message)
    }
  })

  return (
    // noValidate: zod shows the messages, not the browser's built-in bubbles.
    <Box component="form" onSubmit={submit} noValidate sx={{ p: 2 }}>
      {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-start' } }}>
        <Controller
          name="serverId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              size="small"
              label="Server"
              required
              error={!!errors.serverId}
              helperText={errors.serverId?.message}
              sx={{ minWidth: 220 }}
            >
              {/* MUI requires children, also while the servers are loading. */}
              {servers.data?.items.map((server) => (
                <MenuItem key={server.serverId} value={String(server.serverId)}>
                  {server.serverName}
                </MenuItem>
              )) ?? []}
            </TextField>
          )}
        />
        <Controller
          name="period"
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={field.value}
              onChange={(_, value: ReportPeriod | null) => value && field.onChange(value)}
              aria-label="Period"
              sx={{ height: 40 }}
            >
              {periods.map((p) => (
                <ToggleButton key={p.value} value={p.value} aria-label={p.ariaLabel}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        />
        {custom && (
          <>
            <TextField
              type="datetime-local"
              size="small"
              label="From"
              {...register('from')}
              error={!!errors.from}
              helperText={errors.from?.message}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="datetime-local"
              size="small"
              label="To"
              {...register('to')}
              error={!!errors.to}
              helperText={errors.to?.message}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </>
        )}
        <Button type="submit" variant="contained" loading={isSubmitting} sx={{ height: 40, whiteSpace: 'nowrap' }}>
          Generate report
        </Button>
      </Stack>
    </Box>
  )
}
