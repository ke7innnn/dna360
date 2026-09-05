'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, SwitchCamera, AlertCircle, Volume2, VolumeX, ShieldCheck } from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { getScannerLockStatus } from '@/lib/qr-security'

interface CameraQrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (decodedText: string) => void
  title?: string
  description?: string
}

export default function CameraQrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Optical Turnstile & QR Scanner',
  description = 'Align member digital badge or rolling OTP QR pass inside the frame',
}: CameraQrScannerModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  const scannerRef = useRef<any>(null)
  const hasScannedRef = useRef<boolean>(false)

  // Play audio beep on successful scan
  const playBeep = () => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12) // A6 note

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.16)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Cleanup scanner instance
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
      } catch (err) {
        console.warn('Scanner stop error:', err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    if (!isOpen) {
      stopScanner()
      return
    }

    hasScannedRef.current = false
    setErrorMsg(null)

    const lockStatus = getScannerLockStatus()
    if (lockStatus.isLocked) {
      setErrorMsg(`Scanner Locked: Excessive invalid scans detected. Cooldown in effect (${lockStatus.cooldownRemainingSeconds}s remaining).`)
      return
    }

    let isMounted = true

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!isMounted) return

        // Fetch available camera devices
        const devices = await Html5Qrcode.getCameras()
        if (!devices || devices.length === 0) {
          setErrorMsg('No camera found on this device. Please connect a webcam or use manual code entry.')
          return
        }

        setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id.slice(0, 5)}` })))

        const activeCameraId = selectedCameraId || devices[0].id
        const html5QrCode = new Html5Qrcode('dna360-camera-viewport')
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          activeCameraId,
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (hasScannedRef.current) return
            hasScannedRef.current = true

            playBeep()
            toast.success('QR Code Captured', {
              description: `Decoded payload: ${decodedText.slice(0, 24)}...`,
            })

            onScanSuccess(decodedText)
            onClose()
          },
          () => {
            // Frame scan tick without QR — ignore
          }
        )

        if (isMounted) {
          setIsScanning(true)
        }
      } catch (err: any) {
        console.error('Camera initialization failure:', err)
        if (isMounted) {
          if (err?.name === 'NotAllowedError' || String(err).includes('permission')) {
            setErrorMsg('Camera access was denied. Please allow camera permissions in your browser address bar.')
          } else {
            setErrorMsg(err?.message || 'Failed to start camera. Please ensure no other application is using it.')
          }
        }
      }
    }

    initScanner()

    return () => {
      isMounted = false
      stopScanner()
    }
  }, [isOpen, selectedCameraId])

  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return
    await stopScanner()
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    setSelectedCameraId(cameras[nextIndex].id)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[440px] rounded-[28px] bg-[#070A12] border border-[rgba(255,255,255,0.12)] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col items-center"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-[#3B82F6]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-[#38BDF8]/15 blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)] relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="font-ui font-bold text-sm text-white">{title}</h3>
                <p className="text-[11px] text-[var(--ink-2)]">Live HTML5 Optical Feed</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg text-[var(--ink-2)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all"
                title={soundEnabled ? 'Mute beep' : 'Enable beep'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#38BDF8]" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="p-1.5 rounded-lg text-[var(--ink-2)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--ink-2)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all ml-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-[var(--ink-2)] text-center my-3 relative z-10">
            {description}
          </p>

          {/* Camera Viewport Container */}
          <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-black border border-[rgba(255,255,255,0.1)] shadow-inner my-2 flex items-center justify-center">
            {errorMsg ? (
              <div className="p-6 text-center flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-[var(--app-warning)]" />
                <p className="text-xs text-[var(--app-warning)] leading-relaxed">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null)
                    setSelectedCameraId(null)
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.15)] transition-all"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <>
                <div id="dna360-camera-viewport" className="w-full h-full [&_video]:object-cover" />

                {/* Laser Scanning Reticle & Corner Brackets */}
                <div className="absolute inset-4 pointer-events-none border-2 border-[#38BDF8]/40 rounded-xl">
                  {/* Corner Accent Dots */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#38BDF8]" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#38BDF8]" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#38BDF8]" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#38BDF8]" />

                  {/* Animated Electric Blue Laser Line */}
                  <motion.div
                    animate={{ y: [0, 240, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_12px_#38BDF8]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer Security Badge */}
          <div className="w-full mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] text-[var(--ink-2)] relative z-10">
            <div className="flex items-center gap-1.5 text-[#38BDF8]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Fraud TOTP Verification</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:underline text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
