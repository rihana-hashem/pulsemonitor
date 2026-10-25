import { isAxiosError } from 'axios'

/** RFC 7807 body returned by the API (GlobalExceptionHandler and FastEndpoints validation). */
type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  traceId?: string
  // FastEndpoints: [{ name, reason }]. ASP.NET Core default: { field: [messages] }.
  errors?: { name: string; reason: string }[] | Record<string, string[]>
}

/**
 * The single error type every API call rejects with, so components never deal
 * with axios internals.
 */
export class ApiError extends Error {
  /** HTTP status, or null when no response arrived (network failure, timeout, CORS). */
  readonly status: number | null
  readonly title: string
  /** Validation messages keyed by the request field name, e.g. { serverName: ['...'] }. */
  readonly fieldErrors: Record<string, string[]>
  /** Correlates with the API's logs. */
  readonly traceId?: string

  constructor(options: {
    status: number | null
    title: string
    detail?: string
    fieldErrors?: Record<string, string[]>
    traceId?: string
    cause?: unknown
  }) {
    super(options.detail ?? options.title, { cause: options.cause })
    this.name = 'ApiError'
    this.status = options.status
    this.title = options.title
    this.fieldErrors = options.fieldErrors ?? {}
    this.traceId = options.traceId
  }

  get isNetworkError() {
    return this.status === null
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function toFieldErrors(errors: ProblemDetails['errors']): Record<string, string[]> {
  if (!errors) return {}

  if (Array.isArray(errors)) {
    const result: Record<string, string[]> = {}
    for (const { name, reason } of errors) {
      ;(result[name] ??= []).push(reason)
    }
    return result
  }

  return errors
}

/** Converts whatever axios threw into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (isAxiosError<ProblemDetails>(error)) {
    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      return new ApiError({
        status: null,
        title: timedOut ? 'The server took too long to respond' : 'Cannot reach the server',
        cause: error,
      })
    }

    const { status, data } = error.response
    // A proxy or gateway may answer with HTML or plain text instead of ProblemDetails.
    const problem: ProblemDetails = typeof data === 'object' && data !== null ? data : {}

    // 502/503/504 without a ProblemDetails body come from a proxy: the API itself is down.
    const gatewayError = !problem.title && (status === 502 || status === 503 || status === 504)

    return new ApiError({
      status,
      title: gatewayError
        ? 'The server is unavailable. Please try again shortly.'
        : (problem.title ?? error.response.statusText ?? `Request failed (${status})`),
      detail: problem.detail,
      fieldErrors: toFieldErrors(problem.errors),
      traceId: problem.traceId,
      cause: error,
    })
  }

  return new ApiError({
    status: null,
    title: 'Unexpected error',
    detail: error instanceof Error ? error.message : undefined,
    cause: error,
  })
}
