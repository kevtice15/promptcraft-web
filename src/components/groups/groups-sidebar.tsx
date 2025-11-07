'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GroupItem } from './group-item'
import { CreateGroupModal } from './create-group-modal'
import { GroupWithPrompts } from '@/types'

type GroupWithCounts = GroupWithPrompts & {
  _count: { prompts: number }
}

interface GroupsSidebarProps {
  libraryId: string
  selectedGroupId?: string
  onGroupSelect: (groupId: string) => void
  libraryAccessible: boolean
}

export function GroupsSidebar({ libraryId, selectedGroupId, onGroupSelect, libraryAccessible }: GroupsSidebarProps) {
  const [groups, setGroups] = useState<GroupWithCounts[]>([])
  const [filteredGroups, setFilteredGroups] = useState<GroupWithCounts[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/groups?libraryId=${libraryId}`)
      const data = await response.json()
      
      if (response.ok) {
        setGroups(data.groups)
        setFilteredGroups(data.groups)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (libraryAccessible) {
      fetchGroups()
    }
  }, [libraryId, libraryAccessible])

  useEffect(() => {
    const filtered = groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredGroups(filtered)
  }, [groups, searchTerm])

  if (loading || !libraryAccessible) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Groups</h2>
          <Button 
            size="sm" 
            onClick={() => setShowCreateModal(true)}
            className="h-8 w-8 p-0"
          >
            +
          </Button>
        </div>
        
        <Input
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            {groups.length === 0 ? (
              <div className="text-gray-500">
                <div className="text-gray-400 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm mb-2">No groups yet</p>
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Group
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No groups match your search</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGroups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isActive={selectedGroupId === group.id}
                onClick={() => onGroupSelect(group.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        libraryId={libraryId}
        onSuccess={fetchGroups}
      />
    </div>
  )
}