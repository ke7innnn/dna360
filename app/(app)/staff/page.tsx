'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/settings/roles')
  }, [router])
  return null
}
