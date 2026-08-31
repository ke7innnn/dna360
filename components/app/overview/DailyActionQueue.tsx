'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Clock, MessageSquare, Phone,
  AlertTriangle, RotateCcw, User, ArrowRight,
  Sparkles, ShieldAlert,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Badge from '@/components/app/ui/badge'
import Button from '@/components/app/ui/button'
import WhatsAppComposeModal from '@/components/app/whatsapp/WhatsAppComposeModal'
import {
  getActionQueue,
  updateActionQueueItem,
  type ActionQueueItem,
  type ActionQueueStatus,
} from '@/lib/action-queue'
import { maskPhoneNumber } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'

export default function DailyActionQueue() {
  const { user } = useAuth()
  const [items, setItems] = useState<ActionQueueItem[]>(() => getActionQueue())
  const [activeTab, setActiveTab] = useState<'pending' | 'done'>('pending')
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [activeWaRecipient, setActiveWaRecipient] = useState<any>(null)

  const refreshQueue = () => {
    setItems(getActionQueue())
  }

  useEffect(() => {
    refreshQueue()
    const handleUpdate = () => refreshQueue()
    window.addEventListener('dna360_action_queue_updated', handleUpdate)
    return () => window.removeEventListener('dna360_action_queue_updated', handleUpdate)
  }, [])

  const pendingItems = items.filter((i) => i.status === 'pending')
  const doneItems = items.filter((i) => i.status === 'done')

  const handleStatusChange = (itemId: string, newStatus: ActionQueueStatus) => {
    const actorName = user?.name || 'Staff'
    const updated = updateActionQueueItem(itemId, newStatus, actorName)
    setItems(updated)

    if (newStatus === 'done') {
      toast.success('Action item completed', {
        description: 'Moved to completed tab',
      })
    } else {
      toast.info('Action item restored to pending queue')
    }
  }

  const handleTriggerWhatsApp = (item: ActionQueueItem) => {
    setActiveWaRecipient({
      memberId: item.memberId || item.id,
      memberName: item.memberName,
      phone: item.phone,
      planName: item.planName,
      expiryDate: item.expiryDate,
      sessionsLeft: item.sessionsLeft,
      daysLeft: 5,
    })
    setWaModalOpen(true)
  }

  const displayedList = activeTab === 'pending' ? pendingItems : doneItems

  return (
    <>
      <Card className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--line)] pb-4 mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
            <h2 className="font-display font-semibold text-base text-[var(--ink)] tracking-tight">
              Daily Operational Action Queue
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.30)] backdrop-blur-md shadow-sm">
              <span className="font-ui text-[11px] font-bold text-[var(--accent)]">
                {pendingItems.length} tasks due today
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              Pending ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`px-3 py-1 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                activeTab === 'done'
                  ? 'bg-[var(--surface-2)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              Completed ({doneItems.length})
            </button>
          </div>
        </div>

        {/* Action Items List */}
        {displayedList.length > 0 ? (
          <div className="space-y-3">
            {displayedList.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-[14px] border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  item.status === 'done'
                    ? 'bg-[rgba(255,255,255,0.015)] border-[rgba(255,255,255,0.04)] opacity-70'
                    : 'bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(59,130,246,0.35)] shadow-sm'
                }`}
              >
                {/* Left: Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`text-[10px] font-ui font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        item.priority === 'CRITICAL'
                          ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]'
                          : item.priority === 'HIGH'
                          ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)]'
                          : 'bg-[rgba(59,130,246,0.15)] text-[#60A5FA] border border-[rgba(59,130,246,0.3)]'
                      }`}
                    >
                      {item.priority}
                    </span>

                    <span className="font-ui font-bold text-sm text-[var(--ink)] tracking-tight">
                      {item.title}
                    </span>

                    <span className="font-data text-xs text-[var(--muted)]">
                      · {item.dueCountdown}
                    </span>
                  </div>

                  <p className="font-ui text-xs text-[var(--muted)] leading-relaxed pl-0.5">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-ui text-[var(--muted)] pt-0.5">
                    <span className="flex items-center gap-1 text-[var(--ink-2)]">
                      <User className="w-3 h-3 text-[var(--accent)]" />
                      Assigned: <strong>{item.assignedTo}</strong> ({item.assignedRole})
                    </span>
                    <span>·</span>
                    <span>Contact: {maskPhoneNumber(item.phone)}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center flex-wrap gap-2 shrink-0 self-start lg:self-center">
                  {item.status === 'pending' ? (
                    <>
                      {/* One-Tap WhatsApp Trigger */}
                      <button
                        onClick={() => handleTriggerWhatsApp(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(37,211,102,0.12)] hover:bg-[#25D366] hover:text-white border border-[rgba(37,211,102,0.25)] text-[#25D366] text-xs font-ui font-semibold transition-all cursor-pointer shadow-sm"
                        title="Send WhatsApp Template with Meta Budget Guard"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Member Profile Link */}
                      {item.memberId && (
                        <Link
                          href={`/members/${item.memberId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[var(--ink-2)] text-xs font-ui font-semibold transition-colors"
                        >
                          <span>Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}

                      {/* Mark as Done */}
                      <button
                        onClick={() => handleStatusChange(item.id, 'done')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(16,185,129,0.12)] hover:bg-[#10B981] hover:text-white border border-[rgba(16,185,129,0.25)] text-[#10B981] text-xs font-ui font-semibold transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </>
                  ) : (
                    /* Restore / Undo Action */
                    <button
                      onClick={() => handleStatusChange(item.id, 'pending')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[var(--ink-2)] text-xs font-ui font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-[var(--muted)]" />
                      <span>Restore to Queue</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[var(--muted)] font-ui border border-dashed border-[var(--line)] rounded-xl">
            {activeTab === 'pending'
              ? '🎉 All action queue items completed for today!'
              : 'No completed tasks yet.'}
          </div>
        )}
      </Card>

      {/* WhatsApp Modal */}
      {activeWaRecipient && (
        <WhatsAppComposeModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          recipient={activeWaRecipient}
        />
      )}
    </>
  )
}
