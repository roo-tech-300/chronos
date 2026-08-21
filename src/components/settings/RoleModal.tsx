import { useState, useEffect, useRef } from 'react'
import {
  X,
  Badge,
  Router,
  Activity,
} from 'lucide-react'
import type { OrgRole, PermissionItem } from '../../types/organization'
import { defaultPermissionsList } from '../../dummy/organization-mock'

interface RoleModalProps {
  isOpen: boolean
  initialData?: OrgRole | null
  onClose: () => void
  onSave: (role: OrgRole) => void
}

const permissionGroups = [
  {
    name: 'Staff Roster',
    icon: Badge,
    items: [
      { id: 'records:view_own', label: 'View Staff Profiles' },
      { id: 'schedule:management', label: 'Edit Staff Details' },
      { id: 'attendance:biometric_override', label: 'Enroll Biometrics' },
    ],
  },
  {
    name: 'Devices & Terminals',
    icon: Router,
    items: [
      { id: 'admin:hardware_config', label: 'View Device Status' },
      { id: 'admin:global_settings', label: 'Remote Reboot/Lock' },
      { id: 'hardware:configure_network', label: 'Configure Network Settings' },
    ],
  },
  {
    name: 'Analytics & Logs',
    icon: Activity,
    items: [
      { id: 'attendance:audit_view', label: 'View Access Logs' },
      { id: 'attendance:timesheet_approve', label: 'Export Reports' },
    ],
  },
]

function RoleForm({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: OrgRole | null
  onClose: () => void
  onSave: (role: OrgRole) => void
}) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [activePermIds, setActivePermIds] = useState<string[]>(() => {
    if (initialData) {
      return initialData.permissions.filter((p) => p.enabled).map((p) => p.id)
    }
    return ['records:view_own']
  })

  const togglePerm = (permId: string) => {
    setActivePermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const permissions: PermissionItem[] = defaultPermissionsList.map((p) => ({
      ...p,
      enabled: activePermIds.includes(p.id),
    }))

    onSave({
      id: initialData?.id || `role-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      isSystemDefault: initialData?.isSystemDefault ?? false,
      assignedCount: initialData?.assignedCount ?? 0,
      permissions,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      {/* Modal Body (Scrollable) */}
      <div className="px-8 py-6 overflow-y-auto space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#191c1d] mb-1">
              Role Name
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-[#f8f9fa] border border-zinc-200 rounded-lg text-sm text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all"
              placeholder="e.g., Regional Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#191c1d] mb-1">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#f8f9fa] border border-zinc-200 rounded-lg text-sm text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all resize-none"
              placeholder="Briefly describe the responsibilities of this role..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="h-px bg-zinc-200 w-full my-6" />

        {/* Permissions Matrix */}
        <div>
          <h3 className="text-lg font-semibold text-[#191c1d] mb-4">
            Permissions Matrix
          </h3>
          <div className="space-y-4">
            {permissionGroups.map((group) => {
              const IconComp = group.icon
              return (
                <div
                  key={group.name}
                  className="bg-[#f8f9fa] border border-zinc-200 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <IconComp size={20} className="text-[#111827]" />
                    <h4 className="text-sm font-semibold text-[#191c1d]">
                      {group.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                    {group.items.map((item) => {
                      const isChecked = activePermIds.includes(item.id)
                      return (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePerm(item.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-[#111827] focus:ring-[#111827] accent-[#111827] cursor-pointer transition-colors"
                          />
                          <span
                            className={`text-sm ${
                              isChecked
                                ? 'text-[#191c1d] font-medium'
                                : 'text-zinc-500'
                            }`}
                          >
                            {item.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-8 py-4 bg-[#f8f9fa] border-t border-zinc-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-sm font-semibold text-zinc-600 hover:text-[#191c1d] rounded-lg transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#111827] hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer active:scale-95 duration-150"
        >
          {initialData ? 'Save Changes' : 'Create Role'}
        </button>
      </div>
    </form>
  )
}

export default function RoleModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: RoleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#191c1d]">
              {initialData ? 'Edit Role' : 'Create New Role'}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Configure system access levels and operational clearance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-[#191c1d] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <RoleForm
          key={initialData?.id || 'new'}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  )
}
