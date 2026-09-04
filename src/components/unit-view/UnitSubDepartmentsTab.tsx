import { GitFork, ChevronRight, UserRound, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { OrgUnit } from '../../types/organization'
import type { WorkspaceMemberRecord } from '../../types/tasks'
import { Badge } from '../ui'

interface UnitSubDepartmentsTabProps {
  childUnits: OrgUnit[]
  workspaceId: string
  allUnits: OrgUnit[]
  roster: WorkspaceMemberRecord[]
}

export function UnitSubDepartmentsTab({
  childUnits,
  workspaceId,
  allUnits,
  roster,
}: UnitSubDepartmentsTabProps) {
  const wsPrefix = workspaceId ? `/workspace/${workspaceId}` : ''

  if (childUnits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
        <GitFork size={32} className="mx-auto text-zinc-300 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-800">No Sub-Departments</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          This organization unit is a terminal team or laboratory and has no nested child units.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Nested Sub-Departments</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Select any child unit to inspect its scoped deliverables and team roster.
          </p>
        </div>
        <Badge variant="neutral" size="sm">
          {childUnits.length} {childUnits.length === 1 ? 'Sub-Unit' : 'Sub-Units'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {childUnits.map((child) => {
          const lead = child.headMemberId
            ? roster.find((m) => m.memberId === child.headMemberId)?.name
            : null
          const nestedCount = allUnits.filter((u) => u.parentId === child.id).length
          const staffCount = roster.filter(
            (m) => m.unitId === child.id || (m.unitIds && m.unitIds.includes(child.id))
          ).length

          return (
            <Link
              key={child.id}
              to={`${wsPrefix}/units/${child.id}`}
              className="group bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-zinc-100 text-zinc-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                      <GitFork size={15} />
                    </span>
                    <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                      {child.code}
                    </Badge>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all"
                  />
                </div>

                <h3 className="font-semibold text-zinc-900 text-sm mb-1 group-hover:text-purple-900 transition-colors line-clamp-1">
                  {child.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                  <UserRound size={12} className="text-zinc-400 shrink-0" />
                  <span className="truncate">{lead ? `HOD · ${lead}` : 'No lead appointed'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{staffCount} staff</span>
                </span>
                {nestedCount > 0 && <span>{nestedCount} sub-units</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
