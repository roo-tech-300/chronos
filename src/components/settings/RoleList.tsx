import { useState } from 'react'
import {
  Users,
  ArrowRight,
  Edit3,
  Trash2,
  Plus,
} from 'lucide-react'
import type { OrgRole } from '../../types/organization'
import { Button, Toolbar } from '../ui'

interface RoleListProps {
  roles: OrgRole[]
  onAddRole: () => void
  onEditRole: (role: OrgRole) => void
  onDeleteRole: (roleId: string) => void
}

export default function RoleList({
  roles,
  onAddRole,
  onEditRole,
  onDeleteRole,
}: RoleListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPermissionTag = (permId: string, permLabel: string) => {
    return (
      <span
        key={permId}
        className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-zinc-100 text-[#111827] text-[11.5px] font-medium border border-zinc-200 transition-all hover:bg-zinc-200 select-none"
      >
        {permLabel}
      </span>
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Header Toolbar */}
      <Toolbar
        search={{
          placeholder: 'Search roles...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          onClear: () => setSearchQuery(''),
          width: 'w-full sm:w-80',
        }}
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={18} />}
            onClick={onAddRole}
          >
            Create New Role
          </Button>
        }
      />

      {/* Role Grid (3-Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => {
          const enabledPerms = role.permissions.filter((p) => p.enabled)

          return (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden"
            >
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h3 className="text-lg font-bold text-[#191c1d] leading-snug">
                    {role.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-[#111827] text-[12px] font-semibold border border-zinc-200 shrink-0">
                    <Users size={14} />
                    {role.assignedCount} Staff Assigned
                  </span>
                </div>

                <p className="text-sm text-zinc-600 mb-6 line-clamp-2 leading-relaxed">
                  {role.description}
                </p>

                <div className="mt-auto pt-5">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3.5">
                    Key Permissions
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {enabledPerms.slice(0, 4).map((perm) =>
                      getPermissionTag(perm.id, perm.label)
                    )}
                    {enabledPerms.length > 4 && (
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-zinc-100 text-[#111827] text-[11.5px] font-semibold border border-zinc-200">
                        +{enabledPerms.length - 4} more
                      </span>
                    )}
                    {enabledPerms.length === 0 && (
                      <span className="text-xs text-zinc-400 italic">None assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Bottom Bar */}
              <div className="px-6 py-4 border-t border-zinc-200 bg-[#f8f9fa] flex justify-between items-center rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => onEditRole(role)}
                  className="text-sm font-semibold text-[#111827] hover:text-black transition-colors flex items-center gap-1 cursor-pointer"
                >
                  View Details <ArrowRight size={16} />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditRole(role)}
                    className="p-1.5 text-zinc-500 hover:text-[#111827] rounded-md hover:bg-zinc-200/50 transition-colors cursor-pointer"
                    title="Edit Role"
                  >
                    <Edit3 size={18} />
                  </button>

                  {!role.isSystemDefault && (
                    <button
                      type="button"
                      onClick={() => onDeleteRole(role.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Role"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500">
          No roles match your search.
        </div>
      )}
    </div>
  )
}
