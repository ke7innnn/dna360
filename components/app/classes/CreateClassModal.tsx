'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, MapPin, Dumbbell, Sparkles } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { getStoredStudios, createSession } from '@/lib/classes'
import type { ClassCategory, IntensityLevel, StudioRoom, ClassSession } from '@/types/class'
import { toast } from '@/components/app/ui/toast'

export default function CreateClassModal({
  open,
  onOpenChange,
  studios: propStudios,
  onSessionCreated,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  studios?: StudioRoom[]
  onSessionCreated?: (session: ClassSession) => void
  onCreated?: () => void
}) {
  const [studios, setStudios] = useState<StudioRoom[]>(propStudios || [])

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ClassCategory>('crossfit')
  const [instructorId, setInstructorId] = useState('usr_trainer_01')
  const [instructorName, setInstructorName] = useState('Rajesh Poojary')
  const [branchId, setBranchId] = useState('pow')
  const [studioId, setStudioId] = useState('studio_pow_a')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('07:00')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [capacity, setCapacity] = useState(20)
  const [intensity, setIntensity] = useState<IntensityLevel>('High')
  const [caloriesEstimate, setCaloriesEstimate] = useState(600)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      const allStudios = propStudios && propStudios.length > 0 ? propStudios : getStoredStudios()
      setStudios(allStudios)
      setStudios(allStudios)
      const defaultStudio = allStudios[0]
      if (defaultStudio) {
        setStudioId(defaultStudio.id)
        setCapacity(defaultStudio.capacity || 8)
      }
    }
  }, [open])

  const handleInstructorChange = (id: string) => {
    setInstructorId(id)
    const map: Record<string, string> = {
      usr_trainer_01: 'Rajesh Poojary',
      usr_trainer_02: 'Aftab Memon',
      usr_trainer_03: 'Hemant Shirke',
      usr_trainer_04: 'Zeebran Shaikh',
      usr_trainer_05: 'Afzal Shah',
      usr_trainer_06: 'Kunal Chavan',
      usr_trainer_07: 'Mandar Shirke',
      usr_trainer_08: 'Ankur Saravade',
      usr_trainer_09: 'Pramod Sawant',
    }
    setInstructorName(map[id] || 'Rajesh Poojary')
  }

  const handleStudioChange = (id: string) => {
    setStudioId(id)
    const st = studios.find((s) => s.id === id)
    if (st) setCapacity(st.capacity || 8)
  }

  const calculateEndTime = (start: string, duration: number): string => {
    const [h, m] = start.split(':').map(Number)
    const totalMinutes = h * 60 + m + duration
    const endH = Math.floor(totalMinutes / 60) % 24
    const endM = totalMinutes % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const studio = studios.find((s) => s.id === studioId) || studios[0]
    const endTime = calculateEndTime(startTime, durationMinutes)
    const dayOfWeek = new Date(date).getDay()

    const newSession = createSession({
      title: title.trim(),
      category: category as any,
      instructorId,
      instructorName,
      studioId,
      studioName: studio?.name || 'Main Studio',
      date,
      dayOfWeek,
      startTime,
      endTime,
      durationMinutes,
      capacity,
      maxWaitlist: 5,
      intensity,
      caloriesEstimate,
      description: description.trim() || undefined,
    })

    toast.success(`Class scheduled: ${title}`)
    onSessionCreated?.(newSession)
    onCreated?.()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Studio Session"
      description="Schedule a class session on the DNA 360 floor."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Class Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reformer Pilates: Sculpt & Stretch"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Category</label>
            <Select value={category} onValueChange={(val: any) => setCategory(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reformer_pilates">Reformer Pilates (Studio)</SelectItem>
                <SelectItem value="reformer_pilates_pt">Reformer Pilates (1-on-1 PT)</SelectItem>
                <SelectItem value="mat_pilates">Mat Pilates</SelectItem>
                <SelectItem value="yoga">Power Yoga & Mobility</SelectItem>
                <SelectItem value="dance_fitness">Dance Fitness</SelectItem>
                <SelectItem value="mma">MMA & Combat</SelectItem>
                <SelectItem value="spinning">Spinning & RPM Cycling</SelectItem>
                <SelectItem value="crossfit">CrossFit / Functional</SelectItem>
                <SelectItem value="hyrox">HYROX Performance</SelectItem>
                <SelectItem value="fitzone">Fitzone Circuit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Lead Coach / Trainer</label>
            <Select value={instructorId} onValueChange={handleInstructorChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usr_trainer_01">Rajesh Poojary (Head Coach)</SelectItem>
                <SelectItem value="usr_trainer_02">Aftab Memon (Head Coach)</SelectItem>
                <SelectItem value="usr_trainer_03">Hemant Shirke (Reformer & Power Yoga Lead)</SelectItem>
                <SelectItem value="usr_trainer_04">Zeebran Shaikh (Functional & Boxing)</SelectItem>
                <SelectItem value="usr_trainer_05">Afzal Shah (Personal Trainer & Nutrition)</SelectItem>
                <SelectItem value="usr_trainer_06">Kunal Chavan (Sports Nutritionist & CPT)</SelectItem>
                <SelectItem value="usr_trainer_07">Mandar Shirke (FMS & Powerlifting Expert)</SelectItem>
                <SelectItem value="usr_trainer_08">Ankur Saravade (Fat Loss Transformation)</SelectItem>
                <SelectItem value="usr_trainer_09">Pramod Sawant (Conditioning Coach)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Studio Room (Powai Flagship)</label>
          <Select value={studioId} onValueChange={handleStudioChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {studios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} (Max {s.capacity || 8})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Duration</label>
            <Select value={String(durationMinutes)} onValueChange={(val) => setDurationMinutes(Number(val))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 Minutes</SelectItem>
                <SelectItem value="60">60 Minutes</SelectItem>
                <SelectItem value="75">75 Minutes</SelectItem>
                <SelectItem value="90">90 Minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Max Capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            required
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Intensity</label>
            <Select value={intensity} onValueChange={(val: any) => setIntensity(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Extreme">Extreme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Est. Calorie Burn"
            type="number"
            value={caloriesEstimate}
            onChange={(e) => setCaloriesEstimate(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Schedule Class
          </Button>
        </div>
      </form>
    </Modal>
  )
}
