'use client'

import React from 'react'
import {
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertCircle, CheckSquare, Square,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Skeleton } from './skeleton'

/* ============================================================
   DataTable Types
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
  isData?: boolean // True for numeric/code/date columns (renders in Martian Mono)
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  status?: 'loading' | 'success' | 'error' | 'empty'
  sort?: { column: string; direction: 'asc' | 'desc' }
  onSort?: (column: string) => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  errorMessage?: string
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  isFilterActive?: boolean
  onClearFilters?: () => void
  className?: string
  onRowClick?: (row: T) => void
  getRowId?: (row: T) => string
  selectable?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
}

/* ============================================================
   DataTable Component — Aurora Dark-Luxe (§5)
   ============================================================ */

export function DataTable<T>({
  columns,
  data,
  status = 'success',
  sort,
  onSort,
  page = 1,
  pageSize = 15,
  total = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [15, 25, 50],
  errorMessage = 'Something went wrong while retrieving records.',
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  isFilterActive,
  onClearFilters,
  className,
  onRowClick,
  getRowId,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isAllSelected = data.length > 0 && data.every((row, idx) => {
    const id = getRowId ? getRowId(row) : (row as any).id || String(idx)
    return selectedIds.includes(id)
  })

  const getCellValue = (row: T, col: DataTableColumn<T>) => {
    if (col.accessorFn) return col.accessorFn(row)
    if (col.accessorKey) return (row as Record<string, unknown>)[col.accessorKey as string]
    return null
  }

  const renderSortIcon = (col: DataTableColumn<T>) => {
    if (!col.sortable) return null
    if (!sort || sort.column !== col.id) {
      return <ArrowUpDown className="w-3 h-3 ml-1.5 text-[var(--muted-2)]" />
    }
    return sort.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1.5 text-[var(--accent)]" />
      : <ArrowDown className="w-3 h-3 ml-1.5 text-[var(--accent)]" />
  }

  // ─── Loading State ───
  if (status === 'loading') {
    return (
      <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-xl)] overflow-hidden shadow-card backdrop-blur-[4px]', className)}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg-elev)] border-b border-[var(--line)] h-[44px]">
                {selectable && <th className="w-10 px-3" />}
                {columns.map((col) => (
                  <th key={col.id} className="px-5 py-2.5 text-left font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
                    <Skeleton className="h-3 w-16 bg-[var(--surface-2)]" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--line-soft)] last:border-0 h-[54px]">
                  {selectable && <td className="w-10 px-3" />}
                  {columns.map((col) => (
                    <td key={col.id} className="px-5 py-3">
                      <Skeleton className="h-3.5 bg-[var(--surface-2)]" style={{ width: `${50 + (i % 3) * 20}%` }} />
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
      <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-xl)] p-10 flex flex-col items-center justify-center text-center shadow-card', className)}>
        <AlertCircle className="w-7 h-7 text-[var(--accent)] mb-3" />
        <h3 className="font-ui text-sm font-semibold text-[var(--ink)] mb-1">Failed to load data</h3>
        <p className="font-ui text-xs text-[var(--muted)] max-w-sm mb-4">{errorMessage}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
        )}
      </div>
    )
  }

  // ─── Empty State ───
  if (status === 'empty' || (status === 'success' && data.length === 0)) {
    return (
      <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-xl)] py-14 px-6 flex flex-col items-center justify-center text-center shadow-card backdrop-blur-[4px]', className)}>
        <p className="font-ui text-[14px] text-[var(--muted)]">
          {isFilterActive ? 'No records match the active filter criteria.' : emptyTitle}
        </p>
        {emptyDescription && (
          <p className="font-ui text-xs text-[var(--muted-2)] mt-1 max-w-md">
            {emptyDescription}
          </p>
        )}
        {isFilterActive && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="font-ui text-xs text-[var(--accent)] hover:underline mt-2.5 cursor-pointer font-medium"
          >
            Clear active filters
          </button>
        )}
        {!isFilterActive && emptyAction && (
          <Button variant="primary" size="sm" onClick={emptyAction.onClick} className="mt-4">
            {emptyAction.label}
          </Button>
        )}
      </div>
    )
  }

  // ─── Data State ───
  return (
    <div className={cn('w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-xl)] overflow-hidden shadow-card backdrop-blur-[4px]', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--bg-elev)] border-b border-[var(--line)] sticky top-0 z-10 h-[44px]">
              {/* Select All Checkbox Header */}
              {selectable && (
                <th className="w-10 px-3 text-center sticky left-0 bg-[var(--bg-elev)] z-30">
                  <button
                    type="button"
                    onClick={onToggleSelectAll}
                    className="p-1 rounded text-[var(--muted)] hover:text-white transition-colors cursor-pointer"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                    aria-label="Select all rows"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}

              {columns.map((col, colIdx) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-5 py-2.5 font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] select-none whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && 'cursor-pointer hover:text-[var(--ink)] transition-colors',
                    colIdx === 0 && !selectable && 'sticky left-0 bg-[var(--bg-elev)] z-20 shadow-[1px_0_0_var(--line)]'
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
              const rowId = getRowId ? getRowId(row) : (row as any).id || String(rowIndex)
              const isSelected = selectedIds.includes(rowId)

              return (
                <tr
                  key={rowId}
                  className={cn(
                    'group border-b border-[var(--line-soft)] last:border-0 h-[52px] transition-colors duration-140',
                    isSelected ? 'bg-[rgba(59,130,246,0.08)]' : 'hover:bg-[var(--surface-2)]',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Select Row Checkbox */}
                  {selectable && (
                    <td
                      className="w-10 px-3 text-center sticky left-0 bg-[var(--bg)] group-hover:bg-[var(--bg-elev)] z-20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleSelect?.(rowId)}
                        className="p-1 rounded text-[var(--muted)] hover:text-white transition-colors cursor-pointer"
                        aria-label={`Select row ${rowId}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  )}

                  {columns.map((col, colIdx) => {
                    const value = getCellValue(row, col)
                    const rendered = col.cell ? col.cell(value, row) : String(value ?? '')

                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'px-5 py-3 text-[13.5px] leading-[20px] text-[var(--ink)] whitespace-nowrap',
                          col.isData || col.align === 'right' ? 'font-data tabular-nums' : 'font-ui',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                          colIdx === 0 && !selectable && 'sticky left-0 bg-[var(--bg)] group-hover:bg-[var(--bg-elev)] z-10 shadow-[1px_0_0_var(--line)] transition-colors duration-140'
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

      {/* Pagination & Page Size Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 bg-[var(--bg-elev)] border-t border-[var(--line)] text-xs font-ui text-[var(--muted)] gap-3 select-none">
        <div className="flex items-center gap-4">
          <div className="font-data text-[11px] tabular-nums font-medium text-[var(--muted)]">
            Showing <span className="text-[var(--ink)]">{total === 0 ? 0 : ((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)}</span> of <span className="text-[var(--ink)]">{total}</span> records
          </div>

          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 text-[11px] font-ui">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-[#11141D] border border-[var(--line)] text-[var(--ink)] rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-[var(--accent)]"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <span className="font-data text-[11px] px-2 tabular-nums text-[var(--ink-2)] font-medium">
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
        )}
      </div>
    </div>
  )
}

export default DataTable
