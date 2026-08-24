import { useState } from 'react'
import { Link2, Plus, Send, X } from 'lucide-react'
import type { TaskItem, TaskSubmissionPayload } from '../../dummy/tasks-mock'
import { Button, Input } from '../ui'

interface TaskSubmissionFormProps {
  task: TaskItem
  onSubmit: (payload: TaskSubmissionPayload) => void
  onCancel: () => void
}

const MAX_LINKS = 3

export default function TaskSubmissionForm({ task, onSubmit, onCancel }: TaskSubmissionFormProps) {
  const [note, setNote] = useState(task.proofNote ?? '')
  const [links, setLinks] = useState<string[]>(
    task.completionLinks && task.completionLinks.length > 0 ? task.completionLinks : [''],
  )
  const [minutes, setMinutes] = useState<string>(task.actualMins ? String(task.actualMins) : '')

  const numericMinutes = Number(minutes)
  const canSubmit =
    note.trim().length > 0 && Number.isFinite(numericMinutes) && numericMinutes > 0

  function updateLink(index: number, value: string) {
    setLinks((prev) => prev.map((link, i) => (i === index ? value : link)))
  }

  function addLink() {
    if (links.length < MAX_LINKS) setLinks((prev) => [...prev, ''])
  }

  function removeLink(index: number) {
    setLinks((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      completionNote: note.trim(),
      completionLinks: links.map((link) => link.trim()).filter(Boolean),
      actualMins: Math.round(numericMinutes),
    })
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

      <Input
        label="Actual Time Taken (minutes)"
        type="number"
        min={1}
        step={1}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        placeholder="e.g. 40"
        required
        helperText="Log the real time spent so the HOD can compare it against the estimate."
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-700">Evidence Links (optional)</span>
        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="url"
              value={link}
              onChange={(e) => updateLink(index, e.target.value)}
              placeholder="https://shared-drive/evidence"
              leftIcon={<Link2 size={15} />}
            />
            {links.length > 1 && (
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                aria-label="Remove link"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {links.length < MAX_LINKS && (
          <button
            type="button"
            onClick={addLink}
            className="self-start inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-[#111827] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add another link
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 mt-1">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" leftIcon={<Send size={14} />} disabled={!canSubmit}>
          Submit for HOD Review
        </Button>
      </div>
    </form>
  )
}