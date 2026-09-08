import { useState } from 'react'
import { Send } from 'lucide-react'
import type { TaskItem, TaskSubmissionPayload } from '../../types/tasks'
import { Button } from '../ui'

interface TaskSubmissionFormProps {
  task: TaskItem
  onSubmit: (payload: TaskSubmissionPayload) => void
  onCancel: () => void
}

export default function TaskSubmissionForm({ task, onSubmit, onCancel }: TaskSubmissionFormProps) {
  const [note, setNote] = useState(task.proofNote ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    onSubmit({ completionNote: note.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="completion-note" className="text-xs font-semibold text-zinc-700">
          Completion Note <span className="text-zinc-400">(shown to your HOD)</span>
        </label>
        <textarea
          id="completion-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          required
          placeholder="Describe what you completed, what you verified, and any anomalies..."
          className="tasks-textarea"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 mt-1">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" leftIcon={<Send size={14} />} disabled={!note.trim()}>
          Submit for HOD Review
        </Button>
      </div>
    </form>
  )
}