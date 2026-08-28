import type { Metadata } from 'next'
import { ThemeProvider, ThemeAppContainer } from '@/components/app/theme/ThemeProvider'
import { AuthProvider } from '@/context/AuthContext'
import AuroraBackground from '@/components/app/aurora/AuroraBackground'
import AppShell from '@/components/app/shell/AppShell'
import { Toaster } from '@/components/app/ui/toast'

export const metadata: Metadata = {
  title: {
    template: '%s | DNA 360',
    default: 'Dashboard | DNA 360',
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <ThemeAppContainer>
        <AuthProvider>
          <AuroraBackground />
          <div className="relative z-10">
            <AppShell>
              {children}
            </AppShell>
          </div>
          <Toaster />
        </AuthProvider>
      </ThemeAppContainer>
    </ThemeProvider>
  )
}
