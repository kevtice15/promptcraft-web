'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { generateRandomSeed } from '@/lib/utils'

interface CreatePromptModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  onSuccess: () => void
}

const SAMPLERS = [
  'Euler a',
  'Euler',
  'LMS',
  'Heun',
  'DPM2',
  'DPM2 a',
  'DPM++ 2S a',
  'DPM++ 2M',
  'DPM++ SDE',
  'DPM fast',
  'DPM adaptive',
  'LMS Karras',
  'DPM2 Karras',
  'DPM2 a Karras',
  'DPM++ 2S a Karras',
  'DPM++ 2M Karras',
  'DPM++ SDE Karras'
]

const MODELS = [
  'SD 1.5',
  'SD 2.1',
  'SDXL 1.0',
  'Custom Model'
]

const COMMON_SIZES = [
  { label: '512×512', width: 512, height: 512 },
  { label: '768×768', width: 768, height: 768 },
  { label: '512×768 (Portrait)', width: 512, height: 768 },
  { label: '768×512 (Landscape)', width: 768, height: 512 },
  { label: '1024×1024', width: 1024, height: 1024 },
  { label: '832×1216 (Portrait)', width: 832, height: 1216 },
  { label: '1216×832 (Landscape)', width: 1216, height: 832 }
]

export function CreatePromptModal({ isOpen, onClose, groupId, onSuccess }: CreatePromptModalProps) {
  const [formData, setFormData] = useState({
    positivePrompt: '',
    negativePrompt: '',
    notes: '',
    steps: 20,
    cfgScale: 7.0,
    sampler: 'Euler a',
    model: 'SD 1.5',
    seed: '',
    width: 512,
    height: 512
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setFormData({
      positivePrompt: '',
      negativePrompt: '',
      notes: '',
      steps: 20,
      cfgScale: 7.0,
      sampler: 'Euler a',
      model: 'SD 1.5',
      seed: '',
      width: 512,
      height: 512
    })
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          groupId,
          seed: formData.seed ? formData.seed : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create prompt')
        return
      }

      onSuccess()
      handleClose()
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSizeChange = (width: number, height: number) => {
    setFormData({ ...formData, width, height })
  }

  const generateSeed = () => {
    const newSeed = generateRandomSeed()
    setFormData({ ...formData, seed: newSeed.toString() })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Prompt" maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Positive Prompt */}
        <div className="space-y-2">
          <label htmlFor="positivePrompt" className="text-sm font-medium text-gray-700">
            Positive Prompt *
          </label>
          <Textarea
            id="positivePrompt"
            value={formData.positivePrompt}
            onChange={(e) => setFormData({ ...formData, positivePrompt: e.target.value })}
            required
            placeholder="Describe what you want to generate..."
            rows={4}
            className="font-mono text-sm"
            maxLength={5000}
          />
          <div className="text-xs text-gray-500 text-right">
            {formData.positivePrompt.length}/5000
          </div>
        </div>

        {/* Negative Prompt */}
        <div className="space-y-2">
          <label htmlFor="negativePrompt" className="text-sm font-medium text-gray-700">
            Negative Prompt
          </label>
          <Textarea
            id="negativePrompt"
            value={formData.negativePrompt}
            onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
            placeholder="Describe what you want to avoid..."
            rows={3}
            className="font-mono text-sm"
            maxLength={2000}
          />
          <div className="text-xs text-gray-500 text-right">
            {formData.negativePrompt.length}/2000
          </div>
        </div>

        {/* Generation Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="steps" className="text-sm font-medium text-gray-700">
              Steps
            </label>
            <Input
              id="steps"
              type="number"
              min="1"
              max="100"
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: parseInt(e.target.value) || 20 })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cfgScale" className="text-sm font-medium text-gray-700">
              CFG Scale
            </label>
            <Input
              id="cfgScale"
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={formData.cfgScale}
              onChange={(e) => setFormData({ ...formData, cfgScale: parseFloat(e.target.value) || 7.0 })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sampler" className="text-sm font-medium text-gray-700">
              Sampler
            </label>
            <select
              id="sampler"
              value={formData.sampler}
              onChange={(e) => setFormData({ ...formData, sampler: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {SAMPLERS.map(sampler => (
                <option key={sampler} value={sampler}>{sampler}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium text-gray-700">
              Model
            </label>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Dimensions
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMMON_SIZES.map(size => (
              <button
                key={size.label}
                type="button"
                onClick={() => handleSizeChange(size.width, size.height)}
                className={`p-2 text-xs rounded border transition-colors ${
                  formData.width === size.width && formData.height === size.height
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Width"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 512 })}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Height"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 512 })}
              />
            </div>
          </div>
        </div>

        {/* Seed */}
        <div className="space-y-2">
          <label htmlFor="seed" className="text-sm font-medium text-gray-700">
            Seed (optional)
          </label>
          <div className="flex gap-2">
            <Input
              id="seed"
              type="text"
              value={formData.seed}
              onChange={(e) => setFormData({ ...formData, seed: e.target.value })}
              placeholder="Leave empty for random"
              className="font-mono"
            />
            <Button type="button" variant="secondary" onClick={generateSeed}>
              Random
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes
          </label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any notes about this prompt..."
            rows={2}
            maxLength={1000}
          />
          <div className="text-xs text-gray-500 text-right">
            {formData.notes.length}/1000
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Prompt
          </Button>
        </div>
      </form>
    </Modal>
  )
}