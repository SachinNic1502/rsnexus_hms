"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Hospital, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Hospital className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Rs Nexus HMS
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Hospital Management System
          </p>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto mb-8">
            <p className="text-gray-700">
              Welcome to Rs Nexus - A comprehensive Hospital Management System
              designed to streamline daily operations, patient care, and administrative tasks.
            </p>
          </div>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
