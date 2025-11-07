import { Badge } from '@/components/ui/badge'
import { GroupWithPrompts } from '@/types'

interface GroupItemProps {
  group: GroupWithPrompts & {
    _count: { prompts: number }
  }
  isActive: boolean
  onClick: () => void
}

export function GroupItem({ group, isActive, onClick }: GroupItemProps) {
  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500' 
          : 'hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-gray-500 truncate mt-1">
              {group.description}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="ml-2 shrink-0">
          {group._count.prompts}
        </Badge>
      </div>
    </div>
  )
}