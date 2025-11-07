'use client'

import { useState } from 'react'
import { TemplateAnalysis, getComplexityColor, getComplexityLabel } from '@/lib/wildcard-detector'
import { Button } from '@/components/ui/button'

interface TemplateAnalysisPanelProps {
  analysis: TemplateAnalysis
  isOpen?: boolean
  onToggle?: () => void
}

export function TemplateAnalysisPanel({ 
  analysis, 
  isOpen = false,
  onToggle 
}: TemplateAnalysisPanelProps) {
  if (!analysis.hasTemplate) return null

  const complexityColor = getComplexityColor(analysis.complexity)
  const complexityLabel = getComplexityLabel(analysis.complexity)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h4 className="font-medium text-gray-900">Template Analysis</h4>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${complexityColor}`}>
            {complexityLabel}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {analysis.wildcardCount} wildcard{analysis.wildcardCount !== 1 ? 's' : ''}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Categories */}
          {analysis.categories.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Categories</h5>
              <div className="flex flex-wrap gap-1">
                {analysis.categories.map((category, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Complexity Explanation */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Complexity</h5>
            <div className="text-sm text-gray-600">
              {getComplexityExplanation(analysis.complexity, analysis.wildcardCount)}
            </div>
          </div>

          {/* Detected Wildcards */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Detected Wildcards</h5>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {analysis.wildcards.map((wildcard, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={getWildcardTypeColor(wildcard.type)}>
                      {getWildcardTypeLabel(wildcard.type)}
                    </span>
                    <code className="bg-white px-1 rounded text-xs">
                      {wildcard.text}
                    </code>
                  </div>
                  <span className="text-xs text-gray-500">
                    pos: {wildcard.position}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h5 className="text-sm font-medium text-blue-800 mb-1">Template Tips</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use {'{}'} for variables: {'{character}'}, {'{style}'}</li>
              <li>• Use [] for options: [red|blue|green]</li>
              <li>• Use (()) for emphasis: ((masterpiece))</li>
              <li>• Use &lt;lora:&gt; for model references</li>
              <li>• Use $ for variables: $character_type</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function getComplexityExplanation(complexity: string, count: number): string {
  switch (complexity) {
    case 'simple':
      return `This prompt has ${count} wildcard${count !== 1 ? 's' : ''}, making it a simple template. Easy to understand and modify.`
    case 'moderate':
      return `This prompt has ${count} wildcards, making it moderately complex. Good balance of flexibility and readability.`
    case 'complex':
      return `This prompt has ${count} wildcards, making it highly complex. Very flexible but may be harder to manage.`
    default:
      return 'No wildcards detected in this prompt.'
  }
}

function getWildcardTypeLabel(type: string): string {
  switch (type) {
    case 'curlyBraces':
      return 'Variable'
    case 'squareBrackets':
      return 'Options'
    case 'doubleParens':
      return 'Emphasis'
    case 'loraReferences':
      return 'LoRA'
    case 'dollarVariables':
      return 'Variable'
    default:
      return 'Unknown'
  }
}

function getWildcardTypeColor(type: string): string {
  switch (type) {
    case 'curlyBraces':
      return 'px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs'
    case 'squareBrackets':
      return 'px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs'
    case 'doubleParens':
      return 'px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs'
    case 'loraReferences':
      return 'px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs'
    case 'dollarVariables':
      return 'px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs'
    default:
      return 'px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs'
  }
}