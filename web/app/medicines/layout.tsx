"use client"

import AppLayout from '@/components/app-layout'
import { UserRole } from '@/types'

const allowedRoles: UserRole[] = ['super_admin', 'hospital_admin', 'pharmacist']

export default function MedicinesLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout allowedRoles={allowedRoles} title="Medicines">{children}</AppLayout>
}
