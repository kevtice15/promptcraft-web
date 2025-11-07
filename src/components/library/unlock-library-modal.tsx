'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Library } from '@prisma/client'

interface UnlockLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  library: Library | null
  onSuccess: () => void
}

export function UnlockLibraryModal({ isOpen, onClose, library, onSuccess }: UnlockLibraryModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!library) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/libraries/${library.id}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to unlock library')
        return
      }

      onSuccess()
      handleClose()
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!library) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Unlock Library">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: library.color }}
            />
            <h3 className="text-lg font-medium">{library.name}</h3>
            <div className="text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            This library is password protected. Enter the password to access it.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter library password"
            autoFocus
          />
        </div>

        {library.passwordHint && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Hint:</strong> {library.passwordHint}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Unlock Library
          </Button>
        </div>
      </form>
    </Modal>
  )
}