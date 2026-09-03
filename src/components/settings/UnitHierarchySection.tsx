import { useMemo, useState } from 'react'
import { AlertTriangle, Building2, Plus } from 'lucide-react'
import type { OrgUnit } from '../../types/organization'
import { useWorkspace } from '../../context/useWorkspace'
import { useWorkspaceUnits } from '../../hooks/useOrganizationUnits'
import { useWorkspaceRoster } from '../../hooks/useWorkspaceRoster'
import { buildUnitTree, countDescendants } from '../../utils/orgUnitTree'
import HierarchyManager from './HierarchyManager'
import NodeEditorModal, { type UnitEditorSubmit } from './NodeEditorModal'
import { Button, Modal } from '../ui'

/**
 * Database-backed workspace hierarchy: loads organization_units through
 * useWorkspaceUnits, renders the live tree, and owns the create/edit/delete
 * flows (delete cascades to the whole subtree, hence the confirmation modal).
 */
export default function UnitHierarchySection() {
  const { currentWorkspace, isLoading: wsLoading, error: wsError } = useWorkspace()
  const workspaceId = currentWorkspace?.id || ''
  const {
    units,
    isLoading,
    error: unitsError,
    createUnit,
    updateUnit,
    deleteUnit,
    isDeleting,
  } = useWorkspaceUnits(workspaceId)
  const { roster } = useWorkspaceRoster(workspaceId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [parentNode, setParentNode] = useState<OrgUnit | null>(null)
  const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null)
  const [pendingDelete, setPendingDelete] = useState<OrgUnit | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const tree = useMemo(() => buildUnitTree(units), [units])
  const memberNameById = useMemo(
    () => Object.fromEntries(roster.map((member) => [member.memberId, member.name])),
    [roster],
  )
  const memberCountByUnit = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const member of roster) {
      if (!member.unitId) continue
      counts[member.unitId] = (counts[member.unitId] ?? 0) + 1
    }
    return counts
  }, [roster])

  const openCreate = (parent: OrgUnit | null) => {
    setParentNode(parent)
    setEditingUnit(null)
    setActionError(null)
    setEditorOpen(true)
  }

  const openEdit = (unit: OrgUnit) => {
    setParentNode(null)
    setEditingUnit(unit)
    setActionError(null)
    setEditorOpen(true)
  }

  const handleSubmit = async (payload: UnitEditorSubmit) => {
    setActionError(null)
    if (payload.unitId) {
      await updateUnit({
        unitId: payload.unitId,
        updates: {
          name: payload.name,
          code: payload.code,
          unitType: payload.unitType,
          headMemberId: payload.headMemberId,
        },
      })
    } else {
      await createUnit({
        workspaceId,
        name: payload.name,
        code: payload.code,
        unitType: payload.unitType,
        parentId: payload.parentId,
        headMemberId: payload.headMemberId,
      })
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setActionError(null)
    try {
      await deleteUnit(pendingDelete.id)
      setPendingDelete(null)
    } catch (err) {
      setPendingDelete(null)
      setActionError(err instanceof Error ? err.message : 'Failed to delete the unit.')
    }
  }

  if (wsError) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 text-center">
        <AlertTriangle size={28} className="mx-auto text-amber-500 mb-2" />
        <p className="text-sm font-semibold text-zinc-800">Could not load the workspace hierarchy</p>
        <p className="text-xs text-zinc-500 mt-1">{wsError}</p>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 text-center">
        <Building2 size={28} className="mx-auto text-zinc-300 mb-2" />
        <p className="text-sm font-semibold text-zinc-800">No workspace selected</p>
        <p className="text-xs text-zinc-500 mt-1">
          Choose a workspace from the organization hub to manage its hierarchy.
        </p>
      </div>
    )
  }

  const showSkeleton = (wsLoading || isLoading) && units.length === 0
  const deletingDescendants = pendingDelete ? countDescendants(units, pendingDelete.id) : 0

  return (
    <div className="w-full">
      {unitsError && (
        <div className="mb-4 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{unitsError}</span>
        </div>
      )}

      {actionError && (
        <div className="mb-4 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {showSkeleton ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 animate-pulse">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-100" />
              <div className="h-4 w-56 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <HierarchyManager
            rootNodes={tree}
            memberNameById={memberNameById}
            memberCountByUnit={memberCountByUnit}
            onAddChild={openCreate}
            onEditNode={openEdit}
            onDeleteNode={setPendingDelete}
          />

          {units.length === 0 && (
            <div className="mt-4 flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-4">
              <p className="text-xs text-zinc-500">
                Once your structure is in place, staff can be placed into units and leads gain
                approval authority over their subtree.
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={() => openCreate(null)}
              >
                Create First Unit
              </Button>
            </div>
          )}
        </>
      )}

      <NodeEditorModal
        isOpen={editorOpen}
        parentNode={parentNode}
        editingUnit={editingUnit}
        headName={
          editingUnit?.headMemberId ? memberNameById[editingUnit.headMemberId] ?? null : null
        }
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete unit?"
        subtitle={
          pendingDelete
            ? `This permanently removes "${pendingDelete.name}" from the hierarchy.`
            : undefined
        }
      >
        {pendingDelete && (
          <div className="space-y-5">
            <p className="text-sm text-zinc-600">
              {deletingDescendants > 0
                ? `${deletingDescendants} sub-unit(s) underneath will also be deleted. This cannot be undone.`
                : 'This cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="md" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={confirmDelete} isLoading={isDeleting}>
                Delete Unit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}