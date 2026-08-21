import { useState } from 'react'
import type { HierarchyNode, HierarchyLevelNaming, OrgRole, OrganizationProfile } from './types/organization'
import { defaultOrgProfile } from './dummy/organization-mock'
import { addNodeChild, updateNode, deleteNode } from './utils/hierarchyUtils'
import SettingsNav from './components/settings/SettingsNav'
import NomenclatureConfig from './components/settings/NomenclatureConfig'
import HierarchyManager from './components/settings/HierarchyManager'
import NodeEditorModal from './components/settings/NodeEditorModal'
import RoleList from './components/settings/RoleList'
import RoleModal from './components/settings/RoleModal'
import OrgGeneralCard from './components/settings/OrgGeneralCard'
import './styles/org-settings.css'

export default function OrgSettingsPage() {
  const [profile, setProfile] = useState<OrganizationProfile>(defaultOrgProfile)
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'roles'>('overview')
  const [namingDrawerOpen, setNamingDrawerOpen] = useState(false)

  // Node Modal State
  const [nodeModalOpen, setNodeModalOpen] = useState(false)
  const [selectedParentNode, setSelectedParentNode] = useState<HierarchyNode | null>(null)
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null)

  // Role Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<OrgRole | null>(null)

  // Handlers for Level Nomenclature
  const handleUpdateLevelNamings = (levelNamings: HierarchyLevelNaming[]) => {
    setProfile((prev) => ({ ...prev, levelNamings }))
  }

  // Handlers for Hierarchy Nodes
  const handleOpenAddChild = (parent: HierarchyNode) => {
    setSelectedParentNode(parent)
    setEditingNode(null)
    setNodeModalOpen(true)
  }

  const handleOpenEditNode = (node: HierarchyNode) => {
    setSelectedParentNode(null)
    setEditingNode(node)
    setNodeModalOpen(true)
  }

  const handleSaveNode = (nodeData: Omit<HierarchyNode, 'id' | 'children'> & { id?: string }) => {
    if (nodeData.id) {
      // Edit existing node
      setProfile((prev) => ({
        ...prev,
        hierarchyRoot: updateNode(prev.hierarchyRoot, nodeData.id!, nodeData),
      }))
    } else if (selectedParentNode) {
      // Add child node
      const newNode: HierarchyNode = {
        ...nodeData,
        id: `node-${Date.now()}`,
        children: [],
      }
      setProfile((prev) => ({
        ...prev,
        hierarchyRoot: addNodeChild(prev.hierarchyRoot, selectedParentNode.id, newNode),
      }))
    }
  }

  const handleDeleteNode = (nodeId: string) => {
    setProfile((prev) => ({
      ...prev,
      hierarchyRoot: deleteNode(prev.hierarchyRoot, nodeId),
    }))
  }

  // Handlers for Roles
  const handleSaveRole = (roleData: OrgRole) => {
    setProfile((prev) => {
      const exists = prev.roles.some((r) => r.id === roleData.id)
      const nextRoles = exists
        ? prev.roles.map((r) => (r.id === roleData.id ? roleData : r))
        : [...prev.roles, roleData]
      return { ...prev, roles: nextRoles }
    })
  }

  const handleDeleteRole = (roleId: string) => {
    setProfile((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId),
    }))
  }

  return (
    <div className="settings-page">
      <SettingsNav />

      <main className="settings-main" style={{ maxWidth: 1200, padding: '32px 24px 80px' }}>
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
              color: activeTab === 'overview' ? '#7c007e' : '#4b5563',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2.5px solid #7c007e' : '2.5px solid transparent',
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
              color: activeTab === 'hierarchy' ? '#7c007e' : '#4b5563',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'hierarchy' ? '2.5px solid #7c007e' : '2.5px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('hierarchy')}
          >
            Hierarchy & Nomenclatures
          </button>
          <button
            type="button"
            style={{
              padding: '10px 0',
              fontSize: 13.5,
              fontWeight: activeTab === 'roles' ? 700 : 500,
              color: activeTab === 'roles' ? '#7c007e' : '#4b5563',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'roles' ? '2.5px solid #7c007e' : '2.5px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('roles')}
          >
            Roles & Permissions
          </button>
        </div>

        {activeTab === 'hierarchy' && (
          <div>
            <HierarchyManager
              rootNode={profile.hierarchyRoot}
              levelNamings={profile.levelNamings}
              onOpenNamingRules={() => setNamingDrawerOpen(true)}
              onAddChild={handleOpenAddChild}
              onEditNode={handleOpenEditNode}
              onDeleteNode={handleDeleteNode}
            />

            <NomenclatureConfig
              isOpen={namingDrawerOpen}
              onClose={() => setNamingDrawerOpen(false)}
              levelNamings={profile.levelNamings}
              onUpdateLevelNamings={handleUpdateLevelNamings}
            />
          </div>
        )}

        {activeTab === 'roles' && (
          <RoleList
            roles={profile.roles}
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

        {activeTab === 'overview' && (
          <OrgGeneralCard
            profile={profile}
            onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
          />
        )}
      </main>

      <NodeEditorModal
        isOpen={nodeModalOpen}
        parentNode={selectedParentNode}
        editingNode={editingNode}
        levelNamings={profile.levelNamings}
        onClose={() => setNodeModalOpen(false)}
        onSave={handleSaveNode}
      />

      <RoleModal
        isOpen={roleModalOpen}
        initialData={editingRole}
        onClose={() => setRoleModalOpen(false)}
        onSave={handleSaveRole}
      />
    </div>
  )
}
