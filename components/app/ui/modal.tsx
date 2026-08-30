'use client'

import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { scaleFade } from '@/lib/motion'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = 'md',
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Overlay */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>

            {/* Content */}
            <DialogPrimitive.Content asChild>
              <motion.div
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)]',
                  sizeMap[size],
                  'bg-[var(--bg-elev)] border border-[var(--line)] rounded-[var(--r-lg)]',
                  'shadow-[0_24px_48px_-20px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)]',
                  'overflow-hidden -translate-x-1/2 -translate-y-1/2',
                  className
                )}
                variants={scaleFade}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
                  <div>
                    <DialogPrimitive.Title className="font-display text-base font-semibold text-[var(--ink)]">
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description className="font-ui text-xs text-[var(--muted)] mt-0.5">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close
                    className="p-1.5 rounded-[var(--r-sm)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </DialogPrimitive.Close>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
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

export default Modal
