'use client'

import { useState, useEffect } from 'react'
import { PromptCard } from './prompt-card'
import { Button } from '@/components/ui/button'
import { PromptWithGroup, PromptWithGroupAndImages } from '@/types'

interface PromptListProps {
  groupId?: string
  libraryId?: string
  searchQuery?: string
  onlyFavorites?: boolean
  onlyTemplates?: boolean
  onCreatePrompt: () => void
  onEditPrompt: (prompt: PromptWithGroupAndImages) => void
  onPromptClick?: (prompt: PromptWithGroupAndImages) => void
}

export function PromptList({
  groupId,
  libraryId,
  searchQuery,
  onlyFavorites = false,
  onlyTemplates = false,
  onCreatePrompt,
  onEditPrompt,
  onPromptClick
}: PromptListProps) {
  const [prompts, setPrompts] = useState<PromptWithGroupAndImages[]>([])
  const [loading, setLoading] = useState(true)
  const [copyMessage, setCopyMessage] = useState('')

  const fetchPrompts = async () => {
    try {
      let url = '/api/prompts?'
      
      if (searchQuery && libraryId) {
        // Use search endpoint
        url = `/api/prompts/search?libraryId=${libraryId}&q=${encodeURIComponent(searchQuery)}`
        if (onlyFavorites) {
          url += '&favorites=true'
        }
      } else if (groupId) {
        url += `groupId=${groupId}`
      } else if (libraryId) {
        url += `libraryId=${libraryId}`
        if (onlyFavorites) {
          // For favorites, we'll filter on the client side for now
          // In production, you might want a dedicated API endpoint
        }
      } else {
        return
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        let results = data.prompts
        
        // Client-side filtering for favorites if not using search
        if (onlyFavorites && !searchQuery) {
          results = results.filter((p: PromptWithGroupAndImages) => p.isFavorite)
        }
        
        if (onlyTemplates && !searchQuery) {
          results = results.filter((p: PromptWithGroupAndImages) => p.hasTemplate)
        }
        
        setPrompts(results)
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [groupId, libraryId, searchQuery, onlyFavorites, onlyTemplates])

  const handleToggleFavorite = async (promptId: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite }),
      })

      if (response.ok) {
        setPrompts(prompts.map(p => 
          p.id === promptId ? { ...p, isFavorite } : p
        ))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleDelete = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPrompts(prompts.filter(p => p.id !== promptId))
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage(`${type} copied!`)
      setTimeout(() => setCopyMessage(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopyMessage('Copy failed')
      setTimeout(() => setCopyMessage(''), 2000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Copy notification */}
      {copyMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {copyMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery ? `Search Results for "${searchQuery}"` : 
             onlyFavorites ? 'Favorite Prompts' : 'Prompts'}
          </h2>
          <p className="text-sm text-gray-600">
            {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
          </p>
        </div>
        
        {groupId && (
          <Button onClick={onCreatePrompt}>
            New Prompt
          </Button>
        )}
      </div>

      {/* Prompts */}
      {prompts.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching prompts' :
               onlyFavorites ? 'No favorite prompts yet' : 'No prompts yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try a different search term or check your spelling.' :
               onlyFavorites ? 'Star some prompts to see them here.' :
               groupId ? 'Create your first prompt to get started.' : 'Select a group to view prompts.'}
            </p>
            {groupId && !searchQuery && !onlyFavorites && (
              <Button onClick={onCreatePrompt}>
                Create Your First Prompt
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={onEditPrompt}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onCopy={handleCopy}
              onClick={onPromptClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}