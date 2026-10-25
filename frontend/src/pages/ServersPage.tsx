import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useNotify } from '../components/notifications/notificationContext'
import { useIsAdmin } from '../features/auth/authStore'
import { useCreateServer, useDeleteServer, useServers, useUpdateServer } from '../features/servers/queries'
import { ServerFormDialog } from '../features/servers/ServerFormDialog'
import type { ServerFormValues } from '../features/servers/serverFormSchema'
import { ServersTable } from '../features/servers/ServersTable'
import type { Server, ServerSortField } from '../features/servers/types'
import { useServerListParams } from '../features/servers/useServerListParams'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

type StatusFilter = 'all' | 'active' | 'inactive'

const searchDebounceMs = 300

export default function ServersPage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const isAdmin = useIsAdmin()
  const [params, updateParams] = useServerListParams()

  // The input updates immediately; the URL (and the query) only after typing pauses.
  const [searchInput, setSearchInput] = useState(params.search ?? '')
  const debouncedSearch = useDebouncedValue(searchInput.trim(), searchDebounceMs)

  // When the URL changes from elsewhere (back button, sidebar link), show its search in the box.
  const [urlSearch, setUrlSearch] = useState(params.search)
  if (params.search !== urlSearch) {
    setUrlSearch(params.search)
    // Compare trimmed, so a trailing space the user is still typing is kept.
    if ((params.search ?? '') !== searchInput.trim()) setSearchInput(params.search ?? '')
  }

  useEffect(() => {
    // Only once typing has settled; a stale debounced value must not overwrite the URL.
    const settled = debouncedSearch === searchInput.trim()
    if (settled && debouncedSearch !== (params.search ?? '')) {
      updateParams({ search: debouncedSearch || undefined, page: 1 }, { replace: true })
    }
  }, [debouncedSearch, searchInput, params.search, updateParams])

  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useServers(params)

  // After deleting the last row of the last page, step back to the new last page.
  useEffect(() => {
    if (data && data.items.length === 0 && params.page > 1 && data.totalPages > 0) {
      updateParams({ page: data.totalPages }, { replace: true })
    }
  }, [data, params.page, updateParams])

  const [formOpen, setFormOpen] = useState(false)
  // Changes on every open so the form dialog remounts with fresh values.
  const [formKey, setFormKey] = useState(0)
  const [editing, setEditing] = useState<Server | undefined>()
  const [deleting, setDeleting] = useState<Server | null>(null)

  const createServer = useCreateServer()
  const updateServer = useUpdateServer()
  const deleteServer = useDeleteServer()

  const openForm = (server?: Server) => {
    setEditing(server)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  // Errors propagate to ServerFormDialog, which shows them on the form.
  const saveServer = async (values: ServerFormValues) => {
    const input = {
      serverName: values.serverName,
      ipAddress: values.ipAddress,
      description: values.description || null,
    }

    if (editing) {
      const saved = await updateServer.mutateAsync({
        serverId: editing.serverId,
        input: { ...input, isActive: values.isActive },
      })
      notify(`Server "${saved.serverName}" updated.`, 'success')
    } else {
      const created = await createServer.mutateAsync(input)
      notify(`Server "${created.serverName}" added.`, 'success')
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (!deleting) return
    deleteServer.mutate(deleting.serverId, {
      onSuccess: () => notify(`Server "${deleting.serverName}" deleted.`, 'success'),
      onError: (err) => notify(`Could not delete "${deleting.serverName}": ${err.message}`, 'error'),
      onSettled: () => setDeleting(null),
    })
  }

  const changeSort = (field: ServerSortField) => {
    const sameField = params.sortBy === field
    updateParams({
      sortBy: field,
      sortDirection: sameField && params.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1,
    })
  }

  const statusFilter: StatusFilter =
    params.isActive === undefined ? 'all' : params.isActive ? 'active' : 'inactive'

  const changeStatusFilter = (value: StatusFilter) =>
    updateParams({ isActive: value === 'all' ? undefined : value === 'active', page: 1 })

  const filtered = params.search !== undefined || params.isActive !== undefined

  return (
    <Box component="section">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Servers
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Servers monitored by PulseMonitor. Select a server to see its metrics.
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()} sx={{ flexShrink: 0 }}>
            Add server
          </Button>
        )}
      </Stack>

      <Paper variant="outlined">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name or IP address"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: { sm: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search servers', maxLength: 150 },
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => changeStatusFilter(e.target.value as StatusFilter)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Monitored</MenuItem>
            <MenuItem value="inactive">Paused</MenuItem>
          </TextField>
        </Stack>

        {isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress aria-label="Loading servers" />
          </Box>
        ) : error && !data ? (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            Could not load servers: {error.message}
          </Alert>
        ) : (
          <ServersTable
            servers={data.items}
            totalCount={data.totalCount}
            page={params.page}
            pageSize={params.pageSize}
            sortBy={params.sortBy}
            sortDirection={params.sortDirection}
            refreshing={isFetching && isPlaceholderData}
            emptyMessage={filtered ? 'No servers match your search.' : isAdmin ? 'No servers yet. Add one to start monitoring.' : 'No servers yet.'}
            onSortChange={changeSort}
            onPageChange={(page) => updateParams({ page })}
            onPageSizeChange={(pageSize) => updateParams({ pageSize, page: 1 })}
            onOpen={(server) => navigate(`/servers/${server.serverId}`)}
            // Managing servers is Admin-only (the API enforces it too).
            onEdit={isAdmin ? openForm : undefined}
            onDelete={isAdmin ? setDeleting : undefined}
          />
        )}
      </Paper>

      <ServerFormDialog
        key={formKey}
        open={formOpen}
        server={editing}
        onSubmit={saveServer}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete server?"
        confirmLabel="Delete"
        destructive
        busy={deleteServer.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      >
        <strong>{deleting?.serverName}</strong> will stop being monitored and disappear from the
        dashboard. Its metric and alert history is kept.
      </ConfirmDialog>
    </Box>
  )
}
