'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Button } from './button'
import { Skeleton, SkeletonRow } from './skeleton'
import { EmptyState } from './empty-state'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/* ============================================================
   Types
   ============================================================ */

export interface DataTableColumn<T> {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => React.ReactNode
  cell?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  status: 'loading' | 'success' | 'error' | 'empty'
  /** Current sort */
  sort?: { column: string; direction: 'asc' | 'desc' }
  onSort?: (column: string) => void
  /** Pagination */
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  /** Error */
  errorMessage?: string
  onRetry?: () => void
  /** Empty */
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  /** Filter empty */
  isFilterActive?: boolean
  onClearFilters?: () => void
  /** Class */
  className?: string
  /** Row click */
  onRowClick?: (row: T) => void
  /** Row key */
  getRowId?: (row: T) => string
}

/* ============================================================
   Component
   ============================================================ */

export function DataTable<T>({
  columns,
  data,
  status,
  sort,
  onSort,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  errorMessage = 'Something went wrong. Please try again.',
  onRetry,
  emptyTitle = 'No data yet',
  emptyDescription,
  emptyAction,
  isFilterActive,
  onClearFilters,
  className,
  onRowClick,
  getRowId,
}: DataTableProps<T>) {
  const prefersReducedMotion = useReducedMotion()
  const totalPages = Math.ceil(total / pageSize)

  const getCellValue = (row: T, col: DataTableColumn<T>) => {
    if (col.accessorFn) return col.accessorFn(row)
    if (col.accessorKey) return (row as Record<string, unknown>)[col.accessorKey as string]
    return null
  }

  const renderSortIcon = (col: DataTableColumn<T>) => {
    if (!col.sortable) return null
    if (!sort || sort.column !== col.id) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-[var(--app-text-muted)]" />
    }
    return sort.direction === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-[var(--aurora-1)]" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-[var(--aurora-1)]" />
  }

  // ─── Loading State ───
  if (status === 'loading') {
    return (
      <div className={cn('glass-card overflow-hidden', className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)]">
                {columns.map((col) => (
                  <th key={col.id} className="px-4 py-3 text-left">
                    <Skeleton className="h-3.5 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--app-glass-border)] last:border-0">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3">
                      <Skeleton className="h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ─── Error State ───
  if (status === 'error') {
    return (
      <div className={cn('glass-card flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
        <div className="w-14 h-14 rounded-2xl bg-[var(--app-danger)]/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-[var(--app-danger)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--app-text-primary)] mb-1">
          Failed to load data
        </h3>
        <p className="text-sm text-[var(--app-text-muted)] max-w-sm mb-4">
          {errorMessage}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  // ─── Empty State ───
  if (status === 'empty' || (status === 'success' && data.length === 0)) {
    // Check if it's a filter-empty vs truly-empty
    if (isFilterActive) {
      return (
        <EmptyState
          title="No results found"
          description="Try adjusting your filters or search terms."
          action={onClearFilters ? { label: 'Clear filters', onClick: onClearFilters } : undefined}
          className={className}
        />
      )
    }

    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    )
  }

  // ─── Data State ───
  const MotionTr = prefersReducedMotion ? 'tr' : motion.tr

  return (
    <div className={cn('glass-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--app-glass-border)]">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--app-text-muted)]',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--app-text-secondary)] transition-colors',
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onSort?.(col.id)}
                  role={col.sortable ? 'columnheader' : undefined}
                  aria-sort={
                    sort?.column === col.id
                      ? sort.direction === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {renderSortIcon(col)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              const rowId = getRowId ? getRowId(row) : String(rowIndex)
              const trProps = prefersReducedMotion
                ? {}
                : {
                    variants: staggerItem,
                    initial: 'hidden',
                    animate: 'visible',
                    custom: Math.min(rowIndex, 10), // cap stagger at 10
                    transition: { delay: Math.min(rowIndex, 10) * 0.025 },
                  }

              return (
                <MotionTr
                  key={rowId}
                  className={cn(
                    'border-b border-[var(--app-glass-border)] last:border-0 hover:bg-[var(--app-glass-bg)] transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                  {...trProps}
                >
                  {columns.map((col) => {
                    const value = getCellValue(row, col)
                    const rendered = col.cell ? col.cell(value, row) : String(value ?? '')

                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-3 text-sm text-[var(--app-text-secondary)]',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right tabular-nums',
                        )}
                      >
                        {rendered}
                      </td>
                    )
                  })}
                </MotionTr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--app-glass-border)]">
          <p className="text-xs text-[var(--app-text-muted)] tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-sm text-[var(--app-text-secondary)] tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
