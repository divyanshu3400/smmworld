import { Outlet } from 'react-router-dom'
import PublicNavbar from '@/components/navigation/PublicNavbar'
import PublicFooter from '@/components/navigation/PublicFooter'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
