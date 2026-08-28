'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Dumbbell, Save } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { saveWorkoutProgram } from '@/lib/trainers'
import type { PTClient, WorkoutProgram, WorkoutDay, ExerciseItem } from '@/types/trainer'
import { toast } from '@/components/app/ui/toast'

export default function ProgramBuilderModal({
  client,
  program,
  open,
  onOpenChange,
  onSaved,
}: {
  client: PTClient | null
  program: WorkoutProgram | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const [title, setTitle] = useState('')
  const [splitType, setSplitType] = useState<WorkoutProgram['splitType']>('PPL')
  const [weeksCount, setWeeksCount] = useState(8)
  const [notes, setNotes] = useState('')
  const [days, setDays] = useState<WorkoutDay[]>([])

  useEffect(() => {
    if (program) {
      setTitle(program.title)
      setSplitType(program.splitType)
      setWeeksCount(program.weeksCount)
      setNotes(program.notes || '')
      setDays(program.days || [])
    } else if (client) {
      setTitle(`${client.name}'s Custom Split`)
      setSplitType('PPL')
      setWeeksCount(8)
      setNotes('Progressive overload focus with 2 RIR reserve.')
      setDays([
        {
          id: 'day_1',
          dayName: 'Day 1: Upper Body Push',
          focus: 'Chest, Shoulders & Triceps',
          exercises: [
            { id: 'ex_1', name: 'Barbell Bench Press', sets: 4, reps: '8-10', weightKg: 70, restSeconds: 90, rpe: 8 },
            { id: 'ex_2', name: 'Incline Dumbbell Flyes', sets: 3, reps: '12', weightKg: 18, restSeconds: 60, rpe: 8 },
          ],
        },
      ])
    }
  }, [program, client, open])

  const handleAddDay = () => {
    const newDay: WorkoutDay = {
      id: `day_${Date.now()}`,
      dayName: `Day ${days.length + 1}: Workout Routine`,
      focus: 'General Conditioning',
      exercises: [
        { id: `ex_${Date.now()}`, name: 'Barbell Exercise', sets: 3, reps: '10-12', weightKg: 50, restSeconds: 60, rpe: 8 },
      ],
    }
    setDays([...days, newDay])
  }

  const handleAddExercise = (dayIndex: number) => {
    const newEx: ExerciseItem = {
      id: `ex_${Date.now()}`,
      name: 'New Exercise',
      sets: 3,
      reps: '10',
      weightKg: 20,
      restSeconds: 60,
      rpe: 8,
    }
    const updatedDays = [...days]
    updatedDays[dayIndex].exercises.push(newEx)
    setDays(updatedDays)
  }

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const updatedDays = [...days]
    updatedDays[dayIndex].exercises.splice(exIndex, 1)
    setDays(updatedDays)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !title.trim()) return

    saveWorkoutProgram({
      id: program?.id || `prog_${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      trainerId: 'usr_trainer_01',
      trainerName: 'Rajesh Poojary',
      title: title.trim(),
      splitType,
      startDate: new Date().toISOString().slice(0, 10),
      weeksCount,
      days,
      notes: notes.trim() || undefined,
    })

    toast.success(`Workout Program Saved: ${title}`)
    if (onSaved) onSaved()
    onOpenChange(false)
  }

  if (!client) return null

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Workout Program Builder"
      description={`Custom programming for ${client.name} (${client.primaryGoal})`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <Input
          label="Program Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Split Template</label>
            <Select value={splitType} onValueChange={(val: any) => setSplitType(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PPL">Push / Pull / Legs (PPL)</SelectItem>
                <SelectItem value="Upper/Lower">Upper / Lower Split</SelectItem>
                <SelectItem value="Full Body">Full Body 3x / Week</SelectItem>
                <SelectItem value="Bro Split">Body Part Focus</SelectItem>
                <SelectItem value="Conditioning">HIIT & Athletic Conditioning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Program Duration (Weeks)"
            type="number"
            value={weeksCount}
            onChange={(e) => setWeeksCount(Number(e.target.value))}
          />
        </div>

        {/* Workout Days List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-[var(--app-text-muted)]">
              Workout Routine Split Days ({days.length})
            </h4>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddDay} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Split Day
            </Button>
          </div>

          {days.map((day, dIdx) => (
            <div key={day.id} className="p-4 rounded-xl glass-input space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={day.dayName}
                  onChange={(e) => {
                    const updated = [...days]
                    updated[dIdx].dayName = e.target.value
                    setDays(updated)
                  }}
                  className="font-bold text-xs bg-transparent text-[var(--app-text-primary)] border-b border-transparent hover:border-[var(--app-glass-border)] focus:outline-none flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddExercise(dIdx)}
                  icon={<Plus className="w-3 h-3" />}
                >
                  Add Exercise
                </Button>
              </div>

              {/* Exercises */}
              <div className="space-y-2">
                {day.exercises.map((ex, eIdx) => (
                  <div key={ex.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <input
                      type="text"
                      placeholder="Exercise Name"
                      value={ex.name}
                      onChange={(e) => {
                        const updated = [...days]
                        updated[dIdx].exercises[eIdx].name = e.target.value
                        setDays(updated)
                      }}
                      className="col-span-5 h-8 px-2 rounded-lg glass-input text-[var(--app-text-primary)]"
                    />
                    <input
                      type="number"
                      placeholder="Sets"
                      value={ex.sets}
                      onChange={(e) => {
                        const updated = [...days]
                        updated[dIdx].exercises[eIdx].sets = Number(e.target.value)
                        setDays(updated)
                      }}
                      className="col-span-2 h-8 px-2 rounded-lg glass-input text-center font-mono text-[var(--app-text-primary)]"
                    />
                    <input
                      type="text"
                      placeholder="Reps"
                      value={ex.reps}
                      onChange={(e) => {
                        const updated = [...days]
                        updated[dIdx].exercises[eIdx].reps = e.target.value
                        setDays(updated)
                      }}
                      className="col-span-2 h-8 px-2 rounded-lg glass-input text-center font-mono text-[var(--app-text-primary)]"
                    />
                    <input
                      type="number"
                      placeholder="kg"
                      value={ex.weightKg}
                      onChange={(e) => {
                        const updated = [...days]
                        updated[dIdx].exercises[eIdx].weightKg = Number(e.target.value)
                        setDays(updated)
                      }}
                      className="col-span-2 h-8 px-2 rounded-lg glass-input text-center font-mono font-bold text-[var(--aurora-1)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(dIdx, eIdx)}
                      className="col-span-1 text-[var(--app-text-muted)] hover:text-[var(--app-danger)] flex justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Input
          label="Coach Instructions & RPE Guidelines"
          placeholder="e.g. Focus on explosive concentric speed and 3 sec eccentric control"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
            Save Workout Program
          </Button>
        </div>
      </form>
    </Modal>
  )
}
