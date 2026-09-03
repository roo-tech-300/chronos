import { useState } from 'react'
import { Building2, Sparkles, Save, CheckCircle2 } from 'lucide-react'
import type { OrganizationProfile } from '../../types/organization'
import { useWorkspace } from '../../context/useWorkspace'

interface OrgGeneralCardProps {
  profile: OrganizationProfile
  onUpdateProfile: (updated: Partial<OrganizationProfile>) => void
}

export default function OrgGeneralCard({
  profile,
  onUpdateProfile,
}: OrgGeneralCardProps) {
  const { accentColor = '#7c007e' } = useWorkspace()
  const [formData, setFormData] = useState({
    name: profile.name,
    shortName: profile.shortName || 'FUT Minna',
    category: profile.category,
  })
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateProfile(formData)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
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
              <h2 className="text-lg font-bold text-zinc-900">
                Organization Profile
              </h2>
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
            {formData.category || profile.category}
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div className="p-6 space-y-5">
            {/* Field: Organization Name */}
            <div>
              <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
                Organization / Institution Name *
              </label>
              <input
                type="text"
                required
                className="w-full h-11 px-4 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c007e]/15 focus:border-[#7c007e] transition-all"
                placeholder="e.g. Federal University of Technology, Minna"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Field: Short Form Name / Acronym */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider">
                  Short Name / Acronym *
                </label>
                <span className="text-[11px] text-zinc-400">Display abbreviation</span>
              </div>
              <input
                type="text"
                required
                className="w-full h-11 px-4 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c007e]/15 focus:border-[#7c007e] transition-all"
                placeholder="e.g. FUT Minna"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              />
              <p className="text-[11.5px] text-zinc-400 mt-1.5">
                Compact title used on top navigation headers, kiosk scanners, and badges (e.g. <span className="font-medium text-zinc-600">FUT Minna</span>, <span className="font-medium text-zinc-600">UNILAG</span>, <span className="font-medium text-zinc-600">MIT</span>).
              </p>
            </div>

            {/* Field: Sector / Category */}
            <div>
              <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
                Sector / Institutional Category *
              </label>
              <input
                type="text"
                required
                className="w-full h-11 px-4 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c007e]/15 focus:border-[#7c007e] transition-all"
                placeholder="e.g. Higher Education / University"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Sparkles size={14} style={{ color: accentColor }} />
              <span>Changes reflect globally across all department kiosks and nodes.</span>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Saved Successfully
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Organization Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
