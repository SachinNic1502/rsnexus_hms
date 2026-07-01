"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  BedDouble,
  DollarSign,
  TrendingUp,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/toast'

interface DashboardStats {
  todayAppointments: number
  admittedPatients: number
  availableBeds: number
  totalBeds: number
  occupiedBeds: number
  pendingBills: number
  pendingBillTotal: number
}

interface Doctor {
  id: string
  name: string
  department: string
  available: boolean
}

interface RecentAppointment {
  id: string
  patient: string
  doctor: string
  time: string
  status: string
}

interface RecentAdmission {
  id: string
  patient: string
  ward: string
  room: string
  bed: string
  admittedAt: string
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setDoctors(Array.isArray(data.doctors) ? data.doctors : [])
        setRecentAppointments(Array.isArray(data.recentAppointments) ? data.recentAppointments : [])
        setRecentAdmissions(Array.isArray(data.recentAdmissions) ? data.recentAdmissions : [])
      }
    } catch (error) {
      toast('Failed to fetch dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'warning'
      case 'waiting':
        return 'default'
      case 'scheduled':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const statCards = [
    ...(hasRole(['super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse'] as any) ? [{
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    }] : []),
    ...(hasRole(['super_admin', 'hospital_admin', 'doctor', 'nurse'] as any) ? [{
      title: 'Admitted Patients',
      value: stats?.admittedPatients || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    }] : []),
    ...(hasRole(['super_admin', 'hospital_admin', 'nurse'] as any) ? [{
      title: 'Available Beds',
      value: stats?.availableBeds || 0,
      icon: BedDouble,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    }] : []),
    ...(hasRole(['super_admin', 'hospital_admin', 'billing_staff'] as any) ? [{
      title: 'Pending Bills',
      value: stats?.pendingBills || 0,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    }] : []),
  ]

  const quickActions = [
    ...(hasRole(['super_admin', 'hospital_admin', 'receptionist'] as any) ? [
      { href: '/patients/new', label: 'New Patient', icon: Users },
      { href: '/appointments/new', label: 'Book Appointment', icon: Calendar },
    ] : []),
    ...(hasRole(['super_admin', 'hospital_admin', 'doctor', 'nurse'] as any) ? [
      { href: '/ipd/admit', label: 'Admit Patient', icon: BedDouble },
    ] : []),
    ...(hasRole(['super_admin', 'hospital_admin', 'billing_staff'] as any) ? [
      { href: '/billing/new', label: 'Generate Bill', icon: DollarSign },
    ] : []),
    ...(hasRole(['super_admin', 'hospital_admin'] as any) ? [
      { href: '/settings', label: 'Settings', icon: Settings },
    ] : []),
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              {stat.title === 'Available Beds' && stats && (
                <p className="text-xs text-gray-600 mt-1">
                  {stats.totalBeds - stats.occupiedBeds}/{stats.totalBeds} available
                </p>
              )}
              {stat.title === 'Pending Bills' && stats && (
                <p className="text-xs text-gray-600 mt-1">
                  ₹{stats.pendingBillTotal.toLocaleString()} total
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button>
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No appointments today</p>
              ) : (
                recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{appointment.patient}</p>
                        <p className="text-xs text-gray-600">{appointment.doctor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{appointment.time}</p>
                      <Badge variant={getStatusColor(appointment.status) as any}>
                        {appointment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Admissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAdmissions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active admissions</p>
              ) : (
                recentAdmissions.map((admission) => (
                  <div
                    key={admission.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <BedDouble className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{admission.patient}</p>
                        <p className="text-xs text-gray-600">
                          {admission.ward} - Room {admission.room}, Bed {admission.bed}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Availability */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Doctor Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium text-sm">Dr. {doctor.name}</p>
                  <p className="text-xs text-gray-600">{doctor.department}</p>
                </div>
                <Badge
                  variant={doctor.available ? 'success' : 'secondary'}
                >
                  {doctor.available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
