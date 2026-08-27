export type TaskType = 'recurring' | 'special'
export type TaskPriority = 'high' | 'medium' | 'low'
// Exactly 3 distinct lifecycle states:
// 1. 'not_done': Not yet completed / pending / in-progress with reason / difficulty notes
// 2. 'submitted': Submitted by staff, awaiting HOD verification & approval
// 3. 'approved': Verified and approved by HOD
export type TaskStatus = 'not_done' | 'submitted' | 'approved'

export interface TaskItem {
  id: string
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assigneeName: string
  assigneeRole: string
  assigneeAvatar?: string
  department: string
  subDepartment: string
  recurrence?: string
  dueDate: string
  isToday?: boolean
  completedAt?: string
  proofNote?: string
  difficultyNote?: string
  estimatedMins?: number
  actualMins?: number
  verifiedBy?: string
  completionLinks?: string[]
}

// Payload captured by the staff "Task Action Drawer" each time a task is
// submitted for HOD review: completion note, optional evidence links, and the
// real time actually spent on the task.
export interface TaskSubmissionPayload {
  completionNote: string
  completionLinks: string[]
  actualMins: number
}

export interface StaffTaskGroup {
  name: string
  role: string
  subDepartment: string
  initials: string
  isLead?: boolean
  leadsSubDepartment?: string
  tasks: TaskItem[]
}

