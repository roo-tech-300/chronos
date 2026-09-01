import { useState, useMemo } from 'react'
import { Plus, Check, Users } from 'lucide-react'
import type { TaskPriority, TaskType, CreateTaskInput } from '../../types/tasks'
import { STAFF_DIRECTORY } from '../../dummy/staff-directory'
import { useStaffRoster } from '../../hooks/useStaffRoster'
import { Modal, Button, Input, Select } from '../ui'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onCreateBatch: (tasks: CreateTaskInput[]) => void | Promise<unknown>
  workspaceId?: string
  departmentName?: string
}

interface AssigneeOption {
  id: string
  name: string
  role: string
  subDepartment: string
}

export default function TaskModal({
  open,
  onClose,
  onCreateBatch,
  workspaceId = '',
  departmentName = 'Deep Tech & AI Labs',
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('special')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [recurrence, setRecurrence] = useState('Every weekday at 09:00 AM')
  const [dueDate, setDueDate] = useState('Today, 05:00 PM')

  const { data: rosterData } = useStaffRoster({
    workspaceId,
    page: 1,
    pageSize: 50,
  })

  const staffList = useMemo<AssigneeOption[]>(() => {
    if (rosterData?.members && rosterData.members.length > 0) {
      return rosterData.members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role || 'Department Staff',
        subDepartment: m.department || 'Neural Hardware',
      }))
    }
    return STAFF_DIRECTORY.map((s, idx) => ({
      id: `mem-${idx + 1}-${s.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: s.name,
      role: s.role,
      subDepartment: s.subDepartment,
    }))
  }, [rosterData])

  const defaultAssigneeId = staffList[0]?.id || ''
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const activeSelectedIds = selectedStaffIds.length > 0
    ? selectedStaffIds
    : defaultAssigneeId ? [defaultAssigneeId] : []

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

    onCreateBatch(batch)
    setTitle('')
    setDescription('')
    setSelectedStaffIds([])
    onClose()
  }

  const isAllSelected = activeSelectedIds.length === staffList.length

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

        {/* Multi-Staff Selection Matrix */}
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 uppercase tracking-wide">
              <Users size={14} className="text-zinc-500" />
              <span>Assign To Staff ({activeSelectedIds.length} selected)</span>
            </div>
            <button
              type="button"
              onClick={toggleAllStaff}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              {isAllSelected ? 'Deselect All' : 'Select All Staff'}
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 leading-tight">
            Each chosen person will receive their own independent task to complete and submit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {staffList.map((staff) => {
              const isChecked = activeSelectedIds.includes(staff.id)
              return (
                <button
                  type="button"
                  key={staff.id}
                  onClick={() => toggleStaff(staff.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-white border-zinc-900 shadow-xs'
                      : 'bg-white/60 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      {staff.name}
                    </div>
                    <div className="text-[10.5px] text-zinc-500 truncate">
                      {staff.subDepartment}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-zinc-900 text-white' : 'border border-zinc-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

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

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <span className="text-xs text-zinc-500">
            Creates <strong>{activeSelectedIds.length}</strong> independent{' '}
            {activeSelectedIds.length === 1 ? 'task' : 'tasks'}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" leftIcon={<Plus size={16} />}>
              Create{' '}
              {activeSelectedIds.length > 1 ? `${activeSelectedIds.length} Tasks` : 'Task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}