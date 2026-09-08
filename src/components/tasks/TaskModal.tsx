import { useState } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import type { TaskType, CreateTaskInput } from '../../types/tasks'
import { Modal, Button, Input, Select } from '../ui'
import { TaskStaffSelector } from './TaskStaffSelector'
import { TaskUnitScopePicker } from './TaskUnitScopePicker'
import { TaskDueDatePicker } from './TaskDueDatePicker'
import { useTaskAssigneeScope } from '../../hooks/useTaskAssigneeScope'

export type RecurrenceOption = 'one_off' | 'daily' | 'weekly' | 'monthly'

const RECURRENCE_OPTIONS: { value: RecurrenceOption; label: string }[] = [
  { value: 'one_off', label: 'One Off (Single Day)' },
  { value: 'daily', label: 'Daily (Every Weekday)' },
  { value: 'weekly', label: 'Weekly (Same Day Each Week)' },
  { value: 'monthly', label: 'Monthly (Same Date Each Month)' },
]

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onCreateBatch: (tasks: CreateTaskInput[]) => void | Promise<unknown>
  workspaceId?: string
  departmentName?: string
  unitId?: string
  unitName?: string
  allowedMemberIds?: string[]
  allowUnitChange?: boolean
}


export default function TaskModal({
  open,
  onClose,
  onCreateBatch,
  workspaceId = '',
  departmentName = 'Workspace',
  unitId,
  unitName,
  allowedMemberIds,
  allowUnitChange = true,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceOption>('one_off')
  const [dueDate, setDueDate] = useState('Today, 05:00 PM')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    availableUnits,
    selectedUnitId,
    setSelectedUnitId,
    effectiveUnitName,
    staffList,
    activeSelectedIds,
    toggleStaff,
    toggleAllStaff,
    isAllSelected,
    validateAssignees,
    canChangeUnit,
  } = useTaskAssigneeScope({
    workspaceId,
    initialUnitId: unitId,
    initialUnitName: unitName || departmentName,
    allowedMemberIds,
    allowUnitChange,
  })

  const taskType: TaskType = recurrence === 'one_off' ? 'special' : 'recurring'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const validation = validateAssignees()
    if (!validation.valid) {
      setSubmitError(validation.error || 'Assignee validation failed.')
      return
    }

    if (!title.trim()) return

    const selectedOptions = staffList.filter((s) => activeSelectedIds.includes(s.id))

    const batch: CreateTaskInput[] = selectedOptions.map((staff) => ({
      workspaceId,
      title,
      description,
      type: taskType,
      assigneeMemberId: staff.id,
      assigneeName: staff.name,
      assigneeRole: staff.role,
      department: effectiveUnitName,
      recurrence: recurrence === 'one_off' ? undefined : recurrence,
      dueDate,
    }))

    setIsSubmitting(true)
    try {
      await onCreateBatch(batch)
      setTitle('')
      setDescription('')
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create tasks')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled = isSubmitting || staffList.length === 0 || activeSelectedIds.length === 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7c007e]/10 text-[#7c007e] flex items-center justify-center shrink-0">
            <ClipboardList size={18} />
          </div>
          <span className="text-base font-bold text-zinc-900">Assign Tasks</span>
        </div>
      }
      subtitle={`Create and assign tasks to ${effectiveUnitName} personnel`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TaskUnitScopePicker
          units={availableUnits}
          selectedUnitId={selectedUnitId}
          onSelectUnit={setSelectedUnitId}
          canChangeUnit={canChangeUnit}
        />

        <Input
          label="Task Title"
          placeholder="e.g. Conduct Laboratory Inspection or Sensor Recalibration"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
            Description & Instructions
          </label>
          <textarea
            rows={2}
            className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 resize-none"
            placeholder="Specify precise expectations, hygiene routines, or log criteria... (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <TaskStaffSelector
          staffList={staffList}
          selectedIds={activeSelectedIds}
          onToggleStaff={toggleStaff}
          onToggleAll={toggleAllStaff}
          isAllSelected={isAllSelected}
          unitName={effectiveUnitName}
        />

        <Select
          label="Recurrence"
          options={RECURRENCE_OPTIONS}
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as RecurrenceOption)}
        />

        <TaskDueDatePicker recurrence={recurrence} onDueDateChange={setDueDate} />

        <p className="text-xs text-zinc-500">
          Due rule: <strong className="text-zinc-700">{dueDate}</strong>
        </p>

        {submitError && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <span className="text-xs text-zinc-500">
            Creates <strong>{activeSelectedIds.length}</strong> independent{' '}
            {activeSelectedIds.length === 1 ? 'task' : 'tasks'}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              leftIcon={<Plus size={16} />}
              isLoading={isSubmitting}
              disabled={isSubmitDisabled}
            >
              Create {activeSelectedIds.length > 1 ? `${activeSelectedIds.length} Tasks` : 'Task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
