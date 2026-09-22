'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Camera, SwitchCamera, AlertCircle, Volume2, VolumeX,
  ShieldCheck, CheckCircle, AlertTriangle, XCircle, Power,
  Users, Sparkles, RefreshCw, Zap
} from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { getScannerLockStatus } from '@/lib/qr-security'
import { getInitials } from '@/lib/utils'

export interface ScanResultPayload {
  status: 'GRANTED' | 'GRACE' | 'DENIED'
  memberName?: string
  memberCode?: string
  message?: string
  timestamp?: string
}

interface RecentCheckInItem {
  id: string
  name: string
  code?: string
  status: 'GRANTED' | 'GRACE' | 'DENIED'
  time: string
}

interface CameraQrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (decodedText: string) => ScanResultPayload | Promise<ScanResultPayload | void> | void
  title?: string
  description?: string
  continuous?: boolean // Cult.fit style continuous kiosk scanning (default: true)
}

export default function CameraQrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Gate 1 Optical Scanner · Cult Kiosk Mode',
  description = 'Keep scanner running continuously — members can scan their dynamic QR badge one by one',
  continuous = true,
}: CameraQrScannerModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  // Live session state
  const [sessionCount, setSessionCount] = useState(0)
  const [recentScans, setRecentScans] = useState<RecentCheckInItem[]>([])
  const [activeFeedback, setActiveFeedback] = useState<ScanResultPayload | null>(null)

  const scannerRef = useRef<any>(null)
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null)
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Play audio chime on scan
  const playAudioFeedback = useCallback((isSuccess: boolean) => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      if (isSuccess) {
        // High-fidelity Cult.fit 2-tone melodic chime: E5 (659Hz) -> A5 (880Hz)
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime)
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08)

        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(ctx.currentTime)
        osc1.stop(ctx.currentTime + 0.1)
        osc2.start(ctx.currentTime + 0.08)
        osc2.stop(ctx.currentTime + 0.35)
      } else {
        // Denied dual buzz (low frequency)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.setValueAtTime(164, ctx.currentTime + 0.12)

        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.28)
      }
    } catch {
      // Browser autoplay policy fallback
    }
  }, [soundEnabled])

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

  // Handle a detected QR code
  const handleQrDetected = async (decodedText: string) => {
    const now = Date.now()
    const trimmed = decodedText.trim()

    // 1. Anti-spam debounce: ignore identical QR if scanned within 3.5 seconds
    if (lastScannedRef.current && lastScannedRef.current.text === trimmed && (now - lastScannedRef.current.time) < 3500) {
      return
    }

    lastScannedRef.current = { text: trimmed, time: now }

    // 2. Invoke parent handler
    let result: ScanResultPayload | void = undefined
    try {
      result = await onScanSuccess(trimmed)
    } catch (err) {
      console.error('Scan handling failed:', err)
    }

    // Default to GRANTED if no payload returned
    const finalResult: ScanResultPayload = result || {
      status: 'GRANTED',
      memberName: 'Member Verified',
      message: 'Turnstile gate unlocked. Welcome to DNA 360!',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }

    const isSuccess = finalResult.status === 'GRANTED' || finalResult.status === 'GRACE'
    playAudioFeedback(isSuccess)

    // 3. Update live session counter & recent chips
    setSessionCount((prev) => prev + 1)
    setRecentScans((prev) => [
      {
        id: `scan_${now}`,
        name: finalResult.memberName || 'Member',
        code: finalResult.memberCode,
        status: finalResult.status,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 3),
    ])

    // 4. Show live visual feedback overlay over the reticle
    setActiveFeedback(finalResult)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      setActiveFeedback(null)
    }, 3200)

    // 5. If continuous is FALSE, close modal immediately (legacy one-shot behavior)
    if (!continuous) {
      onClose()
    }
  }

  useEffect(() => {
    if (!isOpen) {
      stopScanner()
      setActiveFeedback(null)
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      return
    }

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

        setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id.slice(0, 5)}` })))

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
            handleQrDetected(decodedText)
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
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [isOpen, selectedCameraId])

  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return
    await stopScanner()
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    setSelectedCameraId(cameras[nextIndex].id)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[480px] rounded-[32px] bg-[#07090F] border border-[rgba(255,255,255,0.14)] p-5 sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.98)] overflow-hidden flex flex-col items-center"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#3B82F6]/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-[#10B981]/15 blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)] relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                <Camera className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-ui font-bold text-sm text-white">{title}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)]">Continuous Kiosk · Auto-Scans Members</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl text-[var(--muted)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all cursor-pointer"
                title={soundEnabled ? 'Mute turnstile chime' : 'Enable turnstile chime'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#38BDF8]" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="p-2 rounded-xl text-[var(--muted)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all cursor-pointer"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}

              {/* Turn Off Scanner Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-ui text-xs font-semibold transition-all cursor-pointer ml-1"
                title="Turn Off Scanner"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Turn Off</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)] text-center mt-3 mb-2 relative z-10 px-2">
            {description}
          </p>

          {/* Camera Viewport Container */}
          <div className="relative w-full aspect-square max-w-[340px] rounded-3xl overflow-hidden bg-black border border-[rgba(255,255,255,0.12)] shadow-2xl my-2 flex items-center justify-center">
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
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.18)] transition-all cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <>
                <div id="dna360-camera-viewport" className="w-full h-full [&_video]:object-cover" />

                {/* Laser Scanning Reticle & Corner Brackets */}
                <div className="absolute inset-5 pointer-events-none border-2 border-[#38BDF8]/40 rounded-2xl">
                  {/* Corner Accent Brackets */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-[#38BDF8]" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-[#38BDF8]" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-[#38BDF8]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-[#38BDF8]" />

                  {/* Animated Electric Blue Laser Line */}
                  <motion.div
                    animate={{ y: [0, 240, 0] }}
                    transition={{ repeat: Infinity, duration: 2.0, ease: 'easeInOut' }}
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_14px_#38BDF8]"
                  />
                </div>

                {/* Real-time Result Overlay Banner (Cult.fit Style) */}
                <AnimatePresence>
                  {activeFeedback ? (
                    <motion.div
                      key="result-overlay"
                      initial={{ opacity: 0, y: 25, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className={`absolute inset-x-3 bottom-3 rounded-2xl p-3.5 backdrop-blur-xl border shadow-2xl flex flex-col gap-1.5 z-20 ${
                        activeFeedback.status === 'GRANTED'
                          ? 'bg-[#062419]/95 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-white'
                          : activeFeedback.status === 'GRACE'
                          ? 'bg-[#291804]/95 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] text-white'
                          : 'bg-[#290808]/95 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            activeFeedback.status === 'GRANTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : activeFeedback.status === 'GRACE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {activeFeedback.status === 'GRANTED' && <CheckCircle className="w-3.5 h-3.5" />}
                          {activeFeedback.status === 'GRACE' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {activeFeedback.status === 'DENIED' && <XCircle className="w-3.5 h-3.5" />}
                          <span>{activeFeedback.status === 'GRANTED' ? 'Access Granted' : activeFeedback.status === 'GRACE' ? 'Grace Access' : 'Access Denied'}</span>
                        </span>
                        <span className="text-[10px] font-mono text-white/70">
                          {activeFeedback.timestamp || 'Just now'}
                        </span>
                      </div>

                      {activeFeedback.memberName && (
                        <div>
                          <h4 className="font-ui font-bold text-base text-white tracking-tight leading-snug">
                            {activeFeedback.memberName}
                          </h4>
                          {activeFeedback.memberCode && (
                            <p className="font-mono text-[11px] text-white/80">
                              {activeFeedback.memberCode}
                            </p>
                          )}
                        </div>
                      )}

                      <p className="text-[11.5px] font-ui text-white/85 leading-tight">
                        {activeFeedback.message}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-ui text-white/80 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Hold QR inside frame to check in
                      </span>
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Live Session Counter & Recent Check-in Stream */}
          <div className="w-full mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-ui font-semibold text-white">Turnstile Gate 1 Ready</span>
              </div>
              <span className="font-mono text-xs text-[#38BDF8] font-bold bg-[#38BDF8]/10 px-2.5 py-0.5 rounded-full border border-[#38BDF8]/25">
                {sessionCount} Checked In Today
              </span>
            </div>

            {/* Mini feed of last 3 members who passed through */}
            {recentScans.length > 0 && (
              <div className="p-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-ui text-[var(--muted)] uppercase tracking-wider shrink-0 pl-1">
                  Recent:
                </span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {recentScans.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/[0.05] border border-white/[0.1] shrink-0 text-left"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#3B82F6]/30 flex items-center justify-center text-[10px] font-bold text-white">
                        {getInitials(item.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-ui font-semibold text-[11px] text-white truncate max-w-[90px]">
                          {item.name}
                        </p>
                        <p className="font-mono text-[9px] text-[var(--muted)]">
                          {item.time}
                        </p>
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'GRANTED' ? 'bg-emerald-400' : item.status === 'GRACE' ? 'bg-amber-400' : 'bg-red-400'}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Badge & Stop Scanner CTA */}
          <div className="w-full mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] text-[var(--muted)] relative z-10">
            <div className="flex items-center gap-1.5 text-[#38BDF8]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Replay &amp; Dynamic QR Security</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold transition-all cursor-pointer"
            >
              Close Scanner
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
