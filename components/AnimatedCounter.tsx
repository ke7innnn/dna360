'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  target: number
  duration?: number
  suffix?: string
  className?: string
}

export default function AnimatedCounter({
  target,
  duration = 2000,
  suffix = '+',
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const hasTriggered = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true
          const startTime = performance.now()
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easedProgress = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(easedProgress * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    const currentRef = ref.current
    if (currentRef) observer.observe(currentRef)
    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [target, duration])

  return (
    <span
      ref={ref}
      className={`font-black font-montserrat text-white ${className}`}
    >
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}
