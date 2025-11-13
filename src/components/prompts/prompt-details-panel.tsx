'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PromptWithGroupAndImages } from '@/types'
import { formatDate } from '@/lib/utils'
import { ImageThumbnail } from '@/components/images/image-thumbnail'
import { ImageLightbox } from '@/components/images/image-lightbox'
import { TemplateBadge } from '@/components/templates/template-badge'
import { TemplateAnalysisPanel } from '@/components/templates/template-analysis-panel'
import { analyzeTemplate } from '@/lib/wildcard-detector'

interface PromptDetailsPanelProps {
  prompt: PromptWithGroupAndImages | null
  onClose: () => void
  onUpdate: () => void
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
  'DPM++ SDE Karras',
  'DDIM',
  'PLMS'
]

const MODELS = [
  'SD 1.5',
  'SD 2.1',
  'SDXL 1.0',
  'Custom Model'
]

const DIMENSION_PRESETS = [
  { width: 512, height: 512, label: '512×512 (Square)' },
  { width: 768, height: 768, label: '768×768 (Square)' },
  { width: 1024, height: 1024, label: '1024×1024 (Square)' },
  { width: 512, height: 768, label: '512×768 (Portrait)' },
  { width: 768, height: 512, label: '768×512 (Landscape)' },
  { width: 1024, height: 768, label: '1024×768 (Landscape)' },
  { width: 768, height: 1024, label: '768×1024 (Portrait)' },
]

