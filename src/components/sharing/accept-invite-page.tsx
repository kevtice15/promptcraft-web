'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface InviteInfo {
  email: string
  permission: string
  library: {
    id: string
    name: string
    description: string | null
    color: string
  }
  inviter: {
    name: string | null
    email: string
  }
  createdAt: string
  expiresAt: string
}

interface AcceptInvitePageProps {
  token: string
}

export function AcceptInvitePage({ token }: AcceptInvitePageProps) {
  const router = useRouter()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchInvite()
  }, [token])

  const fetchInvite = async () => {
    try {
      const response = await fetch(`/api/invites/${token}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('This invitation is invalid or has expired.')
        } else {
          throw new Error('Failed to load invitation')
        }
        return
      }

      const data = await response.json()
      setInvite(data.invite)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    setError('')

    try {
      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      
      // Redirect to the library after a short delay
      setTimeout(() => {
        router.push(`/library/${invite?.library.id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsAccepting(false)
    }
  }

  const getPermissionDescription = (permission: string) => {
    switch (permission) {
      case 'admin': return 'Full admin access - can manage sharing and settings'
      case 'write': return 'Write access - can add and edit prompts'
      case 'read': return 'Read access - can view prompts and groups'
      default: return permission
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-4">
            You now have access to "{invite?.library.name}". Redirecting you to the library...
          </p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">
            {error || 'This invitation is invalid or has expired.'}
          </p>
          <Button onClick={() => router.push('/libraries')}>
            Go to Libraries
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Library Invitation</h1>
          <p className="text-gray-600">
            You've been invited to collaborate on a PromptCraft library
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4" style={{ borderLeftColor: invite.library.color, borderLeftWidth: '4px' }}>
            <h3 className="font-semibold text-gray-900">{invite.library.name}</h3>
            {invite.library.description && (
              <p className="text-gray-600 text-sm mt-1">{invite.library.description}</p>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Invited by:</span>
              <span className="text-gray-900">{invite.inviter.name || invite.inviter.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Your email:</span>
              <span className="text-gray-900">{invite.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Permission level:</span>
              <span className="text-gray-900 capitalize">{invite.permission}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
              {getPermissionDescription(invite.permission)}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expires:</span>
              <span className="text-gray-900">{new Date(invite.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/libraries')}
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1"
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}