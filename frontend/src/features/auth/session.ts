import { isApiError } from '../../api/ApiError'
import { queryClient } from '../../api/queryClient'
import * as authApi from './authApi'
import { authStore } from './authStore'
import type { LoginInput, RegisterInput } from './types'

// Shared by every tab of this app on the same origin.
const refreshLockName = 'pulsemonitor-auth-refresh'

let refreshInFlight: Promise<boolean> | null = null

/**
 * Gets a new access token from the refresh cookie. Returns false when the session is over.
 *
 * Only one refresh runs at a time:
 * - in this tab, concurrent callers share one request;
 * - across tabs, a Web Lock makes them take turns. The API rotates the refresh token on every
 *   use and treats a reused token as stolen (ending the session), so two tabs refreshing with
 *   the same cookie at once would sign the user out. Taking turns, the second tab sends the
 *   cookie the first one just received.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= runExclusively(refreshOnce).finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

async function refreshOnce(): Promise<boolean> {
  try {
    authStore.setSession(await authApi.refresh())
    return true
  } catch (error) {
    // 401: no valid session. Anything else (API down, network): also not usable right now.
    endSession()
    if (!isApiError(error) || error.status !== 401) console.warn('Session refresh failed', error)
    return false
  }
}

function runExclusively<T>(work: () => Promise<T>): Promise<T> {
  // Web Locks are in all current browsers; without them, fall back to per-tab single-flight.
  return navigator.locks ? navigator.locks.request(refreshLockName, work) : work()
}

const tokenRefreshMarginMs = 60_000

/** Expiry of a JWT from its "exp" claim (milliseconds), or 0 if it cannot be read. */
function expiresAt(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : 0
  } catch {
    return 0
  }
}

/**
 * An access token valid for at least another minute, refreshing first if needed. For callers
 * that cannot rely on the 401-retry interceptor, e.g. a SignalR (re)connect.
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const { accessToken } = authStore.getState()
  if (accessToken && expiresAt(accessToken) - Date.now() > tokenRefreshMarginMs) return accessToken

  return (await refreshSession()) ? authStore.getState().accessToken : null
}

/** Called once at startup: restores the session from the refresh cookie, if there is one. */
export function restoreSession(): Promise<boolean> {
  return refreshSession()
}

export async function signIn(input: LoginInput) {
  startSession(await authApi.login(input))
}

export async function signUp(input: RegisterInput) {
  startSession(await authApi.register(input))
}

export async function signOut() {
  try {
    await authApi.logout()
  } finally {
    // Even if the API is unreachable, forget the session locally.
    endSession()
  }
}

function startSession(response: Awaited<ReturnType<typeof authApi.login>>) {
  // Data cached for a previous user must not be shown to this one.
  queryClient.clear()
  authStore.setSession(response)
}

function endSession() {
  authStore.clearSession()
  queryClient.clear()
}
