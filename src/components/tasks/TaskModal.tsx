import { useState } from 'react'
import { Plus, Check, Users } from 'lucide-react'
import type { TaskItem, TaskPriority, TaskType } from '../../dummy/tasks-mock'
import { Modal, Button, Input, Select } from '../ui'

interface StaffOption {
  name: string
  role: string
  subDepartment: string
}

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onCreateBatch: (tasks: Omit<TaskItem, 'id' | 'status'>[]) => void
  subDepartments: string[]
}

const mockStaffList: StaffOption[] = [
  { name: 'Marcus Vance', role: 'Senior Hardware Tech', subDepartment: 'Neural Hardware' },
  { name: 'Elena Rostova', role: 'Infrastructure Engineer', subDepartment: 'Edge Compute' },
  { name: 'Devon Miles', role: 'Security Systems Analyst', subDepartment: 'Autonomous Systems' },
  { name: 'Sarah Jenkins', role: 'Lab Operations Manager', subDepartment: 'Autonomous Systems' },
]

export default function TaskModal({ open, onClose, onCreateBatch }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('special')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [selectedStaffNames, setSelectedStaffNames] = useState<string[]>([mockStaffList[0].name])
  const [recurrence, setRecurrence] = useState('Every weekday at 09:00 AM')
  const [dueDate, setDueDate] = useState('Today, 05:00 PM')

  function toggleStaff(name: string) {
    setSelectedStaffNames((prev) =>
      prev.includes(name)
        ? prev.length > 1
          ? prev.filter((n) => n !== name)
          : prev
        : [...prev, name]
    )
  }

  function toggleAllStaff() {
    if (selectedStaffNames.length === mockStaffList.length) {
      setSelectedStaffNames([mockStaffList[0].name])
    } else {
      setSelectedStaffNames(mockStaffList.map((s) => s.name))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || selectedStaffNames.length === 0) return

    // Mass produce independent task instances for each selected person
    const batch: Omit<TaskItem, 'id' | 'status'>[] = selectedStaffNames.map((staffName) => {
      const staffInfo = mockStaffList.find((s) => s.name === staffName)
      return {
        title,
        description,
        type,
        priority,
        assigneeName: staffName,
        assigneeRole: staffInfo?.role || 'Department Staff',
        department: 'Deep Tech & AI Labs',
        subDepartment: staffInfo?.subDepartment || 'Neural Hardware',
        recurrence: type === 'recurring' ? recurrence : undefined,
        dueDate,
      }
    })

    onCreateBatch(batch)
    setTitle('')
    setDescription('')
    setSelectedStaffNames([mockStaffList[0].name])
    onClose()
  }

  const isAllSelected = selectedStaffNames.length === mockStaffList.length

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
              <span>Assign To Staff ({selectedStaffNames.length} selected)</span>
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
            {mockStaffList.map((staff) => {
              const isChecked = selectedStaffNames.includes(staff.name)
              return (
                <button
                  type="button"
                  key={staff.name}
                  onClick={() => toggleStaff(staff.name)}
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
            Creates <strong>{selectedStaffNames.length}</strong> independent {selectedStaffNames.length === 1 ? 'task' : 'tasks'}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" leftIcon={<Plus size={16} />}>
              Create {selectedStaffNames.length > 1 ? `${selectedStaffNames.length} Tasks` : 'Task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
