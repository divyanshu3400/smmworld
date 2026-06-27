import { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Wallet, Receipt, Gift, Bell, User, Settings, ChevronLeft, ChevronRight, Shield, ChartBar as BarChart3, Users, Zap, Megaphone, CreditCard, Menu, X } from 'lucide-react'
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
  { name: 'Payment Gateways', href: ROUTES.ADMIN_PAYMENT_SETTINGS, icon: CreditCard },
]

// ─── Hook: detect mobile breakpoint ────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

// ─── Shared logo mark ───────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25 flex-shrink-0">
      <Zap className="h-4 w-4 text-white" />
    </div>
  )
}

// ─── Sidebar inner content (shared by desktop + mobile drawer) ──────────────
function SidebarContent({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean
  onNavClick?: () => void
}) {
  const location = useLocation()
  const { isAdmin } = useAdmin()

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-hide">
        <NavSection
          items={userNavigation}
          collapsed={collapsed}
          location={location.pathname}
          onNavClick={onNavClick}
        />

        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              {collapsed ? (
                <div className="h-px bg-border mx-1 my-2" />
              ) : (
                <div className="flex items-center gap-2 px-2 py-1">
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider">
                    Admin
                  </span>
                </div>
              )}
            </div>
            <NavSection
              items={adminNavigation}
              collapsed={collapsed}
              location={location.pathname}
              accent="amber"
              onNavClick={onNavClick}
            />
          </>
        )}
      </nav>
    </>
  )
}

// ─── Desktop sidebar (collapsible, fixed) ──────────────────────────────────
function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('smmhub-sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('smmhub-sidebar-collapsed', String(collapsed))
  }, [collapsed])

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
              <LogoMark />
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
              <LogoMark />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SidebarContent collapsed={collapsed} />

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

// ─── Mobile top bar + drawer ────────────────────────────────────────────────
function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  // Close drawer on route change
  const location = useLocation()
  useEffect(() => { close() }, [location.pathname, close])

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-base font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </div>
      </header>

      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Drawer panel ── */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.8 }}
            className={cn(
              'fixed left-0 top-0 bottom-0 z-50 w-72',
              'bg-card border-r border-border',
              'flex flex-col overflow-hidden shadow-2xl'
            )}
          >
            {/* Drawer header */}
            <div className="flex h-14 items-center justify-between px-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  {APP_NAME}
                </span>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent collapsed={false} onNavClick={close} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Root export ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileSidebar /> : <DesktopSidebar />
}

// ─── NavSection (unchanged logic, added onNavClick) ─────────────────────────
function NavSection({
  items,
  collapsed,
  location,
  accent = 'emerald',
  onNavClick,
}: {
  items: { name: string; href: string; icon: React.ElementType }[]
  collapsed: boolean
  location: string
  accent?: 'emerald' | 'amber'
  onNavClick?: () => void
}) {
  const activeClass =
    accent === 'amber'
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
              onClick={onNavClick}
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
                  className={`absolute left-0 w-0.5 h-5 rounded-r-full ${accent === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
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