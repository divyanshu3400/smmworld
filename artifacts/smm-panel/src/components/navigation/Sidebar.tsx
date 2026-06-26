import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Gift,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart3,
  Users,
  Zap,
  Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { useAdmin } from '@/hooks/useAdmin'

const userNavigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Orders', href: ROUTES.ORDERS, icon: Receipt },
  { name: 'Referral', href: ROUTES.REFERRAL, icon: Gift },
  { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
  { name: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
]

const adminNavigation = [
  { name: 'Overview', href: ROUTES.ADMIN, icon: BarChart3 },
  { name: 'All Orders', href: ROUTES.ADMIN_ORDERS, icon: Receipt },
  { name: 'Users', href: ROUTES.ADMIN_USERS, icon: Users },
  { name: 'Announcements', href: ROUTES.ADMIN_ANNOUNCEMENTS, icon: Megaphone },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('smmhub-sidebar-collapsed')
    return stored === 'true'
  })
  const location = useLocation()
  const { isAdmin } = useAdmin()

  useEffect(() => {
    localStorage.setItem('smmhub-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const isAdminSection = location.pathname.startsWith('/admin')

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40',
        'bg-card border-r border-border',
        'flex flex-col overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-border flex-shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {!collapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25 flex-shrink-0">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent truncate">
                {APP_NAME}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-hide">
        {/* User nav */}
        <NavSection
          items={userNavigation}
          collapsed={collapsed}
          location={location.pathname}
        />

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              {collapsed ? (
                <div className="h-px bg-border mx-1 my-2" />
              ) : (
                <div className="flex items-center gap-2 px-2 py-1">
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider">Admin</span>
                </div>
              )}
            </div>
            <NavSection
              items={adminNavigation}
              collapsed={collapsed}
              location={location.pathname}
              accent="amber"
            />
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full px-2 py-2 rounded-lg',
            'text-muted-foreground hover:text-foreground hover:bg-accent',
            'transition-colors duration-200'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}

function NavSection({
  items,
  collapsed,
  location,
  accent = 'emerald',
}: {
  items: { name: string; href: string; icon: React.ElementType }[]
  collapsed: boolean
  location: string
  accent?: 'emerald' | 'amber'
}) {
  const activeClass = accent === 'amber'
    ? 'bg-amber-500/10 text-amber-500'
    : 'bg-emerald-500/10 text-emerald-500'

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = location === item.href
        const Icon = item.icon
        return (
          <li key={item.name}>
            <NavLink
              to={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'relative flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-150',
                isActive
                  ? activeClass
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {isActive && (
                <motion.div
                  layoutId={`active-${accent}`}
                  className={`absolute left-0 w-0.5 h-5 rounded-r-full ${accent === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}
