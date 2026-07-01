"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/lib/auth-context"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
