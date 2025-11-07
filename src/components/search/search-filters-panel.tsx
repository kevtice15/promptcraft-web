'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SearchFilters } from '@/types/search'
import { DateRangePicker } from './date-range-picker'
import { ParameterRangeSlider } from './parameter-range-slider'
import { IMAGE_TYPES } from '@/lib/image-types'

interface SearchFiltersPanelProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onApply: () => void
  onClear: () => void
  onSave: () => void
  suggestions?: {
    models: string[]
    samplers: string[]
    imageTypes: string[]
  }
}

export function SearchFiltersPanel({
  filters,
  onChange,
  onApply,
  onClear,
  onSave,
  suggestions = { models: [], samplers: [], imageTypes: [] }
}: SearchFiltersPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['text']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onChange({ ...filters, [key]: value })
  }

  const Section = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => {
    const isExpanded = expandedSections.has(id)
    
    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">{title}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="p-3 pt-0">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear All
        </Button>
      </div>

      {/* Text Search */}
      <Section id="text" title="Text Search">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <Input
              value={filters.query || ''}
              onChange={(e) => updateFilter('query', e.target.value)}
              placeholder="Search in prompts, notes, groups..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.favoritesOnly || false}
                onChange={(e) => updateFilter('favoritesOnly', e.target.checked)}
              />
              <span className="text-sm">Favorites only</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.templatesOnly || false}
                onChange={(e) => updateFilter('templatesOnly', e.target.checked)}
              />
              <span className="text-sm">Templates only</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasImages || false}
                onChange={(e) => updateFilter('hasImages', e.target.checked)}
              />
              <span className="text-sm">Has images</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasNegativePrompt || false}
                onChange={(e) => updateFilter('hasNegativePrompt', e.target.checked)}
              />
              <span className="text-sm">Has negative prompt</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasNotes || false}
                onChange={(e) => updateFilter('hasNotes', e.target.checked)}
              />
              <span className="text-sm">Has notes</span>
            </label>
          </div>
        </div>
      </Section>

      {/* Date Filters */}
      <Section id="dates" title="Date Filters">
        <div className="space-y-4">
          <DateRangePicker
            label="Created Date"
            from={filters.createdAfter}
            to={filters.createdBefore}
            onChange={(from, to) => {
              updateFilter('createdAfter', from)
              updateFilter('createdBefore', to)
            }}
          />
          
          <DateRangePicker
            label="Modified Date"
            from={filters.modifiedAfter}
            to={filters.modifiedBefore}
            onChange={(from, to) => {
              updateFilter('modifiedAfter', from)
              updateFilter('modifiedBefore', to)
            }}
          />
        </div>
      </Section>

      {/* Generation Parameters */}
      <Section id="parameters" title="Generation Parameters">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Models
            </label>
            <select
              multiple
              value={filters.models || []}
              onChange={(e) => updateFilter('models', Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              size={Math.min(suggestions.models.length, 4)}
            >
              {suggestions.models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Samplers
            </label>
            <select
              multiple
              value={filters.samplers || []}
              onChange={(e) => updateFilter('samplers', Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              size={Math.min(suggestions.samplers.length, 4)}
            >
              {suggestions.samplers.map(sampler => (
                <option key={sampler} value={sampler}>{sampler}</option>
              ))}
            </select>
          </div>

          <ParameterRangeSlider
            label="Steps"
            min={1}
            max={100}
            value={[filters.stepsMin || 1, filters.stepsMax || 100]}
            onChange={([min, max]) => {
              updateFilter('stepsMin', min === 1 ? undefined : min)
              updateFilter('stepsMax', max === 100 ? undefined : max)
            }}
          />

          <ParameterRangeSlider
            label="CFG Scale"
            min={1}
            max={20}
            step={0.5}
            value={[filters.cfgMin || 1, filters.cfgMax || 20]}
            onChange={([min, max]) => {
              updateFilter('cfgMin', min === 1 ? undefined : min)
              updateFilter('cfgMax', max === 20 ? undefined : max)
            }}
          />
        </div>
      </Section>

      {/* Image Filters */}
      <Section id="images" title="Image Filters">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Types
            </label>
            <div className="space-y-1">
              {Object.entries(IMAGE_TYPES).map(([type, config]) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.imageTypes?.includes(type) || false}
                    onChange={(e) => {
                      const current = filters.imageTypes || []
                      if (e.target.checked) {
                        updateFilter('imageTypes', [...current, type])
                      } else {
                        updateFilter('imageTypes', current.filter(t => t !== type))
                      }
                    }}
                  />
                  <span className="text-sm">{config.label}</span>
                </label>
              ))}
            </div>
          </div>

          <ParameterRangeSlider
            label="Image Count"
            min={0}
            max={10}
            value={[filters.imageCountMin || 0, filters.imageCountMax || 10]}
            onChange={([min, max]) => {
              updateFilter('imageCountMin', min === 0 ? undefined : min)
              updateFilter('imageCountMax', max === 10 ? undefined : max)
            }}
          />
        </div>
      </Section>

      {/* Template Filters */}
      <Section id="templates" title="Template Filters">
        <div className="space-y-4">
          <ParameterRangeSlider
            label="Wildcard Count"
            min={0}
            max={20}
            value={[filters.wildcardCountMin || 0, filters.wildcardCountMax || 20]}
            onChange={([min, max]) => {
              updateFilter('wildcardCountMin', min === 0 ? undefined : min)
              updateFilter('wildcardCountMax', max === 20 ? undefined : max)
            }}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Complexity
            </label>
            <div className="space-y-1">
              {['simple', 'moderate', 'complex'].map(complexity => (
                <label key={complexity} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.templateComplexity?.includes(complexity as any) || false}
                    onChange={(e) => {
                      const current = filters.templateComplexity || []
                      if (e.target.checked) {
                        updateFilter('templateComplexity', [...current, complexity as any])
                      } else {
                        updateFilter('templateComplexity', current.filter(c => c !== complexity))
                      }
                    }}
                  />
                  <span className="text-sm capitalize">{complexity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Sorting */}
      <Section id="sorting" title="Sorting">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Modified Date</option>
              <option value="positivePrompt">Prompt Text</option>
              <option value="wildcardCount">Wildcard Count</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
        <Button onClick={onApply} className="w-full">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={onSave} className="w-full">
          Save Search
        </Button>
      </div>
    </div>
  )
}