'use client'

import { useState, useEffect, useRef } from 'react'
import { ImageReference } from '@prisma/client'
import { IMAGE_TYPES } from '@/lib/image-types'
import { Button } from '@/components/ui/button'

interface ImageLightboxProps {
  images: ImageReference[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [showMetadata, setShowMetadata] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  const currentImage = images[currentIndex]

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setZoom(1)
  }, [initialIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case '+':
        case '=':
          e.preventDefault()
          setZoom(prev => Math.min(prev * 1.5, 5))
          break
        case '-':
          e.preventDefault()
          setZoom(prev => Math.max(prev / 1.5, 0.5))
          break
        case '0':
          e.preventDefault()
          setZoom(1)
          break
        case 'i':
          e.preventDefault()
          setShowMetadata(prev => !prev)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, images.length])

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
    setZoom(1)
  }

  const goToNext = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
    setZoom(1)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  if (!isOpen || !currentImage) return null

  const imageTypeConfig = IMAGE_TYPES[currentImage.type as keyof typeof IMAGE_TYPES]

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {currentIndex + 1} of {images.length}
          </span>
          <span className="text-sm opacity-75">
            {currentImage.originalFileName}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </Button>
          
          <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomReset}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            1:1
          </Button>

          {/* Info Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMetadata(!showMetadata)}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 h-12 w-12 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 h-12 w-12 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </>
      )}

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center overflow-hidden max-h-full max-w-full">
        <img
          ref={imageRef}
          src={currentImage.originalUrl}
          alt={currentImage.description || `${imageTypeConfig?.label} image`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      {/* Metadata Panel */}
      {showMetadata && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="opacity-75">Type:</span>
              <div className="font-medium">{imageTypeConfig?.label}</div>
            </div>
            <div>
              <span className="opacity-75">Weight:</span>
              <div className="font-medium">{currentImage.weight}</div>
            </div>
            <div>
              <span className="opacity-75">Dimensions:</span>
              <div className="font-medium">{currentImage.width} × {currentImage.height}</div>
            </div>
            <div>
              <span className="opacity-75">Size:</span>
              <div className="font-medium">{(currentImage.fileSize / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            {currentImage.description && (
              <div className="col-span-2 md:col-span-4">
                <span className="opacity-75">Description:</span>
                <div className="font-medium">{currentImage.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 right-4 text-white text-xs opacity-50">
        <div>ESC: Close • ←→: Navigate • +/-: Zoom • I: Info</div>
      </div>
    </div>
  )
}