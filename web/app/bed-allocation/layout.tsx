"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'

// Bed Allocation is a nurse-facing screen (also open to admins for oversight).
const allowedRoles = ['nurse', 'super_admin', 'hospital_admin'] as const

export default function BedAllocationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!hasRole([...allowedRoles])) {
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, hasRole, router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  )
}