export const initialTasks: TaskItem[] = [
  // 1. Marcus Vance
  {
    id: 'TSK-101',
    title: 'Daily Biometric Reader Calibration & Sensor Wipe',
    description: 'Perform optical lens hygiene check and calibrate threshold sensitivity on Alpha-1 and Alpha-2.',
    type: 'recurring',
    priority: 'high',
    status: 'submitted',
    assigneeName: 'Marcus Vance',
    assigneeRole: 'Senior Hardware Tech',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Neural Hardware',
    recurrence: 'Every weekday at 08:30 AM',
    dueDate: 'Today, 09:00 AM',
    isToday: true,
    estimatedMins: 55,
    actualMins: 38,
    completedAt: 'Today, 08:47 AM',
    proofNote: 'Calibrated optical sensors on Alpha-1 & Alpha-2. Sensitivity benchmark reading is 99.4%. Cleaned glass surfaces with isopropyl alcohol wipes.',
  },
  {
    id: 'TSK-102',
    title: 'Quarterly Sensor Tamper Inspection',
    description: 'Audit terminal tampering sensors and power backup UPS batteries in Lab 3.',
    type: 'special',
    priority: 'medium',
    status: 'not_done',
    assigneeName: 'Marcus Vance',
    assigneeRole: 'Senior Hardware Tech',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Neural Hardware',
    dueDate: 'Today, 05:00 PM',
    isToday: true,
    estimatedMins: 90,
    difficultyNote: 'Access to Lab 3 server rack is temporarily locked for thermal cooling cycle until 03:00 PM.',
  },
  // 2. Elena Rostova
  {
    id: 'TSK-103',
    title: 'Morning Edge Compute Log Validation',
    description: 'Inspect edge cluster thermal states, packet drop rates, and local SQLite cache sync logs.',
    type: 'recurring',
    priority: 'medium',
    status: 'submitted',
    assigneeName: 'Elena Rostova',
    assigneeRole: 'Infrastructure Engineer',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Edge Compute',
    recurrence: 'Every morning at 09:00 AM',
    dueDate: 'Today, 10:00 AM',
    isToday: true,
    completedAt: 'Today, 09:35 AM',
    proofNote: 'Cluster node 04 rebalanced after brief packet retry spike; sync timestamps fully verified.',
  },
  {
    id: 'TSK-104',
    title: 'PostgreSQL Failover Gateway Check',
    description: 'Verify heartbeat latency on secondary sync cluster.',
    type: 'recurring',
    priority: 'low',
    status: 'approved',
    assigneeName: 'Elena Rostova',
    assigneeRole: 'Infrastructure Engineer',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Edge Compute',
    recurrence: 'Every weekday at 11:00 AM',
    dueDate: 'Today, 11:30 AM',
    isToday: true,
    verifiedBy: 'Dr. Robert Chen',
    completedAt: 'Today, 11:15 AM',
    proofNote: 'Heartbeat response steady at 4ms. No replication lag observed.',
  },
  // 3. Devon Miles
  {
    id: 'TSK-105',
    title: 'Firmware Patch 4.2.1 Deployment on Kiosk Terminals',
    description: 'Flash the cryptographic update package to prevent edge hash drift on autonomous gates.',
    type: 'special',
    priority: 'high',
    status: 'not_done',
    assigneeName: 'Devon Miles',
    assigneeRole: 'Security Systems Analyst',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Autonomous Systems',
    dueDate: 'Today, 04:00 PM',
    isToday: true,
    difficultyNote: 'Terminal 02 is currently occupied by active shift enrollment; will apply patch right after 02:00 PM.',
  },
  {
    id: 'TSK-106',
    title: 'Daily Perimeter Scanner Sync',
    description: 'Run checksum verification on RFID gate tokens.',
    type: 'recurring',
    priority: 'medium',
    status: 'approved',
    assigneeName: 'Devon Miles',
    assigneeRole: 'Security Systems Analyst',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Autonomous Systems',
    recurrence: 'Every morning at 08:00 AM',
    dueDate: 'Today, 08:30 AM',
    isToday: true,
    verifiedBy: 'Dr. Robert Chen',
    completedAt: 'Today, 08:22 AM',
    proofNote: 'Checksum validation matched 100% against root vault.',
  },
  // 4. Sarah Jenkins
  {
    id: 'TSK-107',
    title: 'Weekly Attendance Sync Audit Report',
    description: 'Compare cryptographic token ledger against active campus roster and verify anomaly flags.',
    type: 'recurring',
    priority: 'low',
    status: 'approved',
    assigneeName: 'Sarah Jenkins',
    assigneeRole: 'Lab Operations Manager',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Autonomous Systems',
    recurrence: 'Every Friday at 04:00 PM',
    dueDate: 'Today, 04:00 PM',
    isToday: true,
    verifiedBy: 'Dr. Robert Chen',
    completedAt: 'Today, 01:10 PM',
    proofNote: 'All lab staff accounted for. Zero mismatch anomalies.',
  },
  {
    id: 'TSK-108',
    title: 'Autonomous Turnstile Sensor Recalibration',
    description: 'Run alignment diagnostic on North Wing Turnstile 3 optical barriers.',
    type: 'special',
    priority: 'medium',
    status: 'not_done',
    assigneeName: 'Sarah Jenkins',
    assigneeRole: 'Lab Operations Manager',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Autonomous Systems',
    dueDate: 'Today, 06:00 PM',
    isToday: true,
    difficultyNote: 'Waiting for North Wing foot traffic to subside after afternoon shift swap.',
  },
  {
    id: 'TSK-109',
    title: 'Morning Lab Startup Safety Checklist',
    description: 'Verify sensor pre-heat, optical surface cleanliness, and power rail stability before the lab opens.',
    type: 'recurring',
    priority: 'high',
    status: 'approved',
    assigneeName: 'Marcus Vance',
    assigneeRole: 'Senior Hardware Tech',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Neural Hardware',
    recurrence: 'Every morning at 07:45 AM',
    dueDate: 'Today, 08:00 AM',
    isToday: true,
    estimatedMins: 25,
    actualMins: 20,
    verifiedBy: 'Dr. Robert Chen',
    completedAt: 'Today, 07:58 AM',
    proofNote: 'Pre-heat verified, optical lenses clean, power LEDs nominal across all four workbenches.',
  },
  {
    id: 'TSK-110',
    title: 'Optical Reader Firmware Hash Backup',
    description: 'Snapshot the local firmware vault hashes on Alpha-1 and push a checksum manifest to the edge vault.',
    type: 'special',
    priority: 'low',
    status: 'not_done',
    assigneeName: 'Marcus Vance',
    assigneeRole: 'Senior Hardware Tech',
    department: 'Deep Tech & AI Labs',
    subDepartment: 'Neural Hardware',
    dueDate: 'Today, 04:30 PM',
    isToday: true,
    estimatedMins: 30,
  },
]