"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/toast'

const allowedRoles = ['super_admin', 'hospital_admin', 'billing_staff']

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (!hasRole(allowedRoles as any)) {
      toast('You do not have permission to access Billing', 'error')
      router.push('/dashboard')
    }
  }, [isAuthenticated, hasRole, router, toast])

  if (!isAuthenticated || !hasRole(allowedRoles as any)) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
    </div>
  )
}
