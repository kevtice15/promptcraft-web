'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImageType, IMAGE_TYPES, validateImage } from '@/lib/image-types'

interface ImageUploadZoneProps {
  promptId: string
  existingImageCount: number
  maxImages?: number
  onUploadComplete: (image: any) => void
  onUploadError: (error: string) => void
}

export function ImageUploadZone({
  promptId,
  existingImageCount,
  maxImages = 5,
  onUploadComplete,
  onUploadError
}: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState<{ [key: string]: number }>({})
  const [selectedType, setSelectedType] = useState<ImageType>('reference')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canUploadMore = existingImageCount < maxImages

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!canUploadMore) {
      onUploadError('Maximum number of images reached')
      return
    }

    const filesToUpload = Array.from(files).slice(0, maxImages - existingImageCount)

    for (const file of filesToUpload) {
      const uploadId = Math.random().toString(36).substring(2)
      
      try {
        setUploading(prev => ({ ...prev, [uploadId]: 0 }))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('promptId', promptId)
        formData.append('type', selectedType)

        const response = await fetch('/api/images', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        setUploading(prev => {
          const newState = { ...prev }
          delete newState[uploadId]
          return newState
        })

        onUploadComplete(data.image)

      } catch (error: any) {
        setUploading(prev => {
          const newState = { ...prev }
          delete newState[uploadId]
          return newState
        })
        onUploadError(error.message)
      }
    }
  }, [promptId, selectedType, canUploadMore, existingImageCount, maxImages, onUploadComplete, onUploadError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!canUploadMore) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [canUploadMore, handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  const handleClick = useCallback(() => {
    if (canUploadMore && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [canUploadMore])

  const isUploading = Object.keys(uploading).length > 0

  if (!canUploadMore && !isUploading) {
    return (
      <div className="text-center py-4 px-6 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">
          Maximum {maxImages} images reached
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Image Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as ImageType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(IMAGE_TYPES).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label} (weight: {config.suggestedWeight})
            </option>
          ))}
        </select>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${!canUploadMore ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!canUploadMore}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">
              Uploading {Object.keys(uploading).length} image(s)...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Drop images here or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WebP, AVIF up to 10MB each
              </p>
              <p className="text-xs text-gray-500">
                {existingImageCount}/{maxImages} images used
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}