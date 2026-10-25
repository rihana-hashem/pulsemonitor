import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useSyncExternalStore } from 'react'
import { authStore } from '../auth/authStore'
import { getFreshAccessToken } from '../auth/session'
import type { ConnectionStatus, HubEvents } from './types'

const hubUrl = `${import.meta.env.VITE_API_BASE_URL ?? ''}/hubs/monitoring`

// 0, 2, 5, 10 seconds, then every 30 seconds, for as long as the user stays signed in.
const retryDelaysMs = [0, 2_000, 5_000, 10_000]
const maxRetryDelayMs = 30_000
const retryDelay = (attempt: number) => retryDelaysMs[attempt] ?? maxRetryDelayMs

/**
 * The app's single connection to /hubs/monitoring. It connects while a user is signed in
 * and disconnects on sign-out (see startRealtime).
 */
const connection = new HubConnectionBuilder()
  .withUrl(hubUrl, {
    // Called on every (re)connect; a token about to expire is refreshed first.
    accessTokenFactory: async () => (await getFreshAccessToken()) ?? '',
  })
  .withAutomaticReconnect({ nextRetryDelayInMilliseconds: ({ previousRetryCount }) => retryDelay(previousRetryCount) })
  .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
  .build()

// --- Connection status, for "Live" indicators -------------------------------------------

let status: ConnectionStatus = 'disconnected'
const statusListeners = new Set<() => void>()

function setStatus(next: ConnectionStatus) {
  status = next
  statusListeners.forEach((listener) => listener())
}

export function useConnectionStatus(): ConnectionStatus {
  return useSyncExternalStore(
    (listener) => {
      statusListeners.add(listener)
      return () => statusListeners.delete(listener)
    },
    () => status,
  )
}

/** Runs `callback` every time the connection is (re)established. */
const connectedCallbacks = new Set<() => void>()
export function onConnected(callback: () => void): () => void {
  connectedCallbacks.add(callback)
  return () => connectedCallbacks.delete(callback)
}

function handleConnected() {
  setStatus('connected')
  rejoinGroups()
  connectedCallbacks.forEach((callback) => callback())
}

connection.onreconnecting(() => setStatus('reconnecting'))
connection.onreconnected(handleConnected)
connection.onclose(() => setStatus('disconnected'))

// --- Server events -------------------------------------------------------------------------

/** Subscribes to a hub event; returns the unsubscribe function. */
export function onHubEvent<E extends keyof HubEvents>(event: E, handler: (payload: HubEvents[E]) => void) {
  connection.on(event, handler)
  return () => connection.off(event, handler)
}

export function invokeHub<T>(method: string, ...args: unknown[]): Promise<T> {
  return connection.invoke<T>(method, ...args)
}

// --- Groups ----------------------------------------------------------------------------------
// SignalR forgets group membership when a connection is replaced, so the wanted groups are
// kept here and re-joined after every (re)connect. Reference counts allow several components
// (and React StrictMode's double effects) to watch the same server.

const watchedServers = new Map<number, number>()
let dashboardWatchers = 0

function invokeIfConnected(method: string, ...args: unknown[]) {
  if (connection.state === HubConnectionState.Connected) {
    // A failure here is repaired by the next rejoin after reconnecting.
    connection.invoke(method, ...args).catch(() => {})
  }
}

function rejoinGroups() {
  watchedServers.forEach((_, serverId) => invokeIfConnected('WatchServer', serverId))
  if (dashboardWatchers > 0) invokeIfConnected('WatchDashboard')
}

/** Receive DashboardMetricsUpdated (all servers) until the returned function is called. */
export function watchDashboard(): () => void {
  if (dashboardWatchers++ === 0) invokeIfConnected('WatchDashboard')

  let released = false
  return () => {
    if (released) return
    released = true
    if (--dashboardWatchers === 0) invokeIfConnected('UnwatchDashboard')
  }
}

/** Receive ServerMetricsUpdated for this server until the returned function is called. */
export function watchServer(serverId: number): () => void {
  const count = watchedServers.get(serverId) ?? 0
  watchedServers.set(serverId, count + 1)
  if (count === 0) invokeIfConnected('WatchServer', serverId)

  let released = false
  return () => {
    if (released) return
    released = true
    const remaining = (watchedServers.get(serverId) ?? 1) - 1
    if (remaining > 0) {
      watchedServers.set(serverId, remaining)
    } else {
      watchedServers.delete(serverId)
      invokeIfConnected('UnwatchServer', serverId)
    }
  }
}

// --- Lifecycle -------------------------------------------------------------------------------

let wanted = false
let stopping: Promise<void> = Promise.resolve()

async function connect() {
  // Signing out and straight back in (maybe as another user): let the old connection finish
  // closing, or the loop below would see a non-Disconnected state and give up.
  await stopping

  // The automatic reconnect only covers connections that were established once; keep
  // retrying the first start (e.g. the API is down) the same way.
  for (let attempt = 0; wanted && connection.state === HubConnectionState.Disconnected; attempt++) {
    setStatus('connecting')
    try {
      await connection.start()
      handleConnected()
      return
    } catch {
      setStatus('disconnected')
      await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt + 1)))
    }
  }
}

function syncWithAuth() {
  const signedIn = authStore.getState().status === 'authenticated'

  if (signedIn && !wanted) {
    wanted = true
    void connect()
  } else if (!signedIn && wanted) {
    wanted = false
    stopping = connection.stop()
  }
}

/** Call once at startup: keeps the connection in step with the signed-in state. */
export function startRealtime() {
  authStore.subscribe(syncWithAuth)
  syncWithAuth()
}
