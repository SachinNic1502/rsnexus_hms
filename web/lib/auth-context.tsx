"use client"

import React, { createContext, useContext, useMemo } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (roles: UserRole[]) => boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Memoized on the underlying primitive fields (not `session`/`session.user`
  // itself) so `user` keeps a stable reference across re-renders whenever the
  // actual session data hasn't changed. Without this, pages whose effects
  // depend on `user` (e.g. appointments, opd) refetch on every unrelated
  // re-render of the provider tree, since a new object was handed to them
  // each time even though nothing about the session had actually changed.
  const user = useMemo(() => (
    session?.user ? {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
      role: session.user.role || 'receptionist',
    } : null
  ), [session?.user?.id, session?.user?.email, session?.user?.name, session?.user?.role])

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    return !result?.error
  }

  const logout = () => {
    signOut({ callbackUrl: '/login' })
  }

  const hasRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
      isLoading: status === 'loading',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return {
      user: null,
      login: async () => false,
      logout: () => {},
      isAuthenticated: false,
      hasRole: () => false,
      isLoading: true,
    }
  }
  return context
}
