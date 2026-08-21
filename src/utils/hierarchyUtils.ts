import type { HierarchyNode } from '../types/organization'

export function countTotalNodes(node: HierarchyNode): number {
  return 1 + node.children.reduce((acc, child) => acc + countTotalNodes(child), 0)
}

export function countTotalStaff(node: HierarchyNode): number {
  return node.staffCount + node.children.reduce((acc, child) => acc + countTotalStaff(child), 0)
}

export function calculateMaxDepth(node: HierarchyNode): number {
  if (!node.children || node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(calculateMaxDepth))
}

export function findNodeById(root: HierarchyNode, id: string): HierarchyNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

export function addNodeChild(
  root: HierarchyNode,
  parentId: string,
  newNode: HierarchyNode
): HierarchyNode {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...root.children, { ...newNode, level: root.level + 1 }],
    }
  }
  return {
    ...root,
    children: root.children.map((child) => addNodeChild(child, parentId, newNode)),
  }
}

export function updateNode(
  root: HierarchyNode,
  nodeId: string,
  updatedData: Partial<HierarchyNode>
): HierarchyNode {
  if (root.id === nodeId) {
    return { ...root, ...updatedData }
  }
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, nodeId, updatedData)),
  }
}

export function deleteNode(root: HierarchyNode, nodeId: string): HierarchyNode {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== nodeId)
      .map((child) => deleteNode(child, nodeId)),
  }
}

export function getLevelLabel(level: number, levelNamings: { level: number; singular: string }[]): string {
  const match = levelNamings.find((n) => n.level === level)
  if (match) return match.singular
  return `Level ${level} Unit`
}
