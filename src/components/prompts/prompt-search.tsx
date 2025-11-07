'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { debounce } from '@/lib/utils'

interface PromptSearchProps {
  onSearch: (query: string) => void
  onToggleFavorites: (onlyFavorites: boolean) => void
  onToggleTemplates: (onlyTemplates: boolean) => void
  showFavoritesOnly: boolean
  showTemplatesOnly: boolean
  placeholder?: string
}

export function PromptSearch({ 
  onSearch, 
  onToggleFavorites,
  onToggleTemplates,
  showFavoritesOnly,
  showTemplatesOnly,
  placeholder = "Search prompts..." 
}: PromptSearchProps) {
  const [query, setQuery] = useState('')

  // Debounce search to avoid too many API calls
  const debouncedSearch = debounce((searchQuery: string) => {
    onSearch(searchQuery)
  }, 300)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  const handleToggleFavorites = () => {
    onToggleFavorites(!showFavoritesOnly)
  }

  const handleToggleTemplates = () => {
    onToggleTemplates(!showTemplatesOnly)
  }

  return (
    <div className="flex gap-3 items-center">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <Button
        variant={showFavoritesOnly ? "primary" : "secondary"}
        size="sm"
        onClick={handleToggleFavorites}
        className="shrink-0"
      >
        <svg className="w-4 h-4 mr-1" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Favorites
      </Button>

      <Button
        variant={showTemplatesOnly ? "primary" : "secondary"}
        size="sm"
        onClick={handleToggleTemplates}
        className="shrink-0"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Templates
      </Button>
    </div>
  )
}