'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DateRangePickerProps {
  from?: Date
  to?: Date
  onChange: (from?: Date, to?: Date) => void
  label?: string
}

export function DateRangePicker({
  from,
  to,
  onChange,
  label = "Date Range"
}: DateRangePickerProps) {
  const [fromDate, setFromDate] = useState(from ? formatDate(from) : '')
  const [toDate, setToDate] = useState(to ? formatDate(to) : '')

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined
    const date = new Date(dateString + 'T00:00:00')
    return isNaN(date.getTime()) ? undefined : date
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromDate(value)
    const parsedDate = parseDate(value)
    onChange(parsedDate, to)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setToDate(value)
    const parsedDate = parseDate(value)
    onChange(from, parsedDate)
  }

  const setPreset = (days: number) => {
    const now = new Date()
    const start = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    const startFormatted = formatDate(start)
    const endFormatted = formatDate(now)
    
    setFromDate(startFormatted)
    setToDate(endFormatted)
    onChange(start, now)
  }

  const clearDates = () => {
    setFromDate('')
    setToDate('')
    onChange(undefined, undefined)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset(1)}
        >
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset(7)}
        >
          Last 7 days
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset(30)}
        >
          Last 30 days
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset(90)}
        >
          Last 90 days
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearDates}
        >
          Clear
        </Button>
      </div>

      {/* Date inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            From
          </label>
          <Input
            type="date"
            value={fromDate}
            onChange={handleFromChange}
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            To
          </label>
          <Input
            type="date"
            value={toDate}
            onChange={handleToChange}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  )
}