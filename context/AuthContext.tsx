'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser, RoleDefinition, RoleSlug, UserSession } from '@/types/auth'
import type { Capability } from '@/config/permissions'
import type { Branch } from '@/types'
import {
  SEEDED_USERS,
  SEEDED_ROLE_DEFINITIONS,
  SEEDED_ACTIVE_SESSIONS,
  normaliseIndianPhone,
  getRoleDefaultRedirect,
} from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'

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
  can: (capability: Capability) => boolean
  loginWithPassword: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>
  loginWithOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>
  logout: () => void
  switchPersona: (userId: string) => void
  switchBranch: (branchId: string) => void
  createCustomRole: (role: Omit<RoleDefinition, 'id' | 'createdAt' | 'isSystem'>) => RoleDefinition
  updateRolePermissions: (roleId: string, capabilities: Capability[]) => void
  deleteCustomRole: (roleId: string) => boolean
  revokeSession: (sessionId: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(SEEDED_USERS[0]) // Default to Owner for easy preview
  const [roles, setRoles] = useState<RoleDefinition[]>(SEEDED_ROLE_DEFINITIONS)
  const [sessions, setSessions] = useState<UserSession[]>(SEEDED_ACTIVE_SESSIONS)
  const [activeBranch, setActiveBranch] = useState<Branch>(SEEDED_USERS[0].branches[0])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
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

  // Permission capability check
  const can = useCallback(
    (capability: Capability): boolean => {
      if (!user) return false
      // Owner role bypasses with all permissions
      if (user.role.slug === 'owner') return true
      return user.role.capabilities.includes(capability)
    },
    [user]
  )

  // Login via Email/Phone + Password
  const loginWithPassword = async (
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; redirectUrl?: string }> => {
    setIsLoading(true)
    const cleanId = identifier.trim().toLowerCase()
    const normalisedPhone = normaliseIndianPhone(identifier.trim())

    const matchedUser = SEEDED_USERS.find(
      (u) =>
        (u.email.toLowerCase() === cleanId || u.phone === normalisedPhone || u.phone === identifier.trim()) &&
        u.passwordHash === pass
    )

    if (!matchedUser) {
      setIsLoading(false)
      return { success: false, error: 'Invalid email/phone or password. (Hint: test with password123)' }
    }

    saveUserSession(matchedUser)

    logAuditEvent({
      actor: { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, role: matchedUser.role.name },
      action: 'LOGIN',
      entity: 'Auth',
      entityId: matchedUser.id,
      branchId: matchedUser.branchId,
      description: `${matchedUser.name} logged in with password (${matchedUser.role.name})`,
      afterState: { authType: 'password', role: matchedUser.role.slug },
    })

    setIsLoading(false)
    const dest = getRoleDefaultRedirect(matchedUser.role.slug)
    return { success: true, redirectUrl: dest }
  }

  // Login via Phone OTP
  const loginWithOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; error?: string; redirectUrl?: string }> => {
    setIsLoading(true)
    const normalised = normaliseIndianPhone(phone)

    // Demo rule: '360360' or '123456' is valid for all seeded accounts
    if (otp !== '360360' && otp !== '123456') {
      setIsLoading(false)
      return { success: false, error: 'Invalid verification code. Use demo OTP: 360360' }
    }

    const matchedUser = SEEDED_USERS.find((u) => u.phone === normalised || u.phone.includes(phone.replace(/\D/g, '')))

    // If phone not in seeds, default to Member persona
    const authenticatedUser = matchedUser || {
      ...SEEDED_USERS[4],
      phone: normalised,
      name: 'Guest Member',
    }

    saveUserSession(authenticatedUser)

    logAuditEvent({
      actor: { id: authenticatedUser.id, name: authenticatedUser.name, email: authenticatedUser.email, role: authenticatedUser.role.name },
      action: 'LOGIN',
      entity: 'Auth',
      entityId: authenticatedUser.id,
      branchId: authenticatedUser.branchId,
      description: `${authenticatedUser.name} logged in via Phone OTP`,
      afterState: { authType: 'otp', phone: normalised },
    })

    setIsLoading(false)
    const dest = getRoleDefaultRedirect(authenticatedUser.role.slug)
    return { success: true, redirectUrl: dest }
  }

  const logout = () => {
    if (user) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        action: 'LOGOUT',
        entity: 'Auth',
        entityId: user.id,
        branchId: user.branchId,
        description: `${user.name} signed out`,
      })
    }
    saveUserSession(null)
    router.push('/login')
  }

  // Quick switch persona for testing
  const switchPersona = (userId: string) => {
    const target = SEEDED_USERS.find((u) => u.id === userId)
    if (target) {
      saveUserSession(target)
      logAuditEvent({
        actor: { id: target.id, name: target.name, email: target.email, role: target.role.name },
        action: 'OVERRIDE',
        entity: 'Auth',
        entityId: target.id,
        branchId: target.branchId,
        description: `Persona switched to ${target.name} (${target.role.name})`,
      })
      const dest = getRoleDefaultRedirect(target.role.slug)
      router.push(dest)
    }
  }

  const switchBranch = (branchId: string) => {
    if (!user) return
    const targetBranch = user.branches.find((b) => b.id === branchId)
    if (targetBranch) {
      setActiveBranch(targetBranch)
    }
  }

  // Role management actions
  const createCustomRole = (newRoleData: Omit<RoleDefinition, 'id' | 'createdAt' | 'isSystem'>): RoleDefinition => {
    const newRole: RoleDefinition = {
      ...newRoleData,
      id: `role_${Date.now()}`,
      isSystem: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [...roles, newRole]
    setRoles(updated)
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated))

    if (user) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        action: 'CREATE',
        entity: 'Role',
        entityId: newRole.id,
        branchId: activeBranch.id,
        description: `Created new custom role: ${newRole.name}`,
        afterState: newRole as unknown as Record<string, unknown>,
      })
    }
    return newRole
  }

  const updateRolePermissions = (roleId: string, newCapabilities: Capability[]) => {
    const roleIdx = roles.findIndex((r) => r.id === roleId)
    if (roleIdx === -1) return

    const beforeRole = roles[roleIdx]
    const updatedRole: RoleDefinition = {
      ...beforeRole,
      capabilities: newCapabilities,
      updatedAt: new Date().toISOString(),
    }

    const updated = [...roles]
    updated[roleIdx] = updatedRole
    setRoles(updated)
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated))

    // If current user is using this role, update current user instance
    if (user && user.role.id === roleId) {
      const updatedUser = { ...user, role: updatedRole }
      saveUserSession(updatedUser)
    }

    if (user) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        action: 'UPDATE',
        entity: 'Role',
        entityId: roleId,
        branchId: activeBranch.id,
        description: `Updated permissions for role: ${beforeRole.name}`,
        beforeState: { capabilities: beforeRole.capabilities },
        afterState: { capabilities: newCapabilities },
      })
    }
  }

  const deleteCustomRole = (roleId: string): boolean => {
    const role = roles.find((r) => r.id === roleId)
    if (!role || role.isSystem) return false

    const updated = roles.filter((r) => r.id !== roleId)
    setRoles(updated)
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated))

    if (user) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        action: 'DELETE',
        entity: 'Role',
        entityId: roleId,
        branchId: activeBranch.id,
        description: `Deleted custom role: ${role.name}`,
        beforeState: role as unknown as Record<string, unknown>,
      })
    }
    return true
  }

  // Force-logout / Revoke Session
  const revokeSession = (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId)
    if (!targetSession) return

    const updated = sessions.filter((s) => s.id !== sessionId)
    setSessions(updated)
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated))

    if (user) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        action: 'REVOKE_SESSION',
        entity: 'Session',
        entityId: sessionId,
        branchId: activeBranch.id,
        description: `Force-revoked active session for ${targetSession.userName} (${targetSession.deviceType})`,
        beforeState: targetSession as unknown as Record<string, unknown>,
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole: user?.role ?? null,
        roles,
        sessions,
        activeBranch,
        isAuthenticated: !!user,
        isLoading,
        can,
        loginWithPassword,
        loginWithOtp,
        logout,
        switchPersona,
        switchBranch,
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
  if (!ctx) {
    return {
      user: SEEDED_USERS[0],
      activeRole: SEEDED_ROLE_DEFINITIONS[0],
      roles: SEEDED_ROLE_DEFINITIONS,
      sessions: SEEDED_ACTIVE_SESSIONS,
      activeBranch: SEEDED_USERS[0].branches[0],
      isAuthenticated: true,
      isLoading: false,
      can: () => true,
      loginWithPassword: async () => ({ success: true }),
      loginWithOtp: async () => ({ success: true }),
      logout: () => {},
      switchPersona: () => {},
      switchBranch: () => {},
      createCustomRole: () => SEEDED_ROLE_DEFINITIONS[0],
      updateRolePermissions: () => {},
      deleteCustomRole: () => false,
      revokeSession: () => {},
    }
  }
  return ctx
}
