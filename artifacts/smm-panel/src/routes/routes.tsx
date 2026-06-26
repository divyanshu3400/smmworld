import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { PublicRoute } from './PublicRoute'
import { ProtectedRoute } from './ProtectedRoute'
import PublicLayout from '@/components/layouts/PublicLayout'
import AuthLayout from '@/components/layouts/AuthLayout'
import DashboardLayout from '@/components/layouts/DashboardLayout'

// Public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage'))
const ApiDocsPage = lazy(() => import('@/pages/public/ApiDocsPage'))

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const AuthCallbackPage = lazy(() => import('@/pages/auth/AuthCallbackPage'))

// Dashboard pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const WalletPage = lazy(() => import('@/pages/wallet/WalletPage'))
const OrdersPage = lazy(() => import('@/pages/orders/OrdersPage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))
const ReferralPage = lazy(() => import('@/pages/referral/ReferralPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))

// Admin pages
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminAnnouncementsPage = lazy(() => import('@/pages/admin/AdminAnnouncementsPage'))

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

const withSuspense = (Component: React.LazyExoticComponent<() => React.JSX.Element | null>) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: withSuspense(HomePage) },
      { path: 'services', element: withSuspense(ServicesPage) },
      { path: 'api-docs', element: withSuspense(ApiDocsPage) },
    ],
  },
  { path: 'auth/callback', element: withSuspense(AuthCallbackPage) },
  { path: 'app', element: <Navigate to="/dashboard" replace /> },
  {
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: 'login', element: withSuspense(LoginPage) },
      { path: 'signup', element: withSuspense(SignupPage) },
      { path: 'forgot-password', element: withSuspense(ForgotPasswordPage) },
      { path: 'reset-password', element: withSuspense(ResetPasswordPage) },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: withSuspense(DashboardPage) },
      { path: 'wallet', element: withSuspense(WalletPage) },
      { path: 'orders', element: withSuspense(OrdersPage) },
      { path: 'notifications', element: withSuspense(NotificationsPage) },
      { path: 'referral', element: withSuspense(ReferralPage) },
      { path: 'profile', element: withSuspense(ProfilePage) },
      { path: 'settings', element: withSuspense(SettingsPage) },
      // Admin routes (access-guarded at page level)
      { path: 'admin', element: withSuspense(AdminOverviewPage) },
      { path: 'admin/orders', element: withSuspense(AdminOrdersPage) },
      { path: 'admin/users', element: withSuspense(AdminUsersPage) },
      { path: 'admin/announcements', element: withSuspense(AdminAnnouncementsPage) },
    ],
  },
])
