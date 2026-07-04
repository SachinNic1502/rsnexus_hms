"use client"

import AppLayout from '@/components/app-layout'
import { UserRole } from '@/types'

const allowedRoles: UserRole[] = ['super_admin', 'hospital_admin']

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout allowedRoles={allowedRoles} title="Settings">{children}</AppLayout>
}
