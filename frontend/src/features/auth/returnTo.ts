/**
 * Where to go after signing in. Only same-site paths are accepted, so a crafted link like
 * /login?returnTo=https://evil.example cannot redirect users off the site.
 */
export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}

/** Builds the login URL that brings the user back to `path` afterwards. */
export function loginUrl(path: string): string {
  return path === '/' ? '/login' : `/login?returnTo=${encodeURIComponent(path)}`
}
