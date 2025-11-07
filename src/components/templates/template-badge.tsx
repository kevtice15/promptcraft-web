'use client'

import { getComplexityColor, getComplexityLabel } from '@/lib/wildcard-detector'

interface TemplateBadgeProps {
  wildcardCount: number
  complexity: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1', 
  lg: 'text-sm px-3 py-1.5'
}

export function TemplateBadge({
  wildcardCount,
  complexity,
  size = 'md',
  showText = true
}: TemplateBadgeProps) {
  if (wildcardCount === 0) return null

  const colorClass = getComplexityColor(complexity)
  const sizeClass = sizeClasses[size]
  const complexityLabel = getComplexityLabel(complexity)

  return (
    <div className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClass}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      {showText && (
        <span>
          {wildcardCount} wildcard{wildcardCount !== 1 ? 's' : ''}
          {size !== 'sm' && ` (${complexityLabel})`}
        </span>
      )}
      {!showText && <span>{wildcardCount}</span>}
    </div>
  )
}