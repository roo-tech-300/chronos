import { useState } from 'react'
import type { OrgRole } from './types/organization'
import { initialRoles } from './dummy/organization-mock'
import { useWorkspace } from './context/useWorkspace'
import SettingsNav from './components/settings/SettingsNav'
import UnitHierarchySection from './components/settings/UnitHierarchySection'
import RoleList from './components/settings/RoleList'
import RoleModal from './components/settings/RoleModal'
import OrgGeneralCard from './components/settings/OrgGeneralCard'
import './styles/org-settings.css'

export default function OrgSettingsPage() {
  const { accentColor = '#7c007e' } = useWorkspace()
  const [roles, setRoles] = useState<OrgRole[]>(initialRoles)
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'roles'>('overview')

  // Role Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<OrgRole | null>(null)

  // Handlers for Roles
  const handleSaveRole = (roleData: OrgRole) => {
    setRoles((prev) => {
      const exists = prev.some((r) => r.id === roleData.id)
      return exists
        ? prev.map((r) => (r.id === roleData.id ? roleData : r))
        : [...prev, roleData]
    })
  }

  const handleDeleteRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
  }

  return (
    <div
      className="settings-page"
      style={{
        ['--accent-purple' as string]: accentColor,
        ['--accent-purple-light' as string]: `${accentColor}14`,
        ['--accent-purple-border' as string]: `${accentColor}40`,
      }}
    >
      <SettingsNav />

      <main className="settings-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 24px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Organization Hierarchy & Settings
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Define custom department terminology and manage reporting structures.
          </p>
        </div>

        {/* Tab row */}
        <div
          style={{
            display: 'flex',
            gap: 28,
            borderBottom: '1px solid #e5e7eb',
            marginBottom: 28,
          }}
        >
          <button
            type="button"
            style={{
              padding: '10px 0',
              fontSize: 13.5,
              fontWeight: activeTab === 'overview' ? 700 : 500,
              color: activeTab === 'overview' ? accentColor : '#4b5563',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? `2.5px solid ${accentColor}` : '2.5px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('overview')}
          >
            Organization Profile
          </button>
          <button
            type="button"
            style={{
              padding: '10px 0',
              fontSize: 13.5,
              fontWeight: activeTab === 'hierarchy' ? 700 : 500,
              color: activeTab === 'hierarchy' ? accentColor : '#4b5563',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'hierarchy' ? `2.5px solid ${accentColor}` : '2.5px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('hierarchy')}
          >
            Organization Units
          </button>
          <button
            type="button"
            style={{
              padding: '10px 0',
              fontSize: 13.5,
              fontWeight: activeTab === 'roles' ? 700 : 500,
              color: activeTab === 'roles' ? accentColor : '#4b5563',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'roles' ? `2.5px solid ${accentColor}` : '2.5px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('roles')}
          >
            Roles & Permissions
          </button>
        </div>

        {activeTab === 'hierarchy' && <UnitHierarchySection />}

        {activeTab === 'roles' && (
          <RoleList
            roles={roles}
            onAddRole={() => {
              setEditingRole(null)
              setRoleModalOpen(true)
            }}
            onEditRole={(r) => {
              setEditingRole(r)
              setRoleModalOpen(true)
            }}
            onDeleteRole={handleDeleteRole}
          />
        )}

        {activeTab === 'overview' && <OrgGeneralCard />}
      </main>

      <RoleModal
        isOpen={roleModalOpen}
        initialData={editingRole}
        onClose={() => setRoleModalOpen(false)}
        onSave={handleSaveRole}
      />
    </div>
  )
}
