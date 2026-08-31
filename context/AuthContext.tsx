'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser, RoleDefinition, UserSession, RoleSlug } from '@/types/auth'
import type { Capability } from '@/config/permissions'
import type { Branch } from '@/types'
import {
  SEEDED_USERS,
  SEEDED_ROLE_DEFINITIONS,
  SEEDED_ACTIVE_SESSIONS,
  normaliseIndianPhone,
  getRoleDefaultRedirect,
  requireCapability,
  canAccessRevenue,
} from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { toast } from '@/components/app/ui/toast'

const AUTH_STORAGE_KEY = 'dna360_active_user'
const ROLES_STORAGE_KEY = 'dna360_roles_list'
const SESSIONS_STORAGE_KEY = 'dna360_active_sessions'

interface AuthContextValue {
  user: AuthUser | null
  activeRole: RoleDefinition | null
  roles: RoleDefinition[]
  sessions: UserSession[]
  activeBranch: Branch
  isAuthenticated: boolean
  isLoading: boolean
  isTwoFactorPending: boolean
  can: (capability: Capability) => boolean
  canRevenue: boolean
  loginWithPassword: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; requires2FA?: boolean }>
  loginWithOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>
  sendLoginOtp: (phone: string) => Promise<{ success: boolean; message: string }>
  verifyTwoFactor: (otp: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  switchPersona: (userId: string) => Promise<void>
  createCustomRole: (role: Omit<RoleDefinition, 'id' | 'createdAt' | 'isSystem'>) => RoleDefinition
  updateRolePermissions: (roleId: string, capabilities: Capability[]) => void
  deleteCustomRole: (roleId: string) => boolean
  revokeSession: (sessionId: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [roles, setRoles] = useState<RoleDefinition[]>(SEEDED_ROLE_DEFINITIONS)
  const [sessions, setSessions] = useState<UserSession[]>(SEEDED_ACTIVE_SESSIONS)
  const [activeBranch, setActiveBranch] = useState<Branch>(SEEDED_USERS[0].branches[0])
  const [isLoading, setIsLoading] = useState(true)
  const [isTwoFactorPending, setIsTwoFactorPending] = useState(false)
  const [pending2FAUser, setPending2FAUser] = useState<AuthUser | null>(null)

  // Initialize session from server API
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            setUser(data.user)
            if (data.user.branches?.[0]) setActiveBranch(data.user.branches[0])
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user))
          } else {
            setUser(null)
            localStorage.removeItem(AUTH_STORAGE_KEY)
          }
        } else {
          // Check if there was local stored session and verify against server
          const stored = localStorage.getItem(AUTH_STORAGE_KEY)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed?.email || parsed?.phone) {
              const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: parsed.email || parsed.phone, password: 'password123' }),
              })
              if (loginRes.ok) {
                const loginData = await loginRes.json()
                setUser(loginData.user)
                if (loginData.user?.branches?.[0]) setActiveBranch(loginData.user.branches[0])
              } else {
                setUser(null)
                localStorage.removeItem(AUTH_STORAGE_KEY)
              }
            }
          } else {
            setUser(null)
          }
        }

        const storedRoles = localStorage.getItem(ROLES_STORAGE_KEY)
        if (storedRoles) setRoles(JSON.parse(storedRoles))

        const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY)
        if (storedSessions) setSessions(JSON.parse(storedSessions))
      } catch (err) {
        console.error('Failed to initialize session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  const saveUserSession = (activeUser: AuthUser | null) => {
    setUser(activeUser)
    if (activeUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser))
      if (activeUser.branches?.[0]) setActiveBranch(activeUser.branches[0])
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  const can = useCallback(
    (capability: Capability): boolean => {
      if (!user) return false
      return requireCapability(user, capability)
    },
    [user]
  )

  const canRevenue = user ? canAccessRevenue(user.role.slug) : false

  // 1. Password Login via Server API
  const loginWithPassword = async (
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; redirectUrl?: string; requires2FA?: boolean }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      })

      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' }
      }

      if (data.requires2FA) {
        setPending2FAUser(data.user)
        setIsTwoFactorPending(true)
        return { success: true, requires2FA: true }
      }

      saveUserSession(data.user)
      return { success: true, redirectUrl: data.redirectUrl || '/overview' }
    } catch (err: any) {
      return { success: false, error: err.message || 'Login request failed' }
    }
  }

  // 2. Phone OTP Login via Server API
  const sendLoginOtp = async (phone: string): Promise<{ success: boolean; message: string }> => {
    const clean = normaliseIndianPhone(phone)
    let matched = SEEDED_USERS.find((u) => u.phone === clean || u.phone.endsWith(phone.slice(-10)))

    if (!matched) {
      return { success: false, message: 'No registered member or staff found with this mobile number.' }
    }
    return { success: true, message: `OTP code sent to ${phone} via WhatsApp / SMS (Use demo OTP: 123456)` }
  }

  const loginWithOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; error?: string; redirectUrl?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phone, otp }),
      })

      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'OTP verification failed' }
      }

      saveUserSession(data.user)
      return { success: true, redirectUrl: data.redirectUrl || '/overview' }
    } catch (err: any) {
      return { success: false, error: err.message || 'OTP verification error' }
    }
  }

  // 3. 2FA Verification
  const verifyTwoFactor = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    if (otp !== '123456' && otp !== '000000') {
      return { success: false, error: 'Invalid 2FA code. Please enter 123456.' }
    }

    if (pending2FAUser) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: pending2FAUser.email || pending2FAUser.phone, password: 'password123' }),
      })
      const data = await res.json()
      saveUserSession(data.user || pending2FAUser)
      setIsTwoFactorPending(false)
      setPending2FAUser(null)
      toast.success('Two-factor authentication verified')
      router.push(data.redirectUrl || '/overview')
      return { success: true }
    }

    return { success: false, error: 'No pending 2FA challenge' }
  }

  // 4. Logout via Server API
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {}

    saveUserSession(null)
    toast.success('Signed out successfully')
    router.push('/login')
  }

  // 5. Persona Switcher (re-authenticates with server session cookie)
  const switchPersona = async (userId: string) => {
    const target = SEEDED_USERS.find((u) => u.id === userId)
    if (!target) return

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: target.email || target.phone, password: 'password123' }),
      })

      if (res.ok) {
        const data = await res.json()
        saveUserSession(data.user)
        toast.success(`Switched persona to ${target.name}`, {
          description: `Role: ${target.role.name} · Revenue Wall: ${canAccessRevenue(target.role.slug) ? 'UNLOCKED' : 'LOCKED'}`,
        })
        router.push(data.redirectUrl || '/overview')
      }
    } catch (e) {
      console.error('Persona switch error:', e)
    }
  }

  const createCustomRole = (roleData: Omit<RoleDefinition, 'id' | 'createdAt' | 'isSystem'>): RoleDefinition => {
    const newRole: RoleDefinition = {
      ...roleData,
      id: `role_custom_${Date.now()}`,
      isSystem: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [...roles, newRole]
    setRoles(updated)
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated))
    return newRole
  }

  const updateRolePermissions = (roleId: string, capabilities: Capability[]) => {
    const updated = roles.map((r) => (r.id === roleId ? { ...r, capabilities, updatedAt: new Date().toISOString() } : r))
    setRoles(updated)
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated))
    toast.success('Role capability permissions updated')
  }

  const deleteCustomRole = (roleId: string): boolean => {
    const target = roles.find((r) => r.id === roleId)
    if (!target || target.isSystem) return false
    const updated = roles.filter((r) => r.id !== roleId)
    setRoles(updated)
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated))
    return true
  }

  const revokeSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId)
    setSessions(updated)
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole: user?.role || null,
        roles,
        sessions,
        activeBranch,
        isAuthenticated: !!user,
        isLoading,
        isTwoFactorPending,
        can,
        canRevenue,
        loginWithPassword,
        loginWithOtp,
        sendLoginOtp,
        verifyTwoFactor,
        logout,
        switchPersona,
        createCustomRole,
        updateRolePermissions,
        deleteCustomRole,
        revokeSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
