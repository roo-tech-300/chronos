import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { WorkspaceProfileUpdates } from '../../services/workspaceProfile'
import { useWorkspace } from '../../context/useWorkspace'
import { useUpdateWorkspaceProfile } from '../../hooks/useUpdateWorkspaceProfile'
import OrgProfileFields from './OrgProfileFields'

const EMPTY_FORM: WorkspaceProfileUpdates = { name: '', slug: '', category: 'Technology' }

/**
 * Workspace identity card. Reads the live row from public.workspaces via the
 * WorkspaceContext (already fetched from the database) and persists edits with
 * the updateWorkspaceProfile mutation. Falls back to clear states while the
 * row loads, when no workspace is selected, or when the fetch fails.
 */
export default function OrgGeneralCard() {
  const {
    currentWorkspace,
    isLoading,
    error: workspaceError,
    accentColor = '#7c007e',
  } = useWorkspace()
  const { saveProfile, isSaving, saveError } = useUpdateWorkspaceProfile()
  const [formData, setFormData] = useState<WorkspaceProfileUpdates>(EMPTY_FORM)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const successTimerRef = useRef<number | null>(null)

  // Re-sync the editable fields whenever the database row (re)loads or is
  // refreshed after a save, so normalized values (e.g. slug casing) show up.
  useEffect(() => {
    if (!currentWorkspace) return
    setFormData({
      name: currentWorkspace.name,
      slug: currentWorkspace.slug,
      category: currentWorkspace.category || 'Technology',
    })
  }, [currentWorkspace?.id, currentWorkspace?.name, currentWorkspace?.slug, currentWorkspace?.category])

  // Clear the autonomous success timer on unmount.
  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current)
    }
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace) return
    saveProfile(
      { workspaceId: currentWorkspace.id, ...formData },
      {
        onSuccess: () => {
          setSavedSuccess(true)
          if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current)
          successTimerRef.current = window.setTimeout(() => setSavedSuccess(false), 2500)
        },
      }
    )
  }
  return (
    <div className="w-full">
      {/* Main Profile Form Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${accentColor}12`,
                borderColor: `${accentColor}30`,
                color: accentColor,
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Organization Profile</h2>
              <p className="text-sm text-zinc-500">
                Configure enterprise identity, short name / acronym, and classification.
              </p>
            </div>
          </div>

          <span
            className="border px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${accentColor}10`,
              borderColor: `${accentColor}35`,
              color: accentColor,
            }}
          >
            {formData.category || '—'}
          </span>
        </div>

        {workspaceError ? (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="mx-auto text-amber-500 mb-2" />
            <p className="text-sm font-semibold text-zinc-800">Could not load the workspace profile</p>
            <p className="text-xs text-zinc-500 mt-1">{workspaceError}</p>
          </div>
        ) : !currentWorkspace && isLoading ? (
          <div className="p-6 space-y-5 animate-pulse">
            {[0, 1, 2].map((row) => (
              <div key={row}>
                <div className="h-3 w-40 bg-zinc-100 rounded mb-2" />
                <div className="h-11 w-full bg-zinc-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : !currentWorkspace ? (
          <div className="p-8 text-center">
            <Building2 size={28} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-semibold text-zinc-800">No workspace selected</p>
            <p className="text-xs text-zinc-500 mt-1">
              Choose a workspace from the organization hub to edit its profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <OrgProfileFields formData={formData} onChange={setFormData} disabled={isSaving} />

            <div className="p-6 bg-zinc-50 border-t border-zinc-100">
              {saveError && (
                <div className="mb-4 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              <div className="flex items-center justify-between">

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: accentColor }}
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Saved Successfully
                    </>
                  ) : isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Organization Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
