export type TerminalStatus = 'online' | 'offline' | 'unpaired'
export type TerminalMode = 'entry' | 'exit' | 'bidirectional'

export interface TerminalDevice {
  id: string
  workspaceId?: string
  name: string
  location: string
  departmentId?: string
  departmentName?: string
  mode: TerminalMode
  status: TerminalStatus
  deviceToken?: string
  hardwareId?: string
  lastIpAddress?: string
  lastHeartbeatAt?: string
  pairedAt?: string
  pairingCode?: string
  pairingExpiresAt?: string
  createdAt: string
}

export interface PairingSession {
  terminalId: string
  terminalName: string
  pairingCode: string
  expiresAt: string
  qrData?: string
}

export interface PairingResult {
  success: boolean
  deviceToken?: string
  terminal?: TerminalDevice
  error?: string
}

export interface ScannerHardwareStatus {
  isConnected: boolean
  deviceModel: string
  serialNumber?: string
  driverVersion?: string
  bridgeVersion?: string
  error?: string
}

export interface NodeBridgeMatch {
  id: string
  studentId?: string
  memberId?: string
  name?: string
  department?: string
  role?: string
  confidence?: number
  score?: number
}

export interface BiometricCapturePayload {
  event?: string
  matched?: boolean
  match?: NodeBridgeMatch
  templateHash?: string
  qualityScore?: number
  scannerModel?: string
  capturedAt?: string
  status?: string
  error?: string
  message?: string
}
