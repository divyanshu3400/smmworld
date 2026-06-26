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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { Zap } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Wallet', href: ROUTES.WALLET, icon: Wallet },
  { name: 'Orders', href: ROUTES.ORDERS, icon: Receipt },
  { name: 'Referral', href: ROUTES.REFERRAL, icon: Gift },
  { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
  { name: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('smmhub-sidebar-collapsed')
    return stored === 'true'
  })
  const location = useLocation()

  useEffect(() => {
    localStorage.setItem('smmhub-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 288 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40',
          'bg-card border-r border-border',
          'flex flex-col'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  {APP_NAME}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="h-9 w-9 mx-auto rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'transition-all duration-200',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'transition-colors duration-200'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 mx-auto" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  )
}
