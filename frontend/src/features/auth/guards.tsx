import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { PageLoader } from '../../components/PageLoader'
import ForbiddenPage from '../../pages/ForbiddenPage'
import { hasRole, useAuth } from './authStore'
import { loginUrl, safeReturnTo } from './returnTo'
import type { Role } from './types'

type GuardProps = {
  /** Content to protect; defaults to the nested routes. */
  children?: ReactNode
}

/** Signed-in users only; others go to the login page and come back afterwards. */
export function RequireAuth({ children }: GuardProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageLoader />
  if (status === 'anonymous') {
    return <Navigate to={loginUrl(location.pathname + location.search)} replace />
  }
  return children ?? <Outlet />
}

/** Users with `role` only; other signed-in users see a 403 page. Use inside RequireAuth. */
export function RequireRole({ role, children }: GuardProps & { role: Role }) {
  const { user } = useAuth()
  if (!hasRole(user, role)) return <ForbiddenPage />
  return children ?? <Outlet />
}

/** Login/register pages: already signed-in users are sent on to where they were going. */
export function GuestOnly({ children }: GuardProps) {
  const { status } = useAuth()
  const [searchParams] = useSearchParams()

  if (status === 'loading') return <PageLoader />
  if (status === 'authenticated') {
    return <Navigate to={safeReturnTo(searchParams.get('returnTo'))} replace />
  }
  return children ?? <Outlet />
}
