"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/toast'
import { UserRole } from '@/types'

const allowedRoles: UserRole[] = ['super_admin', 'hospital_admin', 'billing_staff', 'receptionist']

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRole, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
    } else if (!hasRole(allowedRoles)) {
      toast('You do not have permission to access Billing', 'error')
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, hasRole, router, toast])

  if (isLoading || !isAuthenticated || !hasRole(allowedRoles)) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
    </div>
  )
}
