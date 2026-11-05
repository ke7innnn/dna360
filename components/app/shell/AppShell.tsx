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
  const isMemberRoute = pathname.startsWith('/m')

  // Render minimal mobile wrapper only on auth routes or dedicated mobile member routes (/m)
  if (isAuthRoute || isMemberRoute) {
    return (
      <div className="min-h-screen relative z-10" data-surface={isMemberRoute ? 'member' : 'app'}>
        {children}
      </div>
    )
  }

  const activeRoleSlug = (user?.role?.slug as RoleName) || role || 'owner'

  return (
    <div className="min-h-screen overflow-x-hidden" data-surface="app">
      <Sidebar role={activeRoleSlug} />
      <TopBar />

      {/* Main content area */}
      <main
        className={cn(
          'pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-16 min-h-screen min-w-0 transition-all duration-200',
          collapsed ? 'md:pl-[68px]' : 'md:pl-[250px]'
        )}
      >
        <div className="px-3.5 pb-6 pt-3 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10 max-w-[1560px] mx-auto min-w-0">
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
