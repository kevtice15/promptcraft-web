'use client'

import { useState } from 'react'
import { ImageReference } from '@prisma/client'
import { IMAGE_TYPES } from '@/lib/image-types'
import { Button } from '@/components/ui/button'

interface ImageThumbnailProps {
  image: ImageReference
  size?: 'sm' | 'md' | 'lg'
  onEdit?: (image: ImageReference) => void
  onDelete?: (image: ImageReference) => void
  onClick?: (image: ImageReference) => void
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20', 
  lg: 'w-24 h-24'
}

export function ImageThumbnail({
  image,
  size = 'md',
  onEdit,
  onDelete,
  onClick
}: ImageThumbnailProps) {
  const [showActions, setShowActions] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageTypeConfig = IMAGE_TYPES[image.type as keyof typeof IMAGE_TYPES]
  const showWeight = image.weight !== 1.0

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick(image)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(image)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(image)
    }
  }

  return (
    <div 
      className="relative group cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden rounded-lg border border-gray-200 ${sizeClasses[size]}`}>
        {imageError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          <img
            src={image.thumbnailUrl}
            alt={image.description || `${imageTypeConfig?.label} image`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Type Badge */}
        <div className="absolute top-1 left-1">
          <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-black bg-opacity-75 text-white rounded">
            {imageTypeConfig?.label || image.type}
          </span>
        </div>

        {/* Weight Badge */}
        {showWeight && (
          <div className="absolute top-1 right-1">
            <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
              {image.weight}
            </span>
          </div>
        )}

        {/* Actions Overlay */}
        {showActions && (onEdit || onDelete) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-1">
            {onEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleEdit}
                className="h-6 w-6 p-0 bg-white hover:bg-gray-100"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                className="h-6 w-6 p-0"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tooltip on hover */}
      {image.description && (
        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10 transition-opacity">
          {image.description}
        </div>
      )}
    </div>
  )
}