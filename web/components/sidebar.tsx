"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { UserRole } from '@/types'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  BedDouble,
  FlaskConical,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Pill,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react'

const nonReceptionistRoles: UserRole[] = ['super_admin', 'hospital_admin', 'doctor', 'nurse', 'lab_technician', 'pharmacist', 'billing_staff']

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: undefined as UserRole[] | undefined },
  { name: 'Patient Registration', href: '/patients/register', icon: Calendar, roles: ['hospital_admin', 'receptionist', 'nurse'] as UserRole[] },
  { name: 'Patients', href: '/patients', icon: Users, roles: undefined as UserRole[] | undefined },
  { name: 'Appointments', href: '/appointments', icon: Calendar, roles: undefined as UserRole[] | undefined },
  { name: 'OPD', href: '/opd', icon: Stethoscope, roles: nonReceptionistRoles },
  { name: 'IPD', href: '/ipd', icon: BedDouble, roles: ['hospital_admin', 'lab_technician', 'pharmacist', 'billing_staff'] as UserRole[] },
  { name: 'Wards', href: '/wards', icon: BedDouble, roles: ['super_admin', 'hospital_admin', 'nurse'] as UserRole[] },
  { name: 'Lab', href: '/lab', icon: FlaskConical, roles: ['hospital_admin', 'lab_technician'] as UserRole[] },
  { name: 'Billing', href: '/billing', icon: DollarSign, roles: ['super_admin', 'hospital_admin', 'billing_staff', 'receptionist', 'nurse'] as UserRole[] },
  { name: 'Medicines', href: '/medicines', icon: Pill, roles: ['super_admin', 'hospital_admin', 'pharmacist'] as UserRole[] },
  { name: 'Services', href: '/services', icon: ClipboardList, roles: ['super_admin', 'hospital_admin'] as UserRole[] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['super_admin', 'hospital_admin', 'receptionist'] as UserRole[] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'hospital_admin'] as UserRole[] },
]

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { user, logout, hasRole } = useAuth()
  const filteredNav = navigation.filter(item => !item.roles || hasRole(item.roles))
  const visibleNav = user?.role === 'nurse'
    ? [...filteredNav].sort((a, b) => a.name.localeCompare(b.name))
    : filteredNav

  // When one nav href is a prefix of another (e.g. "/patients" and
  // "/patients/register"), a path like "/patients/register" matches both,
  // highlighting them simultaneously. Only the most specific (longest)
  // matching href should be active.
  const activeHref = visibleNav.reduce<string | null>((best, item) => {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`)
    if (!matches) return best
    if (!best || item.href.length > best.length) return item.href
    return best
  }, null)

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-2 p-6 border-b border-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/jeevanti-logo.jpg" alt="Jeevanti Hospitals" className="h-8 w-8 object-contain shrink-0 rounded" />
        <div className="min-w-0">
          <h1 className="font-bold text-lg truncate">Jeevanti Hospitals</h1>
          <p className="text-xs text-slate-400 truncate">Hospital Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {visibleNav.map((item) => {
          const isActive = item.href === activeHref
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-4 min-w-0">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 z-50">
            <div className="relative h-full">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-white z-10"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onLinkClick={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
