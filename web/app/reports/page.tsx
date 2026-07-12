"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, TrendingUp, Users, BedDouble, Activity } from 'lucide-react'
import Link from 'next/link'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

const reports = [
  { title: 'Daily Report', description: 'Today\'s appointments, admissions, and revenue', href: '/reports/daily', icon: Calendar, color: 'bg-blue-500' },
  { title: 'Monthly Report', description: 'Monthly summary with department breakdown', href: '/reports/monthly', icon: TrendingUp, color: 'bg-green-500' },
  { title: 'Revenue Report', description: 'Revenue by category, payment methods, and trends', href: '/reports/revenue', icon: TrendingUp, color: 'bg-purple-500' },
  { title: 'Doctor Performance', description: 'Appointments, consultations, and completion rates', href: '/reports/doctor-performance', icon: Users, color: 'bg-orange-500' },
  { title: 'Bed Occupancy', description: 'Current bed status across all wards', href: '/reports/bed-occupancy', icon: BedDouble, color: 'bg-red-500' },
]

export default function ReportsPage() {
  const { hasRole } = useAuth()

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin']}>
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Hospital analytics and reports</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <report.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
    </RoleGuard>
  )
}
