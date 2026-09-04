import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import type { TaskPriority, TaskType, CreateTaskInput } from '../../types/tasks'
import { useWorkspaceRoster } from '../../hooks/useWorkspaceRoster'
import { Modal, Button, Input, Select } from '../ui'
import { TaskStaffSelector } from './TaskStaffSelector'
import type { StaffOption } from './TaskStaffSelector'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onCreateBatch: (tasks: CreateTaskInput[]) => void | Promise<unknown>
  workspaceId?: string
  departmentName?: string
}

export default function TaskModal({
  open,
  onClose,
  onCreateBatch,
  workspaceId = '',
  departmentName = 'Workspace',
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('special')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [recurrence, setRecurrence] = useState('Every weekday at 09:00 AM')
  const [dueDate, setDueDate] = useState('Today, 05:00 PM')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { roster } = useWorkspaceRoster(workspaceId)

  const staffList = useMemo<StaffOption[]>(() => {
    // Pure DB roster - never seeded with mock members.
    return roster.map((m) => ({
      id: m.memberId,
      name: m.name,
      role: m.roleLabel,
      subDepartment: m.department,
    }))
  }, [roster])

  const defaultAssigneeId = staffList[0]?.id || ''
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const activeSelectedIds = selectedStaffIds.length > 0
    ? selectedStaffIds
    : defaultAssigneeId ? [defaultAssigneeId] : []

  const isAllSelected = activeSelectedIds.length === staffList.length

  function toggleStaff(id: string) {
    setSelectedStaffIds((prev) => {
      const current = prev.length > 0 ? prev : [defaultAssigneeId]
      return current.includes(id)
        ? current.length > 1
          ? current.filter((item) => item !== id)
          : current
        : [...current, id]
    })
  }

  function toggleAllStaff() {
    if (activeSelectedIds.length === staffList.length) {
      setSelectedStaffIds([defaultAssigneeId])
    } else {
      setSelectedStaffIds(staffList.map((s) => s.id))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!title.trim() || activeSelectedIds.length === 0) return

    const selectedOptions = staffList.filter((s) => activeSelectedIds.includes(s.id))

    const batch: CreateTaskInput[] = selectedOptions.map((staff) => ({
      workspaceId,
      title,
      description,
      type,
      priority,
      assigneeMemberId: staff.id,
      assigneeName: staff.name,
      assigneeRole: staff.role,
      department: departmentName,
      subDepartment: staff.subDepartment,
      recurrence: type === 'recurring' ? recurrence : undefined,
      dueDate,
      isToday: true,
      estimatedMins: 30,
    }))

    setIsSubmitting(true)
    try {
      await onCreateBatch(batch)
      setTitle('')
      setDescription('')
      setSelectedStaffIds([])
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create tasks')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Departmental Tasks"
      subtitle="Mass-produce independent task instances for multiple staff members"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="Specify precise expectations, hygiene routines, or log criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <TaskStaffSelector
          staffList={staffList}
          selectedIds={activeSelectedIds}
          onToggleStaff={toggleStaff}
          onToggleAll={toggleAllStaff}
          isAllSelected={isAllSelected}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Task Classification"
            options={[
              { value: 'special', label: 'Special Assignment (One-off)' },
              { value: 'recurring', label: 'Recurring Routine (Daily/Weekly)' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
          />

          <Select
            label="Priority Level"
            options={[
              { value: 'high', label: 'High Priority (Immediate)' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low / Routine' },
            ]}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          />
        </div>

        {type === 'recurring' ? (
          <Input
            label="Recurrence Cadence"
            placeholder="e.g. Every weekday at 08:30 AM"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          />
        ) : (
          <Input
            label="Due Date / Expected Completion"
            placeholder="e.g. Today, 05:00 PM or Tomorrow"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        )}

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
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              leftIcon={<Plus size={16} />}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create{' '}
              {activeSelectedIds.length > 1 ? `${activeSelectedIds.length} Tasks` : 'Task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}