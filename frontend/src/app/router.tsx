import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { PageLoader } from '../components/PageLoader'
import { GuestOnly, RequireAuth, RequireRole } from '../features/auth/guards'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { AppLayout } from './layout/AppLayout'

// Each page is its own chunk, downloaded the first time its route is visited.
const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

export const router = createBrowserRouter([
  {
    // Sign-in pages: no app navigation, and signed-in users are sent on.
    element: <GuestOnly />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      { path: '/login', lazy: lazyPage(() => import('../pages/LoginPage')) },
      { path: '/register', lazy: lazyPage(() => import('../pages/RegisterPage')) },
    ],
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      { index: true, lazy: lazyPage(() => import('../pages/DashboardPage')) },
      { path: 'servers', lazy: lazyPage(() => import('../pages/ServersPage')) },
      { path: 'servers/:serverId', lazy: lazyPage(() => import('../pages/ServerDetailsPage')) },
      { path: 'alerts', lazy: lazyPage(() => import('../pages/AlertsPage')) },
      { path: 'reports', lazy: lazyPage(() => import('../pages/ReportsPage')) },
      { path: 'jobs', lazy: lazyPage(() => import('../pages/JobsPage')) },
      {
        path: 'users',
        element: <RequireRole role="Admin" />,
        children: [{ index: true, lazy: lazyPage(() => import('../pages/UsersPage')) }],
      },
      { path: '*', lazy: lazyPage(() => import('../pages/NotFoundPage')) },
    ],
  },
])
