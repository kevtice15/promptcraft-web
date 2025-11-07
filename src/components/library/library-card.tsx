import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LibraryWithGroups } from '@/types'

interface LibraryCardProps {
  library: LibraryWithGroups & {
    groups: Array<{
      id: string
      name: string
      _count: { prompts: number }
    }>
  }
  onClick: () => void
  isShared?: boolean
  sharedBy?: string
  permission?: string
}

export function LibraryCard({ library, onClick, isShared, sharedBy, permission }: LibraryCardProps) {
  const totalPrompts = library.groups.reduce((sum, group) => sum + group._count.prompts, 0)
  const groupCount = library.groups.length

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: library.color }}
            />
            <CardTitle className="text-lg">{library.name}</CardTitle>
          </div>
          {library.isPrivate && (
            <div className="text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          )}
        </div>
        {library.description && (
          <CardDescription className="text-sm">
            {library.description}
          </CardDescription>
        )}
        {isShared && (
          <CardDescription className="text-xs text-blue-600 mt-1">
            Shared by {sharedBy}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <Badge variant="secondary">
            {groupCount} {groupCount === 1 ? 'group' : 'groups'}
          </Badge>
          <Badge variant="secondary">
            {totalPrompts} {totalPrompts === 1 ? 'prompt' : 'prompts'}
          </Badge>
          {isShared && permission && (
            <Badge variant="outline" className="text-xs">
              {permission} access
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}