export function PromptDetailsPanel({ prompt, onClose, onUpdate }: PromptDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showTemplateAnalysis, setShowTemplateAnalysis] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')

  // Form state
  const [positivePrompt, setPositivePrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [notes, setNotes] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [steps, setSteps] = useState(20)
  const [cfgScale, setCfgScale] = useState(7.0)
  const [sampler, setSampler] = useState('Euler a')
  const [model, setModel] = useState('SD 1.5')
  const [seed, setSeed] = useState('')
  const [width, setWidth] = useState(512)
  const [height, setHeight] = useState(512)

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      setPositivePrompt(prompt.positivePrompt)
      setNegativePrompt(prompt.negativePrompt || '')
      setNotes(prompt.notes || '')
      setIsFavorite(prompt.isFavorite)
      setSteps(prompt.steps)
      setCfgScale(prompt.cfgScale)
      setSampler(prompt.sampler)
      setModel(prompt.model)
      setSeed(prompt.seed ? prompt.seed.toString() : '')
      setWidth(prompt.width)
      setHeight(prompt.height)
      setIsEditing(false)
    }
  }, [prompt])

  if (!prompt) {
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positivePrompt,
          negativePrompt: negativePrompt || null,
          notes: notes || null,
          isFavorite,
          steps: parseInt(steps.toString()),
          cfgScale: parseFloat(cfgScale.toString()),
          sampler,
          model,
          seed: seed ? seed : null,
          width: parseInt(width.toString()),
          height: parseInt(height.toString()),
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update prompt')
      }
    } catch (error) {
      console.error('Failed to save prompt:', error)
      alert('Failed to save prompt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setPositivePrompt(prompt.positivePrompt)
    setNegativePrompt(prompt.negativePrompt || '')
    setNotes(prompt.notes || '')
    setIsFavorite(prompt.isFavorite)
    setSteps(prompt.steps)
    setCfgScale(prompt.cfgScale)
    setSampler(prompt.sampler)
    setModel(prompt.model)
    setSeed(prompt.seed ? prompt.seed.toString() : '')
    setWidth(prompt.width)
    setHeight(prompt.height)
    setIsEditing(false)
  }

  const handleToggleFavorite = async () => {
    try {
      const newFavoriteStatus = !isFavorite
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: newFavoriteStatus }),
      })

      if (response.ok) {
        setIsFavorite(newFavoriteStatus)
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage(`${type} copied!`)
      setTimeout(() => setCopyMessage(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 2147483647)
    setSeed(randomSeed.toString())
  }

  const handleImageClick = (clickedIndex: number) => {
    setLightboxIndex(clickedIndex)
    setLightboxOpen(true)
  }

  const applyDimensionPreset = (presetWidth: number, presetHeight: number) => {
    setWidth(presetWidth)
    setHeight(presetHeight)
  }

  // Analyze template
  const templateAnalysis = prompt.hasTemplate
    ? {
        hasTemplate: prompt.hasTemplate,
        wildcardCount: prompt.wildcardCount,
        complexity: prompt.templateMetadata?.complexity || 'simple',
        wildcards: prompt.templateMetadata?.wildcards || [],
        categories: prompt.templateMetadata?.categories || []
      }
    : analyzeTemplate(prompt.positivePrompt)

  return (
    <>
      {/* Copy notification */}
      {copyMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {copyMessage}
        </div>
      )}

      {/* Side Panel */}
      <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-40">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">Prompt Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {prompt.group.name}
            </Badge>
            {templateAnalysis.hasTemplate && (
              <TemplateBadge
                wildcardCount={templateAnalysis.wildcardCount}
                complexity={templateAnalysis.complexity}
                size="sm"
              />
            )}
            {prompt.images && prompt.images.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {prompt.images.length}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleToggleFavorite}
                  >
                    {isFavorite ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 fill-yellow-500" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Unfavorite
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Favorite
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={handleSave} loading={isSaving}>
                    Save Changes
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {!isEditing && (
              <div className="text-xs text-gray-500">
                Created {formatDate(new Date(prompt.createdAt))}
              </div>
            )}
          </div>

          {/* Positive Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Positive Prompt *
            </label>
            {isEditing ? (
              <Textarea
                value={positivePrompt}
                onChange={(e) => setPositivePrompt(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="Enter your positive prompt..."
              />
            ) : (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-mono whitespace-pre-wrap text-gray-900">
                  {positivePrompt}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(positivePrompt, 'Positive prompt')}
                  className="mt-2"
                >
                  Copy
                </Button>
              </div>
            )}
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Negative Prompt
            </label>
            {isEditing ? (
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={4}
                className="font-mono text-sm"
                placeholder="Enter negative prompt (optional)..."
              />
            ) : negativePrompt ? (
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm font-mono whitespace-pre-wrap text-gray-900">
                  {negativePrompt}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(negativePrompt, 'Negative prompt')}
                  className="mt-2"
                >
                  Copy
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No negative prompt</p>
            )}
          </div>

          {/* Generation Parameters */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Generation Parameters</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Steps */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Steps
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value) || 20)}
                    min="1"
                    max="100"
                  />
                ) : (
                  <p className="text-sm text-gray-900 font-medium">{steps}</p>
                )}
              </div>

              {/* CFG Scale */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  CFG Scale
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={cfgScale}
                    onChange={(e) => setCfgScale(parseFloat(e.target.value) || 7.0)}
                    min="1"
                    max="20"
                    step="0.5"
                  />
                ) : (
                  <p className="text-sm text-gray-900 font-medium">{cfgScale}</p>
                )}
              </div>

              {/* Sampler */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sampler
                </label>
                {isEditing ? (
                  <select
                    value={sampler}
                    onChange={(e) => setSampler(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SAMPLERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 font-medium">{sampler}</p>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Model
                </label>
                {isEditing ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 font-medium">{model}</p>
                )}
              </div>
            </div>

            {/* Seed */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Seed
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Random"
                    className="font-mono"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={generateRandomSeed}
                  >
                    Random
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-900 font-mono font-medium">
                  {seed || 'Random'}
                </p>
              )}
            </div>

            {/* Dimensions */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dimensions
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 512)}
                      min="64"
                      max="2048"
                      step="64"
                      placeholder="Width"
                    />
                    <span className="flex items-center text-gray-500">×</span>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 512)}
                      min="64"
                      max="2048"
                      step="64"
                      placeholder="Height"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {DIMENSION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyDimensionPreset(preset.width, preset.height)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-900 font-medium">
                  {width} × {height}
                </p>
              )}
            </div>
          </div>

          {/* Reference Images */}
          {prompt.images && prompt.images.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Reference Images ({prompt.images.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {prompt.images.map((image, index) => (
                  <ImageThumbnail
                    key={image.id}
                    image={image}
                    size="lg"
                    onClick={() => handleImageClick(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Template Analysis */}
          {templateAnalysis.hasTemplate && (
            <div className="border-t border-gray-200 pt-6">
              <TemplateAnalysisPanel
                analysis={templateAnalysis}
                isOpen={showTemplateAnalysis}
                onToggle={() => setShowTemplateAnalysis(!showTemplateAnalysis)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            {isEditing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about this prompt..."
              />
            ) : notes ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap text-gray-900">
                  {notes}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No notes</p>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {prompt.images && prompt.images.length > 0 && (
        <ImageLightbox
          images={prompt.images}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
