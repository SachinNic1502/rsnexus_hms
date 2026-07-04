"use client"

import AppLayout from '@/components/app-layout'
import { UserRole } from '@/types'

const allowedRoles: UserRole[] = ['super_admin', 'hospital_admin', 'receptionist']

export default function RegistrationLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout allowedRoles={allowedRoles} title="Registration">{children}</AppLayout>
}
