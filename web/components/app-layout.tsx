"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/toast'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  title?: string
}

export default function AppLayout({ children, allowedRoles, title }: AppLayoutProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
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
      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
    </div>
  )
}
