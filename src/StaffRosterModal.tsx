import { X } from 'lucide-react'
import { roleOptions } from './dummy/roster-mock'
import './styles/roster-modal.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function StaffRosterModal({ open, onClose }: Props) {
  if (!open) return null

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="roster-modal-overlay" onClick={handleOverlayClick}>
      <div className="roster-modal" onClick={(e) => e.stopPropagation()}>
        <div className="roster-modal-header">
          <h2>Add New Staff</h2>
          <button className="roster-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="roster-modal-form" onSubmit={(e) => { e.preventDefault(); onClose() }}>
          <div className="roster-field">
            <label htmlFor="rosterName">Full Name</label>
            <input id="rosterName" placeholder="e.g. Jane Doe" required />
          </div>
          <div className="roster-field">
            <label htmlFor="rosterId">Staff ID</label>
            <input id="rosterId" placeholder="e.g. CHR-0000" required />
          </div>
          <div className="roster-field">
            <label htmlFor="rosterEmail">Employee Email</label>
            <input id="rosterEmail" type="email" placeholder="e.g. j.doe@chronos.io" required />
          </div>
          <div className="roster-field">
            <label htmlFor="rosterRole">Assigned Role</label>
            <select id="rosterRole" required defaultValue="">
              <option value="" disabled>Select a role...</option>
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="roster-modal-actions">
            <button type="button" className="roster-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="roster-modal-save">
              Save Staff Member
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
