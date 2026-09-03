import type { WorkspaceProfileUpdates } from '../../services/workspaceProfile'

const INPUT_CLASS =
  'w-full h-11 px-4 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c007e]/15 focus:border-[#7c007e] transition-all'

const LABEL_CLASS = 'block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5'

interface OrgProfileFieldsProps {
  formData: WorkspaceProfileUpdates
  onChange: (next: WorkspaceProfileUpdates) => void
  disabled: boolean
}

/**
 * Atomic field blocks for the workspace identity form. Values map 1:1 onto
 * public.workspaces columns: name, slug (acronym) and category.
 */
export default function OrgProfileFields({
  formData,
  onChange,
  disabled,
}: OrgProfileFieldsProps) {
  return (
    <div className="p-6 space-y-5">
      {/* Field: Organization Name -> workspaces.name */}
      <div>
        <label htmlFor="org-name" className={LABEL_CLASS}>
          Organization Name
        </label>
        <input
          id="org-name"
          type="text"
          required
          disabled={disabled}
          className={INPUT_CLASS}
          placeholder="e.g. Federal University of Technology, Minna"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="org-slug" className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider">
            Short Name or Acronym
          </label>
        </div>
        <input
          id="org-slug"
          type="text"
          required
          disabled={disabled}
          className={INPUT_CLASS}
          placeholder="e.g. FUT Minna"
          value={formData.slug}
          onChange={(e) => onChange({ ...formData, slug: e.target.value })}
        />
        <p className="text-[11.5px] text-zinc-400 mt-1.5">
          Saved to the database exactly as you type it. Must be unique across all workspaces —
          used on top navigation headers, kiosk scanners, and badges.
        </p>
      </div>

      {/* Field: Sector / Category -> workspaces.category */}
      <div>
        <label htmlFor="org-category" className={LABEL_CLASS}>
          Sector
        </label>
        <input
          id="org-category"
          type="text"
          required
          disabled={disabled}
          className={INPUT_CLASS}
          placeholder="e.g. Higher Education / University"
          value={formData.category}
          onChange={(e) => onChange({ ...formData, category: e.target.value })}
        />
      </div>
    </div>
  )
}
