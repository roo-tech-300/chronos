export interface OrgWorkspace {
  id: string
  name: string
  logoId: string
  role: string
  memberCount: number
  category: string
  lastActive: string
}

export const workspaces: OrgWorkspace[] = [
  {
    id: 'futminna',
    name: 'FUT Minna',
    logoId: 'futminna',
    role: 'Administrator',
    memberCount: 24,
    category: 'Education',
    lastActive: 'Last active 30m ago',
  },
  {
    id: 'kangaroo',
    name: 'Kangaroo Technologies',
    logoId: 'kangaroo',
    role: 'Editor',
    memberCount: 18,
    category: 'Technology',
    lastActive: 'Last active 2h ago',
  },
  {
    id: 'natale',
    name: 'Natale',
    logoId: 'natale',
    role: 'Member',
    memberCount: 7,
    category: 'Sports & Fitness',
    lastActive: 'Joined March 2024',
  },
]
