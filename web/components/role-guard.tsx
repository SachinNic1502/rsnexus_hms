"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { UserRole } from "@/types"
import { Loader2, ShieldAlert } from "lucide-react"

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ allowedRoles, children, fallback, redirectTo = "/forbidden" }: RoleGuardProps) {
  const { user, hasRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !hasRole(allowedRoles)) {
      router.push(redirectTo)
    }
  }, [user, isLoading, hasRole, allowedRoles, redirectTo, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user || !hasRole(allowedRoles)) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ShieldAlert className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md">
          You don&apos;t have permission to access this page. Required roles:{" "}
          {allowedRoles.map(r => r.replace("_", " ")).join(", ")}
        </p>
      </div>
    )
  }

  return <>{children}</>
}

export function canAccess(allowedRoles: UserRole[], userRole?: UserRole | null): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}
