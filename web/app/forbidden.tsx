"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldOff, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function Forbidden() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="p-4 rounded-full bg-red-100 mb-6 inline-block">
          <ShieldOff className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-2">
          You don&apos;t have permission to access this page.
        </p>
        {user && (
          <p className="text-sm text-gray-400 mb-8">
            Logged in as <span className="font-medium text-gray-600">{user.name}</span> ({user.role?.replace('_', ' ')})
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button>
              <Home className="mr-2 h-4 w-4" /> Go to Dashboard
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
