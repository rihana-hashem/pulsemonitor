import { useSyncExternalStore } from 'react'
import { invokeHub, onConnected, onHubEvent } from './connection'
import type { OnlineUser } from './types'

let onlineUsers: OnlineUser[] = []
const listeners = new Set<() => void>()

function setOnlineUsers(users: OnlineUser[]) {
  onlineUsers = users
  listeners.forEach((listener) => listener())
}

/** Call once at startup: keeps the online-users list current while connected. */
export function startPresence() {
  onHubEvent('PresenceChanged', setOnlineUsers)
  // PresenceChanged only fires when someone comes or goes, so ask once per (re)connect.
  onConnected(() => {
    invokeHub<OnlineUser[]>('GetOnlineUsers').then(setOnlineUsers).catch(() => {})
  })
}

/** Users connected right now (empty while this client is offline). */
export function useOnlineUsers(): OnlineUser[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => onlineUsers,
  )
}
