import Alert, { type AlertColor } from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { useCallback, useState, type ReactNode } from 'react'
import { NotificationContext } from './notificationContext'

type Notification = { id: number; message: string; severity: AlertColor }

const autoHideMs = 5_000
// Bursts (e.g. several alerts in one metrics cycle) queue up; beyond this many waiting
// messages, the oldest waiting ones are dropped.
const maxQueued = 5

let nextId = 0

/** One snackbar for the whole app; messages are shown one after another. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Notification[]>([])
  const [closing, setClosing] = useState(false)

  const notify = useCallback((message: string, severity: AlertColor = 'info') => {
    setQueue((current) => {
      const next = [...current, { id: nextId++, message, severity }]
      // Keep the message on screen (index 0) and the newest waiting ones.
      return next.length > maxQueued ? [next[0], ...next.slice(-(maxQueued - 1))] : next
    })
  }, [])

  const current = queue[0]

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        // A new key restarts the auto-hide timer for each message.
        key={current?.id}
        open={current !== undefined && !closing}
        autoHideDuration={autoHideMs}
        onClose={(_, reason) => reason !== 'clickaway' && setClosing(true)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{
          transition: {
            // Once the exit animation finishes, show the next message.
            onExited: () => {
              setQueue((q) => q.slice(1))
              setClosing(false)
            },
          },
        }}
      >
        <Alert
          severity={current?.severity ?? 'info'}
          variant="filled"
          onClose={() => setClosing(true)}
          sx={{ width: '100%' }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}
