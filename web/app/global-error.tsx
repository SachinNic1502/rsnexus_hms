"use client"

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="p-4 rounded-full bg-orange-100 mb-6 inline-block">
              <AlertTriangle className="h-12 w-12 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-2">
              A critical error occurred. Please try again.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-6">Error ID: {error.digest}</p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                <Home className="mr-2 h-4 w-4" /> Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
