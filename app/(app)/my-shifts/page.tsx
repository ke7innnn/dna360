'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MyShiftsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/front-desk')
  }, [router])
  return null
}
