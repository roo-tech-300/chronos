import { useState } from 'react'
import { UserPlus, AlertCircle } from 'lucide-react'
import type { OrgUnit } from '../../types/organization'
import type { WorkspaceMemberRecord } from '../../types/tasks'
import { useWorkspaceUnits } from '../../hooks/useOrganizationUnits'
import { Modal, Button, Input } from '../ui'
import { StaffSearchCombobox } from './StaffSearchCombobox'

interface AssignMemberModalProps {
  isOpen: boolean
  unit: OrgUnit | null
  workspaceId: string
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Modal for placing a staff member into an organization unit.
 * Uses StaffSearchCombobox for lazy, server-side staff search —
 * no full-roster fetch, no appointment type / supervisor / primary checkbox.
 */
export function AssignMemberModal({
  isOpen,
  unit,
  workspaceId,
  onClose,
  onSuccess,
}: AssignMemberModalProps) {
  const { assignMember, isAssigning } = useWorkspaceUnits(workspaceId)

  const [selectedMember, setSelectedMember] = useState<WorkspaceMemberRecord | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unit || !selectedMember) {
      setErrorMsg('Please select a staff member.')
      return
    }

    try {
      setErrorMsg(null)
      await assignMember({
        memberId: selectedMember.memberId,
        unitId: unit.id,
        jobTitle: jobTitle.trim() || undefined,
      })
      setSelectedMember(null)
      setJobTitle('')
      onSuccess?.()
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to assign staff member.')
    }
  }

  if (!isOpen || !unit) return null

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-zinc-900">
          <UserPlus size={20} className="text-[#7c007e]" />
          <span>Assign Staff to {unit.name}</span>
        </div>
      }
      subtitle={`Place a staff member in ${unit.name} (${unit.code || unit.unitType})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <StaffSearchCombobox
          workspaceId={workspaceId}
          selectedMember={selectedMember}
          onSelect={setSelectedMember}
          label="Staff Member"
          placeholder="Type to search staff..."
          required
        />

        <Input
          label="Unit Job Title (Optional)"
          placeholder="e.g. Lead Frontend Engineer"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isAssigning}
            disabled={!selectedMember}
          >
            Assign to Unit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
