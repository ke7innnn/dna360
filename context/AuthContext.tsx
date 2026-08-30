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
  logout: () => void
  switchPersona: (userId: string) => void
  createCustomRole: (role: Omit<RoleDefinition, 'id' | 'createdAt' | 'isSystem'>) => RoleDefinition
  updateRolePermissions: (roleId: string, capabilities: Capability[]) => void
  deleteCustomRole: (roleId: string) => boolean
  revokeSession: (sessionId: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Default to Owner for immediate dev testing
  const [user, setUser] = useState<AuthUser | null>(SEEDED_USERS[0])
  const [roles, setRoles] = useState<RoleDefinition[]>(SEEDED_ROLE_DEFINITIONS)
  const [sessions, setSessions] = useState<UserSession[]>(SEEDED_ACTIVE_SESSIONS)
  const [activeBranch, setActiveBranch] = useState<Branch>(SEEDED_USERS[0].branches[0])
  const [isLoading, setIsLoading] = useState(true)
  const [isTwoFactorPending, setIsTwoFactorPending] = useState(false)
  const [pending2FAUser, setPending2FAUser] = useState<AuthUser | null>(null)

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
      if (storedUser) {
        const parsed: AuthUser = JSON.parse(storedUser)
        if (parsed?.name?.includes('Kevin') || parsed?.email?.includes('pinnacle.studio')) {
          parsed.name = 'Executive Admin'
          parsed.email = 'admin@dna360.in'
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed))
        }
        setUser(parsed)
        if (parsed?.branches?.[0]) setActiveBranch(parsed.branches[0])
      }

      const storedRoles = localStorage.getItem(ROLES_STORAGE_KEY)
      if (storedRoles) {
        setRoles(JSON.parse(storedRoles))
      } else {
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(SEEDED_ROLE_DEFINITIONS))
      }

      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY)
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions))
      } else {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(SEEDED_ACTIVE_SESSIONS))
      }
    } catch (err) {
      console.error('Failed initializing auth storage:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveUserSession = (activeUser: AuthUser | null) => {
    setUser(activeUser)
    if (activeUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser))
      if (activeUser.branches[0]) setActiveBranch(activeUser.branches[0])
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  // Capability check (The Atom — always check capabilities in code, never role names)
  const can = useCallback(
    (capability: Capability): boolean => {
      if (!user) return false
      return requireCapability(user, capability)
    },
    [user]
  )

  const canRevenue = user ? canAccessRevenue(user.role.slug) : false

  // 1. Dual Login — Method 1: Email / Phone + Password
  const loginWithPassword = async (
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; redirectUrl?: string; requires2FA?: boolean }> => {
    const cleanId = identifier.trim().toLowerCase()
    const cleanPhone = normaliseIndianPhone(identifier.trim())

    let matched = SEEDED_USERS.find(
      (u) =>
        (u.email?.toLowerCase() === cleanId || u.phone === cleanPhone || u.phone === identifier.trim()) &&
        (u.passwordHash === pass || pass === 'password123' || pass === 'admin123')
    )

    // Fallback: Check 659 member directory
    if (!matched && (pass === 'password123' || pass === 'admin123')) {
      try {
        const { getStoredMembers } = require('@/lib/members')
        const allMembers = getStoredMembers()
        const found = allMembers.find(
          (m: any) =>
            m.email?.toLowerCase() === cleanId ||
            m.phone === cleanPhone ||
            m.phone === identifier.trim() ||
            m.member_code?.toLowerCase() === cleanId
        )
        if (found) {
          const roleDef = roles.find((r) => r.slug === 'MEMBER') || SEEDED_ROLE_DEFINITIONS[SEEDED_ROLE_DEFINITIONS.length - 1]
          matched = {
            id: found.id,
            clubId: 'club_powai_01',
            type: 'MEMBER',
            name: found.name,
            email: found.email || `${found.id}@dna360.in`,
            phone: found.phone,
            role: roleDef,
            branchId: 'pow',
            branches: [SEEDED_USERS[0].branches[0]],
            status: found.status === 'blacklisted' ? 'inactive' : 'active',
            membershipStatus: found.status === 'inactive' ? 'EXPIRED' : (found.status === 'grace_period' ? 'GRACE_PERIOD' : 'ACTIVE'),
            can_view_revenue: false,
            requires_login: true,
            passwordHash: 'password123',
          }
        }
      } catch (e) {
        console.error('Member lookup error:', e)
      }
    }

    if (!matched) {
      return { success: false, error: 'Invalid credentials. Check email/phone and password.' }
    }

    if (matched.status !== 'active') {
      return { success: false, error: 'Your account has been deactivated or suspended.' }
    }

    // 2FA Requirement for Owner & 3 Revenue Heads (§6)
    if (matched.twoFactorRequired) {
      setPending2FAUser(matched)
      setIsTwoFactorPending(true)
      return { success: true, requires2FA: true }
    }

    saveUserSession(matched)

    logAuditEvent({
      actor: { id: matched.id, name: matched.name, email: matched.email || matched.phone, role: matched.role.name },
      action: 'LOGIN',
      entity: 'Auth',
      entityId: matched.id,
      branchId: matched.branchId,
      branchName: matched.branches[0]?.name,
      description: `${matched.name} (${matched.role.name}) authenticated via password`,
    })

    const redirectUrl = getRoleDefaultRedirect(matched)
    return { success: true, redirectUrl }
  }

  // 2. Dual Login — Method 2: Phone OTP (Passwordless for Members & Staff)
  const sendLoginOtp = async (phone: string): Promise<{ success: boolean; message: string }> => {
    const clean = normaliseIndianPhone(phone)
    let matched = SEEDED_USERS.find((u) => u.phone === clean || u.phone.endsWith(phone.slice(-10)))

    if (!matched) {
      try {
        const { getStoredMembers } = require('@/lib/members')
        const allMembers = getStoredMembers()
        const found = allMembers.find((m: any) => m.phone === clean || m.phone.endsWith(phone.slice(-10)))
        if (found) matched = found
      } catch (e) {}
    }

    if (!matched) {
      return { success: false, message: 'No registered member or staff found with this mobile number.' }
    }
    return { success: true, message: `OTP code sent to ${phone} via WhatsApp / SMS (Use demo OTP: 123456)` }
  }

  const loginWithOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; error?: string; redirectUrl?: string }> => {
    const clean = normaliseIndianPhone(phone)
    let matched = SEEDED_USERS.find((u) => u.phone === clean || u.phone.endsWith(phone.slice(-10)))

    // Fallback: Check 659 member directory
    if (!matched) {
      try {
        const { getStoredMembers } = require('@/lib/members')
        const allMembers = getStoredMembers()
        const found = allMembers.find((m: any) => m.phone === clean || m.phone.endsWith(phone.slice(-10)))
        if (found) {
          const roleDef = roles.find((r) => r.slug === 'MEMBER') || SEEDED_ROLE_DEFINITIONS[SEEDED_ROLE_DEFINITIONS.length - 1]
          matched = {
            id: found.id,
            clubId: 'club_powai_01',
            type: 'MEMBER',
            name: found.name,
            email: found.email || `${found.id}@dna360.in`,
            phone: found.phone,
            role: roleDef,
            branchId: 'pow',
            branches: [SEEDED_USERS[0].branches[0]],
            status: found.status === 'blacklisted' ? 'inactive' : 'active',
            membershipStatus: found.status === 'inactive' ? 'EXPIRED' : (found.status === 'grace_period' ? 'GRACE_PERIOD' : 'ACTIVE'),
            can_view_revenue: false,
            requires_login: true,
            passwordHash: 'password123',
          }
        }
      } catch (e) {}
    }

    if (!matched) {
      return { success: false, error: 'Mobile number not found in directory.' }
    }

    if (otp !== '123456' && otp !== '999999') {
      return { success: false, error: 'Invalid or expired OTP code.' }
    }

    saveUserSession(matched)

    logAuditEvent({
      actor: { id: matched.id, name: matched.name, email: matched.email || matched.phone, role: matched.role.name },
      action: 'LOGIN',
      entity: 'Auth',
      entityId: matched.id,
      branchId: matched.branchId,
      description: `${matched.name} (${matched.role.name}) authenticated via Phone OTP`,
    })

    const redirectUrl = getRoleDefaultRedirect(matched)
    return { success: true, redirectUrl }
  }

  // 2FA TOTP verification
  const verifyTwoFactor = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    if (!pending2FAUser) return { success: false, error: 'No pending 2FA login session.' }
    if (otp !== '123456' && otp !== '999999') {
      return { success: false, error: 'Invalid 2FA authenticator code.' }
    }

    saveUserSession(pending2FAUser)
    setIsTwoFactorPending(false)
    setPending2FAUser(null)
    toast.success(`2FA Authenticated as ${pending2FAUser.name}`)

    const redirectUrl = getRoleDefaultRedirect(pending2FAUser)
    router.push(redirectUrl)
    return { success: true }
  }

  const logout = () => {
    if (user) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email || user.phone, role: user.role.name },
        action: 'LOGOUT',
        entity: 'Auth',
        entityId: user.id,
        branchId: user.branchId,
        description: `${user.name} signed out`,
      })
    }
    saveUserSession(null)
    toast.success('Signed out successfully')
    router.push('/login')
  }

  const switchPersona = (userId: string) => {
    const target = SEEDED_USERS.find((u) => u.id === userId)
    if (!target) return
    saveUserSession(target)
    toast.success(`Switched persona to ${target.name}`, {
      description: `Role: ${target.role.name} · Revenue Wall: ${canAccessRevenue(target.role.slug) ? 'UNLOCKED' : 'LOCKED'}`,
    })
    const redirectUrl = getRoleDefaultRedirect(target)
    router.push(redirectUrl)
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
