"use client"

import AppLayout from '@/components/app-layout'
import { UserRole } from '@/types'

const allowedRoles: UserRole[] = ['super_admin', 'hospital_admin']

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout allowedRoles={allowedRoles} title="Reports">{children}</AppLayout>
}
