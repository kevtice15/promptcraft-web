'use client'

import { useState, useEffect } from 'react'
import { ImageReference } from '@prisma/client'
import { ImageThumbnail } from './image-thumbnail'
import { ImageLightbox } from './image-lightbox'
import { EditImageModal } from './edit-image-modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IMAGE_TYPES } from '@/lib/image-types'

interface ImageGalleryProps {
  libraryId: string
}

type ImageWithPrompt = ImageReference & {
  prompt: {
    id: string
    positivePrompt: string
    group: {
      name: string
    }
  }
}

export function ImageGallery({ libraryId }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageWithPrompt[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageWithPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'type'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [editingImage, setEditingImage] = useState<ImageReference | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchImages()
  }, [libraryId])

  useEffect(() => {
    filterAndSortImages()
  }, [images, searchQuery, typeFilter, sortBy, sortOrder])

  const fetchImages = async () => {
    try {
      setLoading(true)
      // This would need a new API endpoint to get all images for a library
      const response = await fetch(`/api/libraries/${libraryId}/images`)
      const data = await response.json()
      
      if (response.ok) {
        setImages(data.images)
      } else {
        setError(data.error || 'Failed to fetch images')
      }
    } catch (error) {
      setError('Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortImages = () => {
    let filtered = [...images]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(image =>
        image.description?.toLowerCase().includes(query) ||
        image.originalFileName.toLowerCase().includes(query) ||
        image.prompt.positivePrompt.toLowerCase().includes(query) ||
        image.prompt.group.name.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(image => image.type === typeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'size':
          aValue = a.fileSize
          bValue = b.fileSize
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredImages(filtered)
  }

  const handleImageClick = (clickedIndex: number) => {
    setLightboxIndex(clickedIndex)
    setLightboxOpen(true)
  }

  const handleImageEdit = (image: ImageReference) => {
    setEditingImage(image)
  }

  const handleImageSave = (updatedImage: ImageReference) => {
    setImages(prev => prev.map(img => 
      img.id === updatedImage.id ? { ...img, ...updatedImage } : img
    ))
    setEditingImage(null)
  }

  const handleImageDelete = async (image: ImageReference) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== image.id))
        setSelectedImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(image.id)
          return newSet
        })
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete image')
      }
    } catch (error) {
      alert('Failed to delete image')
    }
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedImages.size} selected images?`)) return

    const deletePromises = Array.from(selectedImages).map(imageId =>
      fetch(`/api/images/${imageId}`, { method: 'DELETE' })
    )

    try {
      await Promise.all(deletePromises)
      setImages(prev => prev.filter(img => !selectedImages.has(img.id)))
      setSelectedImages(new Set())
    } catch (error) {
      alert('Some images failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading images...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchImages} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Image Gallery</h1>
          <p className="text-gray-600">{filteredImages.length} of {images.length} images</p>
        </div>

        {selectedImages.size > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            Delete Selected ({selectedImages.size})
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search images, descriptions, prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Types</option>
          {Object.entries(IMAGE_TYPES).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-')
            setSortBy(newSortBy as any)
            setSortOrder(newSortOrder as any)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="size-desc">Largest First</option>
          <option value="size-asc">Smallest First</option>
          <option value="type-asc">Type A-Z</option>
          <option value="type-desc">Type Z-A</option>
        </select>
      </div>

      {/* Image Grid */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-600">
            {searchQuery || typeFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Upload some images to your prompts to see them here'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredImages.map((image, index) => (
            <div key={image.id} className="relative">
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.id)}
                  onChange={() => toggleImageSelection(image.id)}
                  className="rounded"
                />
              </div>
              
              <ImageThumbnail
                image={image}
                size="lg"
                onClick={() => handleImageClick(index)}
                onEdit={handleImageEdit}
                onDelete={handleImageDelete}
              />
              
              {/* Image info */}
              <div className="mt-2 text-xs text-gray-600">
                <p className="font-medium truncate">{image.prompt.group.name}</p>
                <p className="truncate">{image.prompt.positivePrompt.substring(0, 50)}...</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {filteredImages.length > 0 && (
        <ImageLightbox
          images={filteredImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Edit Modal */}
      <EditImageModal
        image={editingImage}
        isOpen={!!editingImage}
        onClose={() => setEditingImage(null)}
        onSave={handleImageSave}
      />
    </div>
  )
}