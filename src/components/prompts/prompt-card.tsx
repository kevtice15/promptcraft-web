'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PromptWithGroup, PromptWithGroupAndImages } from '@/types'
import { formatDate, truncateText } from '@/lib/utils'
import { ImageThumbnail } from '@/components/images/image-thumbnail'
import { ImageLightbox } from '@/components/images/image-lightbox'
import { TemplateBadge } from '@/components/templates/template-badge'
import { TemplateAnalysisPanel } from '@/components/templates/template-analysis-panel'
import { analyzeTemplate } from '@/lib/wildcard-detector'

interface PromptCardProps {
  prompt: PromptWithGroupAndImages
  onEdit: (prompt: PromptWithGroupAndImages) => void
  onDelete: (promptId: string) => void
  onToggleFavorite: (promptId: string, isFavorite: boolean) => void
  onCopy: (text: string, type: string) => void
  onClick?: (prompt: PromptWithGroupAndImages) => void
}

export function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
  onClick
}: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showTemplateAnalysis, setShowTemplateAnalysis] = useState(false)

  const handleToggleFavorite = () => {
    onToggleFavorite(prompt.id, !prompt.isFavorite)
  }

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(prompt.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // Auto-cancel after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  const copyPositivePrompt = () => {
    onCopy(prompt.positivePrompt, 'Positive prompt')
  }

  const copyNegativePrompt = () => {
    if (prompt.negativePrompt) {
      onCopy(prompt.negativePrompt, 'Negative prompt')
    }
  }

  const copyAllParameters = () => {
    const params = [
      `Positive: ${prompt.positivePrompt}`,
      prompt.negativePrompt ? `Negative: ${prompt.negativePrompt}` : null,
      `Steps: ${prompt.steps}`,
      `CFG Scale: ${prompt.cfgScale}`,
      `Sampler: ${prompt.sampler}`,
      `Model: ${prompt.model}`,
      prompt.seed ? `Seed: ${prompt.seed}` : null,
      `Size: ${prompt.width}x${prompt.height}`,
      prompt.notes ? `Notes: ${prompt.notes}` : null
    ].filter(Boolean).join('\n')
    
    onCopy(params, 'All parameters')
  }

  const handleImageClick = (clickedIndex: number) => {
    setLightboxIndex(clickedIndex)
    setLightboxOpen(true)
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(prompt)
    }
  }

  // Analyze template (use saved data if available, otherwise analyze on the fly)
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
    <Card className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}>
      <CardHeader className="pb-3">
        <div
          className="flex items-start justify-between"
          onClick={handleCardClick}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {prompt.group.name}
              </Badge>
              {prompt.isFavorite && (
                <div className="text-yellow-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-900 font-mono leading-relaxed">
              {isExpanded ? (
                <div className="space-y-2">
                  <div>
                    <strong className="text-green-700">Positive:</strong>
                    <p className="mt-1 whitespace-pre-wrap">{prompt.positivePrompt}</p>
                  </div>
                  {prompt.negativePrompt && (
                    <div>
                      <strong className="text-red-700">Negative:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{prompt.negativePrompt}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-green-700 font-semibold shrink-0">+</span>
                    <span className="line-clamp-2">{truncateText(prompt.positivePrompt, 150)}</span>
                  </div>
                  {prompt.negativePrompt && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-700 font-semibold shrink-0">-</span>
                      <span className="line-clamp-1 text-gray-600">{truncateText(prompt.negativePrompt, 100)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-1 ml-4">
            {/* Template Badge */}
            {templateAnalysis.hasTemplate && (
              <TemplateBadge
                wildcardCount={templateAnalysis.wildcardCount}
                complexity={templateAnalysis.complexity}
                size="sm"
                showText={false}
              />
            )}
            
            {/* Image Count Badge */}
            {prompt.images && prompt.images.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {prompt.images.length}
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFavorite()
              }}
              className={`p-1 rounded transition-colors ${
                prompt.isFavorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <svg className="w-4 h-4" fill={prompt.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isExpanded && (
          <div className="space-y-4">
            {/* Generation Parameters */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Generation Parameters</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Steps:</span>
                  <span className="ml-1 font-medium">{prompt.steps}</span>
                </div>
                <div>
                  <span className="text-gray-500">CFG:</span>
                  <span className="ml-1 font-medium">{prompt.cfgScale}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sampler:</span>
                  <span className="ml-1 font-medium">{prompt.sampler}</span>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <span className="ml-1 font-medium">{prompt.model}</span>
                </div>
                {prompt.seed && (
                  <div>
                    <span className="text-gray-500">Seed:</span>
                    <span className="ml-1 font-medium font-mono">{prompt.seed.toString()}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Size:</span>
                  <span className="ml-1 font-medium">{prompt.width}×{prompt.height}</span>
                </div>
              </div>
            </div>

            {/* Images */}
            {prompt.images && prompt.images.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Reference Images ({prompt.images.length})</h4>
                <div className="flex gap-2 overflow-x-auto">
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
              <TemplateAnalysisPanel
                analysis={templateAnalysis}
                isOpen={showTemplateAnalysis}
                onToggle={() => setShowTemplateAnalysis(!showTemplateAnalysis)}
              />
            )}

            {/* Notes */}
            {prompt.notes && (
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-700 mb-1">Notes</h4>
                <p className="text-sm text-blue-600 whitespace-pre-wrap">{prompt.notes}</p>
              </div>
            )}

            {/* Copy Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={copyPositivePrompt}>
                Copy Positive
              </Button>
              {prompt.negativePrompt && (
                <Button size="sm" variant="secondary" onClick={copyNegativePrompt}>
                  Copy Negative
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={copyAllParameters}>
                Copy All
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Created {formatDate(new Date(prompt.createdAt))}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => onEdit(prompt)}>
              Edit
            </Button>
            <Button 
              size="sm" 
              variant={showDeleteConfirm ? "destructive" : "ghost"}
              onClick={handleDelete}
            >
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Image Lightbox */}
      {prompt.images && prompt.images.length > 0 && (
        <ImageLightbox
          images={prompt.images}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </Card>
  )
}