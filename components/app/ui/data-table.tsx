'use client'

import React from 'react'
import {
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Skeleton } from './skeleton'

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
  sticky?: boolean
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  status?: 'loading' | 'success' | 'error' | 'empty'
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
  status = 'success',
  sort,
  onSort,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  errorMessage = 'Something went wrong. Please try again.',
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  isFilterActive,
  onClearFilters,
  className,
  onRowClick,
  getRowId,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize)

  const getCellValue = (row: T, col: DataTableColumn<T>) => {
    if (col.accessorFn) return col.accessorFn(row)
    if (col.accessorKey) return (row as Record<string, unknown>)[col.accessorKey as string]
    return null
  }

  const renderSortIcon = (col: DataTableColumn<T>) => {
    if (!col.sortable) return null
    if (!sort || sort.column !== col.id) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-[var(--text-faint)]" />
    }
    return sort.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-[var(--teal)]" />
      : <ArrowDown className="w-3 h-3 ml-1 text-[var(--teal)]" />
  }

  // ─── Loading State ───
  if (status === 'loading') {
    return (
      <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]', className)}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface-sunken)] border-b border-[var(--line)] h-[40px]">
                {columns.map((col) => (
                  <th key={col.id} className="px-4 py-2 text-left font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--line)] last:border-0 h-[44px]">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-2.5">
                      <Skeleton className="h-3.5" style={{ width: `${50 + (i % 3) * 20}%` }} />
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
      <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-8 flex flex-col items-center justify-center text-center', className)}>
        <AlertCircle className="w-6 h-6 text-[var(--danger)] mb-2" />
        <h3 className="font-ui text-sm font-semibold text-[var(--text)] mb-1">Failed to load table data</h3>
        <p className="font-ui text-xs text-[var(--text-muted)] max-w-sm mb-4">{errorMessage}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
        )}
      </div>
    )
  }

  // ─── Empty State ───
  if (status === 'empty' || (status === 'success' && data.length === 0)) {
    return (
      <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] py-12 px-6 flex flex-col items-center justify-center text-center', className)}>
        <p className="font-ui text-[13.5px] text-[var(--text-muted)]">
          {isFilterActive
            ? 'No records match these filters.'
            : emptyTitle}
        </p>
        {isFilterActive && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="font-ui text-xs text-[var(--teal)] hover:underline mt-2 cursor-pointer"
          >
            Clear filters
          </button>
        )}
        {!isFilterActive && emptyAction && (
          <Button variant="secondary" size="sm" onClick={emptyAction.onClick} className="mt-3">
            {emptyAction.label}
          </Button>
        )}
      </div>
    )
  }

  // ─── Data State ───
  return (
    <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--surface-sunken)] border-b border-[var(--line)] sticky top-0 z-10 h-[40px]">
              {columns.map((col, colIdx) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-4 py-2 font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)] select-none whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && 'cursor-pointer hover:text-[var(--text)] transition-colors',
                    colIdx === 0 && 'sticky left-0 bg-[var(--surface-sunken)] z-20 shadow-[1px_0_0_var(--line)]'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onSort?.(col.id)}
                  role={col.sortable ? 'columnheader' : undefined}
                >
                  <span className={cn('inline-flex items-center', col.align === 'right' && 'justify-end w-full')}>
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

              return (
                <tr
                  key={rowId}
                  className={cn(
                    'group border-b border-[var(--line)] last:border-0 h-[44px] transition-colors duration-140',
                    'hover:bg-[var(--surface-raised)]',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIdx) => {
                    const value = getCellValue(row, col)
                    const rendered = col.cell ? col.cell(value, row) : String(value ?? '')

                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-2.5 font-ui text-[13.5px] leading-[20px] text-[var(--text)] whitespace-nowrap',
                          col.align === 'right' ? 'text-right font-data tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left',
                          colIdx === 0 && 'sticky left-0 bg-[var(--surface)] group-hover:bg-[var(--surface-raised)] z-10 shadow-[1px_0_0_var(--line)] transition-colors duration-140'
                        )}
                      >
                        {rendered}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-sunken)] border-t border-[var(--line)] text-xs font-ui text-[var(--text-muted)] select-none">
          <div className="font-data tabular-nums">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <span className="font-data px-2 tabular-nums text-[var(--text)]">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
