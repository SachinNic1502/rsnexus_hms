"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Building2, Stethoscope, HeartPulse, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'

const settingsPages = [
  { title: 'User Management', description: 'Manage system users, roles, and access', href: '/settings/users', icon: Users, color: 'bg-blue-500' },
  { title: 'Departments', description: 'Manage hospital departments', href: '/settings/departments', icon: Building2, color: 'bg-green-500' },
  { title: 'Doctor Management', description: 'Manage doctor availability and specializations', href: '/settings/doctors', icon: Stethoscope, color: 'bg-purple-500' },
  { title: 'Nurse / Compounder Management', description: 'Register nurses and compounders', href: '/settings/nurses', icon: HeartPulse, color: 'bg-pink-500' },
]

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button></Link>
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">System administration and configuration</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {settingsPages.map((page) => (
          <Link key={page.href} href={page.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${page.color}`}>
                    <page.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{page.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
