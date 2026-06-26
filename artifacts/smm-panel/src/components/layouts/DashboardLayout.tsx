import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/navigation/Sidebar'
import TopBar from '@/components/navigation/TopBar'

const SIDEBAR_KEY = 'smmhub-sidebar-collapsed'
const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 72

export default function DashboardLayout() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    localStorage.getItem(SIDEBAR_KEY) === 'true' ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
  )

  // Track mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Track sidebar collapsed state (same-tab via interval + cross-tab via storage event)
  useEffect(() => {
    if (isMobile) return
    const sync = () => {
      const collapsed = localStorage.getItem(SIDEBAR_KEY) === 'true'
      setSidebarWidth(collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED)
    }
    const id = setInterval(sync, 150)
    window.addEventListener('storage', sync)
    return () => {
      clearInterval(id)
      window.removeEventListener('storage', sync)
    }
  }, [isMobile])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div
        className="transition-[margin-left,padding-top] duration-[250ms] ease-in-out"
        style={
          isMobile
            ? { paddingTop: '3.5rem' }      // 56px — clears fixed mobile top bar
            : { marginLeft: sidebarWidth }   // tracks collapse animation
        }
      >
        <TopBar />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}