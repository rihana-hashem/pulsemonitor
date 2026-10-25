import { useSyncExternalStore } from 'react'
import type { AuthResponse, AuthUser, Role } from './types'

export type AuthState =
  /** The app just loaded and is trying to restore the session from the refresh cookie. */
  | { status: 'loading'; user: null; accessToken: null }
  | { status: 'authenticated'; user: AuthUser; accessToken: string }
  | { status: 'anonymous'; user: null; accessToken: null }

let state: AuthState = { status: 'loading', user: null, accessToken: null }
const listeners = new Set<() => void>()

function setState(next: AuthState) {
  state = next
  listeners.forEach((listener) => listener())
}

/**
 * Session state kept outside React so the axios interceptor can read the access token.
 * The access token lives only in memory: a page reload restores it through the refresh cookie.
 */
export const authStore = {
  getState: () => state,

  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  setSession(response: AuthResponse) {
    setState({ status: 'authenticated', user: response.user, accessToken: response.accessToken })
  },

  clearSession() {
    setState({ status: 'anonymous', user: null, accessToken: null })
  },
}

export function useAuth(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState)
}

export function hasRole(user: AuthUser | null, role: Role): boolean {
  return user?.roles.includes(role) ?? false
}

/** True when the signed-in user is an Admin. */
export function useIsAdmin(): boolean {
  return hasRole(useAuth().user, 'Admin')
}
