export interface Device {
  id: string
  name: string
  location: string
  status: 'Online' | 'Offline' | 'Maintenance'
  latency?: string
  alert?: string
}

export const devices: Device[] = [
  { id: 'DEV-01', name: 'Station #01', location: 'Main Entry Gate', status: 'Online', latency: '12ms' },
  { id: 'DEV-02', name: 'Station #02', location: 'North Wing Hallway', status: 'Online', latency: '18ms' },
  { id: 'DEV-03', name: 'Station #03', location: 'HR Reception', status: 'Offline', alert: 'Unreachable' },
  { id: 'DEV-04', name: 'Station #04', location: 'South Campus Lab', status: 'Online', latency: '15ms' },
  { id: 'DEV-05', name: 'Station #05', location: 'Executive Suites 4A', status: 'Online', latency: '9ms' },
  { id: 'DEV-06', name: 'Station #06', location: 'Logistics Hub B', status: 'Maintenance', alert: 'In Progress' },
]

export const deviceMetrics = {
  total: '128',
  active: '114',
  disconnected: '14',
}
