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
          'pt-14 sm:pt-16 min-h-screen transition-all duration-200',
          collapsed ? 'md:pl-[68px]' : 'md:pl-[250px]'
        )}
      >
        <div className="px-4 pt-1.5 pb-6 sm:px-6 sm:pt-2 sm:pb-8 lg:px-8 lg:pt-3 lg:pb-10 max-w-[1560px] mx-auto">
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
