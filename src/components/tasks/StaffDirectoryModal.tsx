import { useState, type ReactNode } from 'react'
import { ChevronRight, UserRound } from 'lucide-react'
import type { StaffTaskGroup, TaskItem } from '../../types/tasks'
import { Modal } from '../ui'
import StaffMemberRow from './StaffMemberRow'
import StaffTasksPanel from './StaffTasksPanel'
import TaskDetailView from './TaskDetailView'

interface StaffDirectoryModalProps {
  open: boolean
  onClose: () => void
  unitName: string
  leadName: string | null
  members: StaffTaskGroup[]
  onApproveTask: (task: TaskItem) => void
}

/**
 * The internal "fake navigation" steps of the directory flow. Each level
 * keeps its own back trail instead of nesting collapsible accordions.
 */
type DirectoryStep =
  | { level: 'members' }
  | { level: 'person'; member: StaffTaskGroup }
  | { level: 'task'; member: StaffTaskGroup; task: TaskItem }

const INITIAL_STEP: DirectoryStep = { level: 'members' }

export default function StaffDirectoryModal({
  open,
  onClose,
  unitName,
  leadName,
  members,
  onApproveTask,
}: StaffDirectoryModalProps) {
  const [step, setStep] = useState<DirectoryStep>(INITIAL_STEP)

  // Reopening always starts fresh at the people list.
  function handleClose() {
    setStep(INITIAL_STEP)
    onClose()
  }

  /**
   * Re-resolve the drill-down subjects against the live member list so an
   * approval performed mid-flow is reflected instantly without losing the
   * navigation position (or drifting onto stale task snapshots).
   */
  function resolveLiveStep(current: DirectoryStep): DirectoryStep {
    if (current.level === 'members') return current
    const liveMember = members.find((m) => m.name === current.member.name)
    if (!liveMember) return INITIAL_STEP
    if (current.level === 'person') return { level: 'person', member: liveMember }
    const liveTask = liveMember.tasks.find((t) => t.id === current.task.id)
    return liveTask
      ? { level: 'task', member: liveMember, task: liveTask }
      : { level: 'person', member: liveMember }
  }

  function renderBreadcrumb(live: DirectoryStep): ReactNode {
    if (live.level === 'members') {
      return <strong>{unitName}</strong>
    }
    if (live.level === 'person') {
      return (
        <>
          <strong>{unitName}</strong>
          <ChevronRight size={14} className="text-zinc-300" />
          <strong className="max-w-[220px] truncate">{live.member.name}</strong>
        </>
      )
    }
    return (
      <>
        <strong>{unitName}</strong>
        <ChevronRight size={14} className="text-zinc-300" />
        <strong className="max-w-[140px] truncate text-zinc-600">{live.member.name}</strong>
        <ChevronRight size={14} className="text-zinc-300" />
        <strong className="max-w-[180px] truncate">{live.task.title}</strong>
      </>
    )
  }

  const liveStep = resolveLiveStep(step)

  const subtitle =
    liveStep.level === 'members'
      ? 'Pick a team member to walk through their day.'
      : liveStep.level === 'person'
        ? `${liveStep.member.role} · ${liveStep.member.subDepartment}`
        : 'Full deliverable overview and verification status.'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      title={
        <nav
          aria-label="Directory breadcrumb"
          className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-zinc-900"
        >
          {renderBreadcrumb(liveStep)}
        </nav>
      }
      subtitle={subtitle}
    >
      {liveStep.level === 'members' && (
        <>
          {leadName && (
            <div className="unit-lead-banner">
              <UserRound size={14} />
              {leadName} oversees this unit and reviews team submissions.
            </div>
          )}
          <div className="member-list">
            {members.map((member) => (
              <StaffMemberRow
                key={member.name}
                member={member}
                onSelect={() => setStep({ level: 'person', member })}
              />
            ))}
            {members.length === 0 && (
              <p className="tasks-empty">No staff records exist for this unit yet.</p>
            )}
          </div>
        </>
      )}

      {liveStep.level === 'person' && (
        <StaffTasksPanel
          member={liveStep.member}
          unitName={unitName}
          onBack={() => setStep(INITIAL_STEP)}
          onApprove={onApproveTask}
          onViewDetails={(task) =>
            setStep({ level: 'task', member: liveStep.member, task })
          }
        />
      )}

      {liveStep.level === 'task' && (
        <TaskDetailView
          task={liveStep.task}
          onBack={() => setStep({ level: 'person', member: liveStep.member })}
          onApprove={onApproveTask}
        />
      )}
    </Modal>
  )
}