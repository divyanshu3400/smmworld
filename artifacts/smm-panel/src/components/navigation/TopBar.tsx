import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials, getFullName } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '@/services/notification.service'
import { getWallet } from '@/services/wallet.service'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getCurrencySymbol, type CurrencyCode } from '@/lib/currency'
import { getSettings } from '@/services'
import { useEffect } from 'react'

export default function TopBar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const { currency, setCurrency } = useCurrency()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(user!.id),
    enabled: !!user?.id,
  })

  useEffect(() => {
    if (settings?.preferred_currency) {
      setCurrency(settings.preferred_currency as CurrencyCode)
    }
  }, [settings?.preferred_currency])
  
  const currencySymbol = getCurrencySymbol(currency as CurrencyCode)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => getUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 30000,
  })

  // Same query key as the wallet page — shares the React Query cache.
  // When the wallet page invalidates ['wallet'] after a top-up, this
  // balance updates automatically with no extra fetch.
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(user!.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    if (query) {
      console.log('Search:', query)
    }
  }

  const firstName = profile?.first_name ?? null
  const lastName = profile?.last_name ?? null

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form onSubmit={handleSearch} className="relative flex flex-1 items-center max-w-md">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            name="search"
            placeholder="Search..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </form>

        <div className="flex flex-1 items-center justify-end gap-x-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.WALLET)}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            title="Wallet balance"
          >
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span>{currencySymbol}{(wallet?.balance ?? 0).toFixed(2)}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block h-6 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt={getFullName(firstName, lastName)} />
                  <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-sm font-medium">
                    {getInitials(firstName ?? '', lastName ?? '')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">
                  {getFullName(firstName, lastName)}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getFullName(firstName, lastName)}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
