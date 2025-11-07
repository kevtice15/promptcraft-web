'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { ImageGallery } from '@/components/images/image-gallery'
import { SessionUser, LibraryWithGroups } from '@/types'

export default function LibraryImagesPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [library, setLibrary] = useState<LibraryWithGroups | null>(null)
  const [loading, setLoading] = useState(true)

  const libraryId = params.libraryId as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user)
        }

        // Get library data
        const libraryResponse = await fetch(`/api/libraries/${libraryId}`)
        if (libraryResponse.ok) {
          const libraryData = await libraryResponse.json()
          setLibrary(libraryData.library)
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

  const handleBackToLibrary = () => {
    router.push(`/library/${libraryId}`)
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
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <button
            onClick={handleBackToLibrary}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>
          
          <h2 className="font-semibold text-gray-900 mb-4">Image Gallery</h2>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p>View and manage all images from your prompts in this library.</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Click images to view full size</li>
              <li>Use filters to find specific images</li>
              <li>Select multiple images for bulk actions</li>
              <li>Edit image metadata and descriptions</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="p-6">
        <ImageGallery libraryId={libraryId} />
      </div>
    </MainLayout>
  )
}