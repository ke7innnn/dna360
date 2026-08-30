'use client'

import React from 'react'
import Sidebar, { SidebarProvider, useSidebar } from './Sidebar'
import TopBar from './TopBar'
import { cn } from '@/lib/utils'
import type { RoleName } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'

function AppShellInner({
  children,
  role,
}: {
  children: React.ReactNode
  role?: RoleName
}) {
  const { collapsed } = useSidebar()
  const { user } = useAuth()
  const pathname = usePathname()

  const isAuthRoute = pathname === '/login' || pathname === '/forgot-password'

  if (isAuthRoute) {
    return <div className="min-h-screen relative z-10">{children}</div>
  }

  const activeRoleSlug = (user?.role?.slug as RoleName) || role || 'owner'

  return (
    <div className="min-h-screen" data-surface="app">
      <Sidebar role={activeRoleSlug} />
      <TopBar />

      {/* Main content area */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-200',
          collapsed ? 'md:pl-[68px]' : 'md:pl-[250px]'
        )}
      >
        <div className="p-5 sm:p-7 lg:p-9 max-w-[1560px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AppShell({
  children,
  role,
}: {
  children: React.ReactNode
  role?: RoleName
}) {
  return (
    <SidebarProvider>
      <AppShellInner role={role}>
        {children}
      </AppShellInner>
    </SidebarProvider>
  )
}
