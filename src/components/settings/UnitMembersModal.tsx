import { useState } from 'react'
import { Users, UserPlus } from 'lucide-react'
import type { OrgUnit } from '../../types/organization'
import { useUnitMembers, useWorkspaceUnits } from '../../hooks/useOrganizationUnits'
import { Modal, Button, Badge } from '../ui'
import { UnitMemberList } from './UnitMemberList'
import { AssignMemberModal } from './AssignMemberModal'

interface UnitMembersModalProps {
  unit: OrgUnit | null
  workspaceId: string
  isOpen: boolean
  onClose: () => void
}

export function UnitMembersModal({
  unit,
  workspaceId,
  isOpen,
  onClose,
}: UnitMembersModalProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const { data: members = [], isLoading } = useUnitMembers(unit?.id)
  const { removeAssignment, isRemoving } = useWorkspaceUnits(workspaceId)

  if (!isOpen || !unit) return null

  const handleRemoveMember = async (memberId: string) => {
    await removeAssignment({ memberId, unitId: unit.id })
  }

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7c007e]/10 text-[#7c007e] flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-zinc-900">{unit.name}</span>
                <Badge variant="purple" size="sm">
                  {unit.unitType.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 font-normal">
                {members.length} active staff assigned {unit.code ? `• Code: ${unit.code}` : ''}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <p className="text-xs text-zinc-500">
              Staff members placed in this unit gain hierarchy-scoped access and approval routing.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus size={15} />}
              onClick={() => setIsAssignOpen(true)}
            >
              Assign Staff
            </Button>
          </div>

          <UnitMemberList
            members={members}
            isLoading={isLoading}
            onRemove={handleRemoveMember}
            isRemoving={isRemoving}
            onAssignClick={() => setIsAssignOpen(true)}
          />

          <div className="flex justify-end pt-3 border-t border-zinc-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      <AssignMemberModal
        isOpen={isAssignOpen}
        unit={unit}
        workspaceId={workspaceId}
        onClose={() => setIsAssignOpen(false)}
      />
    </>
  )
}
