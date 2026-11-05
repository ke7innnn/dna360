'use client'

import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { slideRight } from '@/lib/motion'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  width?: 'sm' | 'md' | 'lg' | 'xl'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  width,
  size = 'lg',
}: DrawerProps) {
  const resolvedWidth = width || size
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Overlay */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>

            {/* Content — slides from right */}
            <DialogPrimitive.Content asChild>
              <motion.div
                className={cn(
                  'fixed right-0 top-0 bottom-0 z-[70] w-full max-w-full',
                  widthMap[resolvedWidth],
                  'bg-[var(--bg-elev)] border-l border-[var(--line)]',
                  'shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.9)]',
                  'flex flex-col',
                  className
                )}
                variants={slideRight}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b border-[var(--line)] shrink-0">
                  <div className="min-w-0 flex-1">
                    <DialogPrimitive.Title className="font-display text-base font-semibold text-[var(--ink)] break-words">
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description className="font-ui text-xs text-[var(--muted)] mt-0.5 break-words">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close
                    className="p-1.5 rounded-[var(--r-sm)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </DialogPrimitive.Close>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

export default Drawer
