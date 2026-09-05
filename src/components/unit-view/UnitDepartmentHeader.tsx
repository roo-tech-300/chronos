import { ArrowLeft, Plus, UserPlus, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { OrgUnit } from '../../types/organization'
import { Badge, Button } from '../ui'

interface UnitDepartmentHeaderProps {
  unit: OrgUnit
  breadcrumbs: OrgUnit[]
  workspaceId: string
  headName?: string | null
  onAssignTask: () => void
  onAddStaff: () => void
}

export function UnitDepartmentHeader({
  unit,
  breadcrumbs,
  workspaceId,
  headName,
  onAssignTask,
  onAddStaff,
}: UnitDepartmentHeaderProps) {
  const wsPrefix = workspaceId ? `/workspace/${workspaceId}` : ''

  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-zinc-200 px-6 py-5 shadow-sm">
      {/* Top breadcrumb & back row */}
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium overflow-x-auto">
          <Link
            to={`${wsPrefix}/settings/organization`}
            className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Organization Units</span>
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1.5">
              <span className="text-zinc-300">/</span>
              <Link
                to={`${wsPrefix}/units/${crumb.id}`}
                className="hover:text-zinc-900 transition-colors max-w-[140px] truncate"
              >
                {crumb.name}
              </Link>
            </span>
          ))}
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-semibold truncate max-w-[180px]">{unit.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserPlus size={14} />}
            onClick={onAddStaff}
          >
            Add Staff
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={onAssignTask}
          >
            Assign Task
          </Button>
        </div>
      </div>

      {/* Main Title & Lead Info */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{unit.name}</h1>
            <Badge variant="neutral" size="sm" className="font-mono">
              {unit.code}
            </Badge>
            <Badge variant="purple" size="sm" className="capitalize">
              {unit.unitType}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600 flex-wrap">
            <span className="flex items-center gap-1.5 bg-zinc-100 rounded-md px-2.5 py-1">
              <UserRound size={13} className="text-zinc-500" />
              <span className="font-medium text-zinc-700">
                {headName ? `HOD · ${headName}` : 'No Department Head appointed'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
