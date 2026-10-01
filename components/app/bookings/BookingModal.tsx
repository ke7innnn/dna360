'use client'

import React, { useState } from 'react'
import {
  Calendar, Clock, User, Phone, Mail, Sparkles,
  Dumbbell, FileText, CheckCircle2, AlertCircle, X,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { BOOKING_SERVICES, type BookingServiceType, type Booking } from '@/types/booking'
import { createBooking } from '@/lib/bookings'
import { toast } from '@/components/app/ui/toast'

const TRAINERS = [
  { id: 'usr_tr_01', name: 'Rohan Kulkarni', specialty: 'Elite Strength & Conditioning' },
  { id: 'usr_tr_02', name: 'Rajesh Poojary', specialty: 'Reformer Pilates & Mobility Lead' },
  { id: 'usr_tr_03', name: 'Sameer Khan', specialty: 'Hypertrophy & Body Recomposition' },
  { id: 'usr_tr_04', name: 'Aniket Jadhav', specialty: 'Functional HIIT & Fitzone' },
  { id: 'usr_tr_05', name: 'Dr. Nikhil Shinde', specialty: 'Body Assessment & InBody Specialist' },
]

const TIME_SLOTS = [
  '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM',
  '10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM',
  '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM',
]

const SOURCES = ['Walk-in', 'WhatsApp', 'Telephonic', 'Social Media', 'Reference'] as const

export default function BookingModal({
  open,
  onOpenChange,
  onBookingCreated,
  initialService,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingCreated?: (booking: Booking) => void
  initialService?: BookingServiceType
}) {
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('+91')
  const [clientEmail, setClientEmail] = useState('')
  const [serviceType, setServiceType] = useState<BookingServiceType>(initialService || 'gym_trial')
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
  const [timeSlot, setTimeSlot] = useState('10:00 AM')
  const [assignedTrainerId, setAssignedTrainerId] = useState('usr_tr_01')
  const [source, setSource] = useState<'Walk-in' | 'WhatsApp' | 'Telephonic' | 'Social Media' | 'Reference'>('WhatsApp')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedService = BOOKING_SERVICES[serviceType]
  const selectedTrainer = TRAINERS.find((t) => t.id === assignedTrainerId) || TRAINERS[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || clientPhone.length < 10) {
      toast.error('Please provide a valid client name and 10-digit phone number.')
      return
    }

    setLoading(true)
    try {
      const newBooking = createBooking({
        clientName,
        clientPhone,
        clientEmail: clientEmail.trim() || undefined,
        serviceType,
        bookingDate,
        timeSlot,
        assignedStaffId: selectedTrainer.id,
        assignedStaffName: selectedTrainer.name,
        source,
        notes,
      })

      setLoading(false)
      toast.success(`Booked ${newBooking.serviceName} for ${newBooking.clientName}!`)
      if (onBookingCreated) onBookingCreated(newBooking)
      onOpenChange(false)

      // Reset
      setClientName('')
      setClientPhone('+91')
      setClientEmail('')
      setNotes('')
    } catch {
      setLoading(false)
      toast.error('Failed to create booking.')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Book Trial or Wellness Session"
      description="Direct in-software booking for trials, body assessments, and recovery sessions."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Selector (7 Required Options) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Select Booking Offering *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(BOOKING_SERVICES) as BookingServiceType[]).map((key) => {
              const svc = BOOKING_SERVICES[key]
              const isSelected = serviceType === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setServiceType(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] text-white'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-[var(--ink-2)]'
                  }`}
                >
                  <p className="font-ui text-xs font-bold leading-tight truncate">
                    {svc.label}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-1 font-mono">
                    {svc.durationMinutes} mins
                  </p>
                </button>
              )
            })}
          </div>
          {selectedService && (
            <p className="text-[11.5px] text-[#60A5FA] bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg mt-1">
              ℹ️ {selectedService.description}
            </p>
          )}
        </div>

        {/* Client Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Prospect / Member Full Name *"
            placeholder="e.g. Siddharth Rao"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />

          <Input
            label="Phone Number (+91) *"
            placeholder="+9198200XXXXX"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="client@gmail.com"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Enquiry Source
            </label>
            <Select value={source} onValueChange={(val: any) => setSource(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date, Time & Trainer Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Booking Date *
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Time Slot *
            </label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Assigned Specialist *
            </label>
            <Select value={assignedTrainerId} onValueChange={setAssignedTrainerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRAINERS.map((tr) => (
                  <SelectItem key={tr.id} value={tr.id}>{tr.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Special Requests / Fitness Background Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Past knee injury, interested in 1-year annual plan + 24 PT sessions..."
            className="w-full h-20 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button variant="primary" type="submit" disabled={loading} icon={<Sparkles className="w-4 h-4" />}>
            {loading ? 'Confirming...' : 'Confirm & Schedule Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
