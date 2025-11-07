'use client'

import { useState, useEffect } from 'react'
import { ImageReference } from '@prisma/client'
import { IMAGE_TYPES, ImageType } from '@/lib/image-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EditImageModalProps {
  image: ImageReference | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedImage: ImageReference) => void
}

export function EditImageModal({
  image,
  isOpen,
  onClose,
  onSave
}: EditImageModalProps) {
  const [type, setType] = useState<ImageType>('reference')
  const [weight, setWeight] = useState(1.0)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (image) {
      setType(image.type as ImageType)
      setWeight(image.weight)
      setDescription(image.description || '')
      setError('')
    }
  }, [image])

  const handleSave = async () => {
    if (!image) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          weight,
          description: description.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update image')
      }

      onSave(data.image)
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (image) {
      setType(image.type as ImageType)
      setWeight(image.weight)
      setDescription(image.description || '')
    }
    setError('')
    onClose()
  }

  if (!isOpen || !image) return null

  const imageTypeConfig = IMAGE_TYPES[type]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Edit Image
                </h3>

                {/* Image Preview */}
                <div className="mb-4">
                  <img
                    src={image.thumbnailUrl}
                    alt={image.description || 'Image preview'}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 mx-auto"
                  />
                  <p className="text-sm text-gray-500 text-center mt-2">
                    {image.originalFileName}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Image Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as ImageType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    >
                      {Object.entries(IMAGE_TYPES).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Suggested weight: {imageTypeConfig.suggestedWeight}
                    </p>
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight: {weight}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={saving}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.1</span>
                      <span>1.0</span>
                      <span>2.0</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this image..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/200 characters
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto sm:ml-3"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}