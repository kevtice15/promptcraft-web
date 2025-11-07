'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { GroupsSidebar } from '@/components/groups/groups-sidebar'
import { PromptList } from '@/components/prompts/prompt-list'
import { PromptSearch } from '@/components/prompts/prompt-search'
import { CreatePromptModal } from '@/components/prompts/create-prompt-modal'
import { EditPromptModal } from '@/components/prompts/edit-prompt-modal'
import { LibrarySharingPanel } from '@/components/sharing/library-sharing-panel'
import { SessionUser, LibraryWithGroups, PromptWithGroup } from '@/types'

export default function LibraryPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [library, setLibrary] = useState<LibraryWithGroups | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showTemplatesOnly, setShowTemplatesOnly] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptWithGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [libraryAccessible, setLibraryAccessible] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'prompts' | 'sharing'>('prompts')
  const [isOwner, setIsOwner] = useState(false)

  const libraryId = params.libraryId as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        let userData = null

        // Get current user
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          userData = await userResponse.json()
          setUser(userData.user)
        }

        // Get library data
        const libraryResponse = await fetch(`/api/libraries/${libraryId}`)
        if (libraryResponse.ok) {
          const libraryData = await libraryResponse.json()
          setLibrary(libraryData.library)
          // Check if current user is the owner
          if (userData?.user) {
            setIsOwner(libraryData.library.ownerId === userData.user.id)
          }
          // Mark library as accessible once we successfully fetch it
          setLibraryAccessible(true)
        } else if (libraryResponse.status === 401 || libraryResponse.status === 403) {
          router.push(`/library/${libraryId}/unlock`)
          return
        } else if (libraryResponse.status === 404) {
          router.push('/')
          return
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [libraryId, router])

  const handleLibrarySwitch = () => {
    router.push('/')
  }

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId)
    setSearchQuery('')
    setShowFavoritesOnly(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query) {
      setSelectedGroupId(undefined) // Clear group selection when searching
    }
  }

  const handleToggleFavorites = (onlyFavorites: boolean) => {
    setShowFavoritesOnly(onlyFavorites)
    if (onlyFavorites) {
      setSelectedGroupId(undefined) // Clear group selection when showing favorites
      setSearchQuery('')
      setShowTemplatesOnly(false) // Clear templates filter
    }
  }

  const handleToggleTemplates = (onlyTemplates: boolean) => {
    setShowTemplatesOnly(onlyTemplates)
    if (onlyTemplates) {
      setSelectedGroupId(undefined) // Clear group selection when showing templates
      setSearchQuery('')
      setShowFavoritesOnly(false) // Clear favorites filter
    }
  }

  const handleCreatePrompt = () => {
    if (selectedGroupId) {
      setShowCreateModal(true)
    }
  }

  const handleEditPrompt = (prompt: PromptWithGroup) => {
    setEditingPrompt(prompt)
    setShowEditModal(true)
  }

  const handlePromptSuccess = () => {
    setRefreshKey(prev => prev + 1) // Trigger refresh
  }

  if (loading || !user || !library) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading library...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      user={user}
      libraryName={library.name}
      onLibrarySwitch={handleLibrarySwitch}
      sidebar={
        <GroupsSidebar
          libraryId={libraryId}
          selectedGroupId={selectedGroupId}
          onGroupSelect={handleGroupSelect}
          libraryAccessible={libraryAccessible}
        />
      }
    >
      <div className="p-6 max-w-4xl">
        {/* Search Bar and Navigation */}
        <div className="mb-6 space-y-4">
          <PromptSearch
            onSearch={handleSearch}
            onToggleFavorites={handleToggleFavorites}
            onToggleTemplates={handleToggleTemplates}
            showFavoritesOnly={showFavoritesOnly}
            showTemplatesOnly={showTemplatesOnly}
            placeholder={
              selectedGroupId 
                ? "Search prompts in this group..." 
                : "Search all prompts in library..."
            }
          />
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('prompts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prompts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Prompts
              </button>
              <button
                onClick={() => setActiveTab('sharing')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sharing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sharing
              </button>
            </nav>
          </div>
          
          {/* Quick Navigation (only show on prompts tab) */}
          {activeTab === 'prompts' && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/library/${libraryId}/images`)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Images
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'prompts' ? (
          selectedGroupId || searchQuery || showFavoritesOnly || showTemplatesOnly ? (
            <PromptList
              key={`${selectedGroupId}-${searchQuery}-${showFavoritesOnly}-${showTemplatesOnly}-${refreshKey}`}
              groupId={selectedGroupId}
              libraryId={searchQuery || showFavoritesOnly || showTemplatesOnly ? libraryId : undefined}
              searchQuery={searchQuery}
              onlyFavorites={showFavoritesOnly}
              onlyTemplates={showTemplatesOnly}
              onCreatePrompt={handleCreatePrompt}
              onEditPrompt={handleEditPrompt}
            />
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to {library.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  Select a group from the sidebar to manage your prompts, search for specific prompts, or view your favorites.
                </p>
                {library.description && (
                  <p className="text-sm text-gray-500 italic mb-4">
                    {library.description}
                  </p>
                )}
                <div className="text-sm text-gray-500">
                  <p>💡 <strong>Tips:</strong></p>
                  <p>• Create groups to organize your prompts</p>
                  <p>• Use the search to find prompts across all groups</p>
                  <p>• Star prompts to mark them as favorites</p>
                </div>
              </div>
            </div>
          )
        ) : (
          <LibrarySharingPanel
            libraryId={libraryId}
            libraryName={library.name}
            isOwner={isOwner}
          />
        )}

        {/* Modals */}
        {selectedGroupId && (
          <CreatePromptModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            groupId={selectedGroupId}
            onSuccess={handlePromptSuccess}
          />
        )}

        <EditPromptModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          prompt={editingPrompt}
          onSuccess={handlePromptSuccess}
        />
      </div>
    </MainLayout>
  )
}