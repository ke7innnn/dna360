'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MemberDashboardPage() {
  const router = useRouter()

  // Members belong exclusively to the mobile app shell (/m)
  useEffect(() => {
    router.replace('/m')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070E]">
      <div className="w-7 h-7 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
