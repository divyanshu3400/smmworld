import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/routes/routes'
import { queryClient } from '@/lib/query-client'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'bg-card border border-border',
                title: 'text-foreground',
                description: 'text-muted-foreground',
                success: 'text-emerald-500',
                error: 'text-red-500',
              },
            }}
          />
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
