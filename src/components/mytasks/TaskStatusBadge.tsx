import { Clock3, ShieldCheck } from 'lucide-react'
import type { TaskItem } from '../../dummy/tasks-mock'
import { Badge } from '../ui'

interface TaskStatusBadgeProps {
  task: TaskItem
  hodName: string
}

export default function TaskStatusBadge({ task, hodName }: TaskStatusBadgeProps) {
  if (task.status === 'approved') {
    return (
      <Badge variant="success" showDot leftIcon={<ShieldCheck size={12} />}>
        Verified by {task.verifiedBy ?? hodName}
      </Badge>
    )
  }

  if (task.status === 'submitted') {
    return (
      <Badge variant="warning" showDot pulseDot>
        Waiting for HOD Approval
      </Badge>
    )
  }

  return (
    <Badge variant="neutral" leftIcon={<Clock3 size={12} />}>
      Not Started
    </Badge>
  )
}