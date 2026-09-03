import type { OrgUnit } from '../types/organization'

/** A DB unit expanded with its children, ready for recursive tree rendering. */
export interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[]
}

/**
 * Builds a nested tree from the flat, path-ordered unit list returned by
 * fetchWorkspaceUnits. Parents always precede children in that ordering,
 * so a single pass over the list is enough.
 */
export function buildUnitTree(units: OrgUnit[]): OrgUnitNode[] {
  const nodeById = new Map<string, OrgUnitNode>()
  const roots: OrgUnitNode[] = []

  for (const unit of units) {
    nodeById.set(unit.id, { ...unit, children: [] })
  }
  for (const unit of units) {
    const node = nodeById.get(unit.id)
    if (!node) continue
    const parent = unit.parentId ? nodeById.get(unit.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  return roots
}

/**
 * Number of descendants below a unit (excluding itself) - used for the
 * "this will also delete N sub-units" confirmation.
 */
export function countDescendants(units: OrgUnit[], unitId: string): number {
  return units.filter((u) => u.ancestorIds.includes(unitId) && u.id !== unitId).length
}

/**
 * Chain of units from the workspace root down to the given unit (inclusive).
 * ancestor_ids is maintained root-first by the DB trigger, so the returned
 * order matches the breadcrumb direction.
 */
export function getUnitBreadcrumb(units: OrgUnit[], unit: OrgUnit): OrgUnit[] {
  const byId = new Map(units.map((u) => [u.id, u]))
  return unit.ancestorIds
    .map((id) => byId.get(id))
    .filter((u): u is OrgUnit => Boolean(u))
}

/**
 * Filters tree nodes against name/code, keeping matches AND their ancestor
 * chains so the tree structure stays intact around each hit.
 */
export function filterUnitTree(nodes: OrgUnitNode[], query: string): OrgUnitNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return nodes

  const walk = (node: OrgUnitNode): OrgUnitNode | null => {
    const children = node.children
      .map(walk)
      .filter((child): child is OrgUnitNode => child !== null)
    const selfMatch =
      node.name.toLowerCase().includes(q) || node.code.toLowerCase().includes(q)
    if (!selfMatch && children.length === 0) return null
    return { ...node, children }
  }

  return nodes.map(walk).filter((node): node is OrgUnitNode => node !== null)
}

/**
 * All unit ids inside the subtree of a unit (inclusive), derived from the
 * ancestor_ids arrays - the client-side mirror of get_unit_subtree_ids().
 */
export function collectSubtreeIds(units: OrgUnit[], unitId: string): string[] {
  return units.filter((u) => u.ancestorIds.includes(unitId)).map((u) => u.id)
}