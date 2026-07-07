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
  Stethoscope,
  FileText,
  Pill,
  Activity,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/toast'

interface Doctor {
  id: string
  name: string
  department: string
  available: boolean
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  
  const [stats, setStats] = useState<any>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  
  // Lists for different roles
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([])
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([])
  const [recentLabOrders, setRecentLabOrders] = useState<any[]>([])
  const [recentPendingInvoices, setRecentPendingInvoices] = useState<any[]>([])
  
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
        if (data.doctors) setDoctors(data.doctors)
        if (data.recentAppointments) setRecentAppointments(data.recentAppointments)
        if (data.recentAdmissions) setRecentAdmissions(data.recentAdmissions)
        if (data.recentPrescriptions) setRecentPrescriptions(data.recentPrescriptions)
        if (data.recentLabOrders) setRecentLabOrders(data.recentLabOrders)
        if (data.recentPendingInvoices) setRecentPendingInvoices(data.recentPendingInvoices)
      }
    } catch (error) {
      toast('Failed to fetch dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'success'
      case 'in_progress':
      case 'partial':
      case 'waiting':
        return 'warning'
      case 'scheduled':
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
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

  const role = user?.role || 'receptionist'

  // Define role specific welcome messages
  const roleWelcome: Record<string, string> = {
    receptionist: 'Manage registrations, appointments, and billing.',
    doctor: 'View today\'s patients, consultations, and prescriptions.',
    billing_staff: 'Manage invoices and payments.',
    lab_technician: 'Process lab orders and reports.',
    pharmacist: 'Manage prescriptions and medicine inventory.',
    nurse: 'Monitor admissions and bed availability.',
    hospital_admin: 'Manage users, medicines, and system settings.',
    super_admin: 'Full system oversight and configuration.',
  }

  // Quick Action links based on roles
  const quickActions = [
    // Admin (Super Admin / Hospital Admin)
    ...(hasRole(['super_admin', 'hospital_admin']) ? [
      { href: '/settings/users', label: 'Manage Users', icon: Settings },
      { href: '/settings/departments', label: 'Manage Departments', icon: Users },
      { href: '/settings/doctors', label: 'Manage Doctors', icon: Stethoscope },
      { href: '/services', label: 'Service Catalog', icon: DollarSign },
      { href: '/reports', label: 'View Reports', icon: BarChart3 },
    ] : []),
    
    // Receptionist
    ...(role === 'receptionist' ? [
      { href: '/registration', label: 'Register Patient', icon: Users },
      { href: '/registration', label: 'Book Appointment', icon: Calendar },
      { href: '/billing/new', label: 'New Invoice', icon: DollarSign },
      { href: '/billing', label: 'View Billing', icon: FileText },
    ] : []),

    // Doctor
    ...(role === 'doctor' ? [
      { href: '/opd', label: 'Today\'s OPD Queue', icon: Stethoscope },
      { href: '/patients', label: 'Patient Database', icon: Users },
      { href: '/prescriptions', label: 'Prescriptions List', icon: FileText },
    ] : []),

    // Nurse
    ...(role === 'nurse' ? [
      { href: '/ipd/admit', label: 'Admit Patient', icon: BedDouble },
      { href: '/ipd', label: 'IPD Management', icon: ClipboardCheck },
      { href: '/wards/beds', label: 'Bed Dashboard', icon: Activity },
      { href: '/patients', label: 'Patient Database', icon: Users },
    ] : []),

    // Pharmacist
    ...(role === 'pharmacist' ? [
      { href: '/prescriptions', label: 'Prescriptions Queue', icon: FileText },
      { href: '/medicines', label: 'Medicine Inventory', icon: Pill },
    ] : []),

    // Lab Technician
    ...(role === 'lab_technician' ? [
      { href: '/lab', label: 'Lab Orders', icon: Stethoscope },
      { href: '/lab/catalog', label: 'Lab Test Catalog', icon: ClipboardCheck },
    ] : []),

    // Billing Staff
    ...(role === 'billing_staff' ? [
      { href: '/billing/new', label: 'New Invoice', icon: DollarSign },
      { href: '/billing', label: 'View Billing', icon: FileText },
      { href: '/billing/pending', label: 'Pending Payments', icon: Clock },
    ] : []),
  ]

  // Render stats cards depending on user role
  const renderStats = () => {
    if (role === 'doctor') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100"><Calendar className="h-5 w-5 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.todayAppointments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patients in Queue</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100"><Clock className="h-5 w-5 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.waitingQueue || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Consultations</CardTitle>
              <div className="p-2 rounded-lg bg-green-100"><UserCheck className="h-5 w-5 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.completedConsultations || 0}</div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (role === 'nurse') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Admitted Patients</CardTitle>
              <div className="p-2 rounded-lg bg-green-100"><Users className="h-5 w-5 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.admittedPatients || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Available Beds</CardTitle>
              <div className="p-2 rounded-lg bg-purple-100"><BedDouble className="h-5 w-5 text-purple-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.availableBeds || 0}</div>
              <p className="text-xs text-gray-600 mt-1">{stats?.occupiedBeds || 0}/{stats?.totalBeds || 0} occupied</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Daily Rounds Logged Today</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100"><ClipboardCheck className="h-5 w-5 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.roundsLoggedToday || 0}</div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (role === 'pharmacist') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock Medicines</CardTitle>
              <div className="p-2 rounded-lg bg-red-100"><AlertCircle className="h-5 w-5 text-red-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.lowStockMedicines || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Medicines in Catalog</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100"><Pill className="h-5 w-5 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalMedicines || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Prescriptions Generated Today</CardTitle>
              <div className="p-2 rounded-lg bg-green-100"><FileText className="h-5 w-5 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.prescriptionsToday || 0}</div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (role === 'lab_technician') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Lab Orders</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100"><Clock className="h-5 w-5 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.pendingLabOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress Orders</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100"><Activity className="h-5 w-5 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.inProgressLabOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Orders Today</CardTitle>
              <div className="p-2 rounded-lg bg-green-100"><UserCheck className="h-5 w-5 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.completedToday || 0}</div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (role === 'billing_staff') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Bills</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100"><DollarSign className="h-5 w-5 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.pendingBills || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Invoices Generated Today</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100"><FileText className="h-5 w-5 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.invoicesToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue Collected Today</CardTitle>
              <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats?.revenueToday || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (role === 'receptionist') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100"><Calendar className="h-5 w-5 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.todayAppointments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patients Waiting</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100"><Clock className="h-5 w-5 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.waitingQueue || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Visits Today</CardTitle>
              <div className="p-2 rounded-lg bg-green-100"><UserCheck className="h-5 w-5 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.completedVisits || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Bills</CardTitle>
              <div className="p-2 rounded-lg bg-purple-100"><DollarSign className="h-5 w-5 text-purple-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.pendingBills || 0}</div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Default overview (Admin roles)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100"><Calendar className="h-5 w-5 text-blue-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.todayAppointments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Admitted Patients</CardTitle>
            <div className="p-2 rounded-lg bg-green-100"><Users className="h-5 w-5 text-green-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.admittedPatients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Beds</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100"><BedDouble className="h-5 w-5 text-purple-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.availableBeds || 0}</div>
            <p className="text-xs text-gray-600 mt-1">{(stats?.totalBeds || 0) - (stats?.occupiedBeds || 0)}/{stats?.totalBeds || 0} available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Bills</CardTitle>
            <div className="p-2 rounded-lg bg-orange-100"><DollarSign className="h-5 w-5 text-orange-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pendingBills || 0}</div>
            <p className="text-xs text-gray-600 mt-1">₹{(stats?.pendingBillTotal || 0).toLocaleString()} total</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render lists depending on user role
  const renderLists = () => {
    if (role === 'doctor') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>My Patients Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No appointments today</p>
              ) : (
                recentAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100"><UserCheck className="h-4 w-4 text-blue-600" /></div>
                      <div>
                        <p className="font-medium text-sm">{apt.patient}</p>
                        <p className="text-xs text-gray-600">Token: #{apt.tokenNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium mb-1">{apt.time}</p>
                      <Badge variant={getStatusBadgeVariant(apt.status) as any}>{apt.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (role === 'nurse') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Current Ward Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAdmissions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active admissions</p>
              ) : (
                recentAdmissions.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100"><BedDouble className="h-4 w-4 text-green-600" /></div>
                      <div>
                        <p className="font-medium text-sm">{a.patient}</p>
                        <p className="text-xs text-gray-600">{a.ward} - Room {a.room}, Bed {a.bed}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">Admitted</Badge>
                      <p className="text-xs text-gray-500 mt-1">{new Date(a.admittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (role === 'pharmacist') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPrescriptions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent prescriptions</p>
              ) : (
                recentPrescriptions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100"><FileText className="h-4 w-4 text-blue-600" /></div>
                      <div>
                        <p className="font-medium text-sm">{p.patient}</p>
                        <p className="text-xs text-gray-600">{p.doctor} · {p.medicinesCount} medicine(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <Link href={`/prescriptions/${p.id}`} className="inline-block mt-1">
                        <Button size="sm" variant="outline">Dispense</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (role === 'lab_technician') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Lab Test Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLabOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent lab orders</p>
              ) : (
                recentLabOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100"><ClipboardCheck className="h-4 w-4 text-blue-600" /></div>
                      <div>
                        <p className="font-medium text-sm">{o.patient}</p>
                        <p className="text-xs text-gray-600">{o.orderNumber} · {o.testsCount} test(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(o.status) as any}>{o.status}</Badge>
                      <Link href={`/lab/order/${o.id}`} className="block mt-1">
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (role === 'billing_staff') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Recent Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPendingInvoices.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No pending invoices</p>
              ) : (
                recentPendingInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-orange-100"><DollarSign className="h-4 w-4 text-orange-600" /></div>
                      <div>
                        <p className="font-medium text-sm">{inv.patient}</p>
                        <p className="text-xs text-gray-600">{inv.invoiceNumber} · ₹{inv.total.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(inv.status) as any}>{inv.status}</Badge>
                      <Link href={`/billing/${inv.id}/payment`} className="block mt-1">
                        <Button size="sm" variant="outline">Pay</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )
    }
    if (role === 'receptionist') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No appointments today</p>
                ) : (
                  recentAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100"><Calendar className="h-4 w-4 text-blue-600" /></div>
                        <div>
                          <p className="font-medium text-sm">{apt.patient}</p>
                          <p className="text-xs text-gray-600">Dr. {apt.doctor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium mb-1">{apt.time}</p>
                        <Badge variant={getStatusBadgeVariant(apt.status) as any}>{apt.status.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Pending Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Pending Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPendingInvoices.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No pending invoices</p>
                ) : (
                  recentPendingInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100"><DollarSign className="h-4 w-4 text-orange-600" /></div>
                        <div>
                          <p className="font-medium text-sm">{inv.patient}</p>
                          <p className="text-xs text-gray-600">{inv.invoiceNumber} · ₹{inv.total.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge variant={getStatusBadgeVariant(inv.status) as any}>{inv.status}</Badge>
                        <Link href={`/billing/${inv.id}/payment`} className="block">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Pay</Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Default overview (Admin roles)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
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
                      <Badge variant={getStatusBadgeVariant(appointment.status) as any}>
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
        {(hasRole(['super_admin', 'hospital_admin', 'nurse']) && recentAdmissions.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Admissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAdmissions.map((admission) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! {roleWelcome[role] || 'Here\'s what\'s happening today.'}
        </p>
      </div>

      {/* Stats Grid */}
      {renderStats()}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="py-4">
            <CardTitle className="text-md">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="flex flex-wrap gap-4">
              {quickActions.map((action) => (
                <Link key={`${action.href}-${action.label}`} href={action.href}>
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

      {/* Main content grid */}
      {renderLists()}

      {/* Doctor Availability - Only for admin roles */}
      {hasRole(['super_admin', 'hospital_admin']) && doctors.length > 0 && (
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
      )}
    </div>
  )
}

