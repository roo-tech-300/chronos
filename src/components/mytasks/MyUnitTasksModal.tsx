import { UserRound } from 'lucide-react'
import { Modal } from '../ui'
import DayTaskCard from './DayTaskCard'
import type { TaskItem } from '../../types/tasks'
import type { UserEnrolledUnit } from '../../hooks/useUserEnrolledUnits'

interface MyUnitTasksModalProps {
  open: boolean
  onClose: () => void
  unit: UserEnrolledUnit | null
  onOpenDrawer: (task: TaskItem) => void
}

export default function MyUnitTasksModal({
  open,
  onClose,
  unit,
  onOpenDrawer,
}: MyUnitTasksModalProps) {
  if (!unit) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-tight text-zinc-900">
            {unit.name}
          </span>
          <span className="tasks-badge text-[11px]">
            {unit.tasks.length} {unit.tasks.length === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>
      }
      subtitle={`Deliverables and focus areas assigned to you in ${unit.name}.`}
    >
      <div className="flex flex-col gap-4">
        {unit.leadName && (
          <div className="unit-lead-banner">
            <UserRound size={14} />
            Lead · {unit.leadName}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-zinc-100">
          <span className="dot-chip dot-chip--ok">
            {unit.summary.approved} approved
          </span>
          <span className={`dot-chip ${unit.summary.submitted > 0 ? 'dot-chip--warn' : ''}`}>
            {unit.summary.submitted} waiting
          </span>
          <span className="dot-chip">
            {unit.summary.notDone} open
          </span>
        </div>

        {unit.tasks.length === 0 ? (
          <div className="tasks-empty-card py-8 text-center text-sm text-zinc-500">
            No tasks are currently assigned to you in {unit.name}.
          </div>
        ) : (
          <div className="tasks-day-grid max-h-[60vh] overflow-y-auto pr-1">
            {unit.tasks.map((task) => (
              <DayTaskCard
                key={task.id}
                task={task}
                onOpenDrawer={onOpenDrawer}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
