import { useState } from 'react'
import {
  Building2,
  Users,
  Layers,
  Sparkles,
  Save,
  CheckCircle2,
  Globe2,
} from 'lucide-react'
import type { OrganizationProfile } from '../../types/organization'
import {
  countTotalNodes,
  countTotalStaff,
  calculateMaxDepth,
} from '../../utils/hierarchyUtils'

interface OrgGeneralCardProps {
  profile: OrganizationProfile
  onUpdateProfile: (updated: Partial<OrganizationProfile>) => void
}

export default function OrgGeneralCard({
  profile,
  onUpdateProfile,
}: OrgGeneralCardProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    category: profile.category,
    topLeaderTitle: profile.topLeaderTitle,
    topLeaderName: profile.topLeaderName,
    deploymentLocation: profile.deploymentLocation,
  })
  const [savedSuccess, setSavedSuccess] = useState(false)

  const totalUnits = countTotalNodes(profile.hierarchyRoot)
  const totalStaff = countTotalStaff(profile.hierarchyRoot)
  const maxDepth = calculateMaxDepth(profile.hierarchyRoot)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateProfile(formData)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="w-full space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Enrolled Staff
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-[#111827] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2">{totalStaff}</p>
          <p className="text-xs text-zinc-500 mt-1">Biometrically active</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Hierarchy Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-[#111827] flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2">{totalUnits}</p>
          <p className="text-xs text-zinc-500 mt-1">Faculties, Depts & Units</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Structural Tiers
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-[#111827] flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2">{maxDepth} Levels</p>
          <p className="text-xs text-zinc-500 mt-1">Hierarchy depth</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Deployment
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-[#111827] flex items-center justify-center">
              <Globe2 size={16} />
            </div>
          </div>
          <p className="text-lg font-bold text-[#111827] mt-2 truncate">Production</p>
          <p className="text-xs text-zinc-500 mt-1 truncate">{profile.deploymentLocation}</p>
        </div>
      </div>

      {/* Main Profile Form Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-[#111827] border border-zinc-200 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">
                Institution &amp; Deployment Profile
              </h2>
              <p className="text-sm text-zinc-500">
                Configure enterprise identity, executive leadership, and physical locations.
              </p>
            </div>
          </div>

          <span className="bg-zinc-100 text-[#111827] border border-zinc-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {profile.category}
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4">
            {/* Field: Organization Name */}
            <div>
              <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
                Organization / Institution Name *
              </label>
              <input
                type="text"
                required
                className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none transition-all text-[14px] text-[#111827]"
                placeholder="e.g. Federal University of Technology Minna"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Field: Sector / Category */}
            <div>
              <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
                Sector / Institutional Category *
              </label>
              <input
                type="text"
                required
                className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none transition-all text-[#111827]"
                placeholder="e.g. Higher Education / University"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            {/* 2-Column: Leader Title & Leader Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
                  Top Executive Designation Title
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none transition-all text-[14px] text-[#111827]"
                  placeholder="e.g. Vice-Chancellor / CEO"
                  value={formData.topLeaderTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, topLeaderTitle: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
                  Top Executive Name
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none transition-all text-[14px] text-[#111827]"
                  placeholder="e.g. Prof. Faruk Adamu Kuta"
                  value={formData.topLeaderName}
                  onChange={(e) =>
                    setFormData({ ...formData, topLeaderName: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Field: Deployment Location */}
            <div>
              <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
                Primary Deployment Sites &amp; Campuses
              </label>
              <input
                type="text"
                className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none transition-all text-[14px] text-[#111827]"
                placeholder="e.g. Main Campus, Gidan Kwanu & Bosso Campuses, Minna"
                value={formData.deploymentLocation}
                onChange={(e) =>
                  setFormData({ ...formData, deploymentLocation: e.target.value })
                }
              />
            </div>
          </div>

          <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Sparkles size={14} className="text-[#111827]" />
              <span>Changes reflect globally across all department kiosks and nodes.</span>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#111827] hover:bg-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
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
