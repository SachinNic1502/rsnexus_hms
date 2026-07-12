"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

export default function NewAppointmentRedirect() {
  const router = useRouter()
  const { hasRole } = useAuth()

  useEffect(() => {
    router.push('/registration')
  }, [router])

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'receptionist']}>
      <div />
    </RoleGuard>
  )
}
