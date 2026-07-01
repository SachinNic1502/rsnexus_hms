"use client"

import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh]">
      <div className="p-4 rounded-full bg-red-100 mb-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-600 mb-1 max-w-md">{error.message}</p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-4">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </div>
  )
}
