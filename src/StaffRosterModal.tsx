import { useState } from 'react'
import { roleOptions } from './dummy/roster-mock'
import { Modal, Input, Select, Button } from './components/ui'

interface Props {
  open: boolean
  onClose: () => void
}

export default function StaffRosterModal({ open, onClose }: Props) {
  const [role, setRole] = useState('')

  const roleSelectOptions = [
    { value: '', label: 'Select a role...', disabled: true },
    ...roleOptions.map((r) => ({ value: r, label: r })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Staff"
      subtitle="Register a new member to the organization access pool"
      maxWidth="md"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          onClose()
        }}
      >
        <Input
          label="Full Name"
          id="rosterName"
          placeholder="e.g. Jane Doe"
          required
        />
        <Input
          label="Staff ID"
          id="rosterId"
          placeholder="e.g. CHR-0000"
          required
        />
        <Input
          label="Employee Email"
          id="rosterEmail"
          type="email"
          placeholder="e.g. j.doe@chronos.io"
          required
        />
        <Select
          label="Assigned Role"
          id="rosterRole"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={roleSelectOptions}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 mt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Staff Member
          </Button>
        </div>
      </form>
    </Modal>
  )
}

