'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ShareLibraryModal } from './share-library-modal'

interface LibraryShare {
  id: string
  permission: string
  acceptedAt: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
  inviter: {
    name: string | null
    email: string
  }
}

interface LibraryInvite {
  id: string
  email: string
  permission: string
  expiresAt: string
  inviter: {
    name: string | null
    email: string
  }
}

interface LibrarySharingPanelProps {
  libraryId: string
  libraryName: string
  isOwner?: boolean
}

export function LibrarySharingPanel({
  libraryId,
  libraryName,
  isOwner = false
}: LibrarySharingPanelProps) {
  const [shares, setShares] = useState<LibraryShare[]>([])
  const [pendingInvites, setPendingInvites] = useState<LibraryInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [error, setError] = useState('')

  const fetchShares = async () => {
    try {
      const response = await fetch(`/api/libraries/${libraryId}/shares`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('You do not have permission to view sharing information')
          return
        }
        throw new Error('Failed to fetch sharing information')
      }

      const data = await response.json()
      setShares(data.shares || [])
      setPendingInvites(data.pendingInvites || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShares()
  }, [libraryId])

  const handleRemoveAccess = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user\'s access?')) {
      return
    }

    try {
      const response = await fetch(`/api/libraries/${libraryId}/shares/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove access')
      }

      await fetchShares()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handlePermissionChange = async (userId: string, newPermission: string) => {
    try {
      const response = await fetch(`/api/libraries/${libraryId}/shares/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission: newPermission })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update permission')
      }

      await fetchShares()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'write': return 'bg-yellow-100 text-yellow-800'
      case 'read': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sharing</h3>
        {isOwner && (
          <Button onClick={() => setShowShareModal(true)}>
            Share Library
          </Button>
        )}
      </div>

      {/* Current Shares */}
      {shares.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Shared With</h4>
          <div className="space-y-3">
            {shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {share.user.name || share.user.email}
                  </div>
                  {share.user.name && (
                    <div className="text-sm text-gray-500">{share.user.email}</div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {isOwner ? (
                    <select
                      value={share.permission}
                      onChange={(e) => handlePermissionChange(share.user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionBadgeColor(share.permission)}`}>
                      {share.permission}
                    </span>
                  )}
                  
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveAccess(share.user.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Pending Invitations</h4>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-yellow-50">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{invite.email}</div>
                  <div className="text-sm text-gray-500">
                    Invited by {invite.inviter.name || invite.inviter.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionBadgeColor(invite.permission)}`}>
                  {invite.permission}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {shares.length === 0 && pendingInvites.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>This library is not shared with anyone yet.</p>
          {isOwner && (
            <p className="text-sm mt-2">Click "Share Library" to invite collaborators.</p>
          )}
        </div>
      )}

      <ShareLibraryModal
        libraryId={libraryId}
        libraryName={libraryName}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSuccess={fetchShares}
      />
    </div>
  )
}