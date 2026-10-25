import axios from 'axios'
import { toApiError } from './ApiError'

/**
 * Shared HTTP client. Paths are relative to the API origin, e.g. '/api/v1/servers'.
 * In development the Vite proxy forwards them to the .NET API.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

// Every failure leaves this client as an ApiError (see ApiError.ts).
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
