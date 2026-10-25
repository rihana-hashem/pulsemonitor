import type { AlertColor } from '@mui/material/Alert'
import { createContext, useContext } from 'react'

export type Notify = (message: string, severity?: AlertColor) => void

export const NotificationContext = createContext<Notify | null>(null)

/** Shows a short message at the bottom of the screen, e.g. notify('Server created', 'success'). */
export function useNotify(): Notify {
  const notify = useContext(NotificationContext)
  if (!notify) throw new Error('useNotify must be used inside <NotificationProvider>.')
  return notify
}
