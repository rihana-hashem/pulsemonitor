import { apiClient } from '../../api/client'
import type { AuthResponse, LoginInput, RegisterInput } from './types'

/** Requests under this prefix are never retried after a refresh (see interceptors.ts). */
export const authUrlPrefix = '/api/v1/auth/'

// The refresh-token cookie is httpOnly and scoped to /api/v1/auth, so the browser sends it
// with refresh/logout automatically; JavaScript never sees it.

export async function login(input: LoginInput) {
  const { data } = await apiClient.post<AuthResponse>(`${authUrlPrefix}login`, input)
  return data
}

export async function register(input: RegisterInput) {
  const { data } = await apiClient.post<AuthResponse>(`${authUrlPrefix}register`, input)
  return data
}

export async function refresh() {
  const { data } = await apiClient.post<AuthResponse>(`${authUrlPrefix}refresh`)
  return data
}

export async function logout() {
  await apiClient.post(`${authUrlPrefix}logout`)
}
