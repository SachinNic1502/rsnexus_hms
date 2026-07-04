"use client"

import AppLayout from '@/components/app-layout'
import { UserRole } from '@/types'

const allowedRoles: UserRole[] = ['super_admin', 'hospital_admin', 'doctor', 'pharmacist']

export default function PrescriptionsLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout allowedRoles={allowedRoles} title="Prescriptions">{children}</AppLayout>
}
