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
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Hospital,
  Pill,
  Menu,
  X,
  UserPlus,
  FileText,
  BedDouble,
} from 'lucide-react'

const sections = [
  // Receptionist
  {
    label: 'Receptionist',
    roles: ['receptionist'] as UserRole[],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Patient Registration', href: '/registration', icon: UserPlus },
      { name: 'Appointments', href: '/appointments', icon: Calendar },
      { name: 'Patient List', href: '/patients', icon: Users },
      { name: 'Billing', href: '/billing', icon: DollarSign },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  // Doctor
  {
    label: 'Doctor',
    roles: ['doctor'] as UserRole[],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Today\'s Patients', href: '/opd', icon: Stethoscope },
      { name: 'History', href: '/patients', icon: FileText },
      { name: 'Prescriptions', href: '/prescriptions', icon: Pill },
    ],
  },
  // Nurse
  {
    label: 'Nurse',
    roles: ['nurse'] as UserRole[],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'IPD Admissions', href: '/ipd', icon: BedDouble },
      { name: 'Bed Dashboard', href: '/wards/beds', icon: BedDouble },
      { name: 'Patient List', href: '/patients', icon: Users },
    ],
  },
  // Billing Staff
  {
    label: 'Billing',
    roles: ['billing_staff'] as UserRole[],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Billing', href: '/billing', icon: DollarSign },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  // Lab Technician
  {
    label: 'Lab',
    roles: ['lab_technician'] as UserRole[],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Lab Orders', href: '/lab', icon: Stethoscope },
    ],
  },
  // Pharmacist
  {
    label: 'Pharmacy',
    roles: ['pharmacist'] as UserRole[],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Prescriptions', href: '/prescriptions', icon: FileText },
      { name: 'Medicines', href: '/medicines', icon: Pill },
    ],
  },
  // Admin (Super Admin & Hospital Admin)
  {
    label: 'Administration',
    roles: ['super_admin', 'hospital_admin'] as UserRole[],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Users', href: '/settings/users', icon: Users },
      { name: 'Medicines', href: '/medicines', icon: Pill },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
]

function isActiveMatch(pathname: string, href: string): boolean {
  if (pathname === href) return true
  // Exact parent match (e.g. /settings matches /settings/users but not /settings-users)
  if (href !== '/' && pathname.startsWith(href + '/')) return true
  return false
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { user, logout, hasRole } = useAuth()
  const visibleSections = sections.filter(s => !s.roles || hasRole(s.roles))

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-2 p-6 border-b border-slate-800">
        <Hospital className="h-8 w-8 text-blue-400 shrink-0" />
        <div className="min-w-0">
          <h1 className="font-bold text-lg truncate">Rs Nexus HMS</h1>
          <p className="text-xs text-slate-400 truncate">Hospital Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = isActiveMatch(pathname, item.href)
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
            </div>
          </div>
        ))}
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
