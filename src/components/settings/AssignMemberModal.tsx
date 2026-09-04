import { useState, useId } from 'react'
import { UserPlus, AlertCircle } from 'lucide-react'
import type { OrgUnit, AssignmentType } from '../../types/organization'
import { useWorkspaceRoster } from '../../hooks/useWorkspaceRoster'
import { useWorkspaceUnits } from '../../hooks/useOrganizationUnits'
import { Modal, Button, Input, Select } from '../ui'

interface AssignMemberModalProps {
  isOpen: boolean
  unit: OrgUnit | null
  workspaceId: string
  onClose: () => void
  onSuccess?: () => void
}

const ASSIGNMENT_TYPES: { value: AssignmentType; label: string }[] = [
  { value: 'primary', label: 'Primary Department (Home Unit)' },
  { value: 'joint', label: 'Joint Appointment (Shared Division)' },
  { value: 'adjunct', label: 'Adjunct / Cross-Functional' },
  { value: 'secondment', label: 'Secondment (Internal Transfer)' },
  { value: 'affiliate', label: 'Affiliate Member' },
]

export function AssignMemberModal({
  isOpen,
  unit,
  workspaceId,
  onClose,
  onSuccess,
}: AssignMemberModalProps) {
  const { roster } = useWorkspaceRoster(workspaceId)
  const { assignMember, isAssigning } = useWorkspaceUnits(workspaceId)

  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('primary')
  const [jobTitle, setJobTitle] = useState('')
  const [reportsTo, setReportsTo] = useState('')
  const [isPrimary, setIsPrimary] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const primaryCheckId = useId()

  const memberOptions = roster.map((m) => ({
    value: m.memberId,
    label: `${m.name} (${m.roleLabel || m.department})`,
  }))

  const supervisorOptions = [
    { value: '', label: 'None / Department Head Default' },
    ...roster
      .filter((m) => m.memberId !== selectedMemberId)
      .map((m) => ({ value: m.memberId, label: m.name })),
  ]

  const handleTypeChange = (type: AssignmentType) => {
    setAssignmentType(type)
    if (type === 'primary') {
      setIsPrimary(true)
    } else {
      setIsPrimary(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unit || !selectedMemberId) {
      setErrorMsg('Please select a staff member.')
      return
    }

    try {
      setErrorMsg(null)
      await assignMember({
        memberId: selectedMemberId,
        unitId: unit.id,
        assignmentType,
        jobTitle: jobTitle.trim() || undefined,
        reportsTo: reportsTo || null,
        isPrimary,
      })
      setSelectedMemberId('')
      setJobTitle('')
      setReportsTo('')
      setAssignmentType('primary')
      setIsPrimary(true)
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

        <Select
          label="Staff Member *"
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          options={[{ value: '', label: 'Select staff member...' }, ...memberOptions]}
          required
        />

        <Select
          label="Appointment / Assignment Type"
          value={assignmentType}
          onChange={(e) => handleTypeChange(e.target.value as AssignmentType)}
          options={ASSIGNMENT_TYPES}
        />

        <Input
          label="Unit Job Title (Optional)"
          placeholder="e.g. Lead Frontend Engineer"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />

        <Select
          label="Line Supervisor in Unit (Optional)"
          value={reportsTo}
          onChange={(e) => setReportsTo(e.target.value)}
          options={supervisorOptions}
        />

        <div className="flex items-center gap-2.5 pt-1">
          <input
            id={primaryCheckId}
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-4 h-4 rounded text-[#7c007e] focus:ring-[#7c007e] border-zinc-300"
          />
          <label htmlFor={primaryCheckId} className="text-xs font-medium text-zinc-700 cursor-pointer">
            Mark as primary home department for this staff member
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isAssigning}
            disabled={!selectedMemberId}
          >
            Assign to Unit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
