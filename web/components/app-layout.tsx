"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/toast'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlobalSearch } from '@/components/global-search'
import { NotificationBell } from '@/components/notification-bell'

interface AppLayoutProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  title?: string
}

export default function AppLayout({ children, allowedRoles, title }: AppLayoutProps) {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
      toast(`You do not have permission to access ${title || 'this page'}`, 'error')
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, hasRole, allowedRoles, title, router, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (allowedRoles && !hasRole(allowedRoles)) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP NAVBAR / HEADER with Global Search */}
        <header className="h-16 border-b bg-white px-6 flex items-center justify-between shrink-0 no-print">
          <div className="w-96">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Badge variant="outline" className="capitalize text-slate-600 bg-slate-50">
              {user?.role?.replace('_', ' ')}
            </Badge>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
      </div>
    </div>
  )
}
