'use client'

import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
            {/* Dark Blur Backdrop Overlay */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </DialogPrimitive.Overlay>

            {/* Centered Scrollable Viewport Wrapper */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
              <DialogPrimitive.Content asChild>
                <motion.div
                  className={cn(
                    'w-full pointer-events-auto my-auto',
                    sizeMap[size],
                    'bg-[#0D0C12]/95 border border-[rgba(255,255,255,0.12)] rounded-[24px]',
                    'shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(59,130,246,0.12)]',
                    'backdrop-blur-2xl relative overflow-hidden',
                    className
                  )}
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Subtle top edge aurora glow line */}
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[rgba(255,92,122,0.45)] to-transparent pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.07)]">
                    <div>
                      <DialogPrimitive.Title className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                        {title}
                      </DialogPrimitive.Title>
                      {description && (
                        <DialogPrimitive.Description className="font-ui text-xs text-[var(--ink-2)] mt-0.5 leading-relaxed">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                    <DialogPrimitive.Close
                      className="p-1.5 rounded-full text-[var(--ink-3)] hover:text-white hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </DialogPrimitive.Close>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5 max-h-[calc(85vh-90px)] overflow-y-auto">
                    {children}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

export default Modal
