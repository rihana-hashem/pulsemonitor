import { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { isApiError } from '../../api/ApiError'
import { apiClient } from '../../api/client'
import { authUrlPrefix } from './authApi'
import { authStore } from './authStore'
import { refreshSession } from './session'

type RetriableConfig = InternalAxiosRequestConfig & { _authRetried?: boolean }

/**
 * Adds the access token to every request and, when the API answers 401 (token expired),
 * refreshes the session once and retries the request.
 */
export function installAuthInterceptors() {
  apiClient.interceptors.request.use((config) => {
    const { accessToken } = authStore.getState()
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    return config
  })

  // Runs after client.ts's interceptor, so failures arrive here as ApiError.
  apiClient.interceptors.response.use(undefined, async (error: unknown) => {
    const original = isApiError(error) && isAxiosError(error.cause)
      ? (error.cause.config as RetriableConfig | undefined)
      : undefined

    const shouldRefresh =
      isApiError(error) &&
      error.status === 401 &&
      original !== undefined &&
      !original._authRetried &&
      // A 401 from login/refresh means bad credentials or no session; refreshing won't help.
      !original.url?.startsWith(authUrlPrefix)

    if (!shouldRefresh) throw error

    original._authRetried = true
    if (!(await refreshSession())) throw error

    // The request interceptor adds the new token.
    return apiClient.request(original)
  })
}
