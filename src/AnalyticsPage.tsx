import { useState } from 'react'
import { Download, MoreVertical } from 'lucide-react'
import { analyticsEntries } from './dummy/analytics-mock'
import AppNavbar from './components/layout/AppNavbar'
import { Button, Select, Badge, Pagination, Modal, Toolbar } from './components/ui'
import { evaluatePunctuality } from './services/shiftPolicyService'
import { PunctualityBadge } from './components/analytics/PunctualityBadge'
import { useWorkspace } from './context/useWorkspace'
import { useRealtimeAttendance } from './hooks/useRealtimeAttendance'
import './styles/analytics-page.css'
import './styles/analytics-table.css'
import './styles/analytics-modal.css'

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspace()
  useRealtimeAttendance(currentWorkspace?.id)

  const [exportOpen, setExportOpen] = useState(false)
  const [format, setFormat] = useState<'excel' | 'csv'>('excel')
  const [currentPage, setCurrentPage] = useState(1)

  const timeOptions = [
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
  ]

  const deptOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'sec-ops', label: 'Security Operations' },
    { value: 'core-infra', label: 'Core Infrastructure' },
    { value: 'tech-lab', label: 'Deep Tech Lab' },
  ]

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'staff', label: 'Staff' },
  ]

  const getLogBadgeVariant = (logType: string) => {
    const lt = logType.toLowerCase()
    if (lt.includes('in') || lt.includes('arrival') || lt.includes('entry') || lt.includes('access')) {
      return 'success'
    }
    if (lt.includes('out') || lt.includes('departure') || lt.includes('exit')) {
      return 'neutral'
    }
    return 'info'
  }

  return (
    <div className="an-page">
      <AppNavbar />

      <main className="an-main">
        <div className="an-header">
          <h1>Analytics</h1>
          <p>Review, verify, and export past attendance logs and sign-in timelines.</p>
        </div>

        <Toolbar
          className="mb-6"
          primaryAction={
            <Button
              variant="primary"
              leftIcon={<Download size={16} />}
              onClick={() => setExportOpen(true)}
            >
              Export to Spreadsheet
            </Button>
          }
          rightContent={
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-40">
                <Select options={timeOptions} defaultValue="this-week" />
              </div>
              <div className="w-48">
                <Select options={deptOptions} defaultValue="all" />
              </div>
              <div className="w-40">
                <Select options={roleOptions} defaultValue="all" />
              </div>
            </div>
          }
        />

        <div className="an-info-bar">Showing 1,284 entries for current filters</div>

        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Staff ID</th>
                <th>Staff Name / Dept</th>
                <th>Log Type</th>
                <th>Punctuality</th>
                <th>Station ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {analyticsEntries.map((e, i) => {
                const isEntry = e.logType.toLowerCase().includes('in') || e.logType.toLowerCase().includes('arrival')
                const [timePart, modifier] = e.time.split(' ')
                const [hStr, mStr] = timePart.split(':')
                let h = parseInt(hStr, 10)
                if (modifier === 'PM' && h < 12) h += 12
                if (modifier === 'AM' && h === 12) h = 0
                const fakeDate = new Date()
                fakeDate.setHours(h, parseInt(mStr, 10), 0)
                const punct = evaluatePunctuality(fakeDate, isEntry ? 'in' : 'out')

                return (
                  <tr key={i}>
                    <td>
                      <div>{e.date}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{e.time}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.staffId}</td>
                    <td>
                      <div className="an-cell-staff">
                        <span className="an-staff-name">{e.staffName}</span>
                        <span className="an-staff-dept">{e.department}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getLogBadgeVariant(e.logType)} showDot>
                        {e.logType}
                      </Badge>
                    </td>
                    <td>
                      <PunctualityBadge evaluation={punct} />
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{e.stationId}</td>
                    <td>
                      <button className="an-action-btn" aria-label="More options">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-6 py-2 border-t border-zinc-100">
            <Pagination
              currentPage={currentPage}
              totalPages={257}
              totalItems={1284}
              itemsPerPage={5}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Historical Ledger"
        subtitle="Generate audit-ready documentation"
        maxWidth="md"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                format === 'excel'
                  ? 'border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
              onClick={() => setFormat('excel')}
            >
              <div className="font-bold text-sm text-zinc-900">Excel Worksheet</div>
              <div className="text-xs text-zinc-500 mt-1">Best for analysis</div>
            </button>
            <button
              type="button"
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                format === 'csv'
                  ? 'border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
              onClick={() => setFormat('csv')}
            >
              <div className="font-bold text-sm text-zinc-900">CSV Data Flatfile</div>
              <div className="text-xs text-zinc-500 mt-1">Best for importing</div>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
              Group by Department
            </label>
            <label className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer">
              <input type="checkbox" className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
              Include Device Metadata
            </label>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 text-xs text-zinc-500 leading-relaxed">
            By downloading this ledger, you agree to handle this PII in accordance with the Chronos Security Policy and local data protection regulations.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<Download size={16} />}
              onClick={() => setExportOpen(false)}
            >
              Download Ledger
            </Button>
          </div>
        </div>
      </Modal>

      <footer className="an-footer">
        <div className="an-footer-inner">
          <div>
            <div className="an-footer-label">Natale Identity</div>
            <p className="an-footer-copy">&copy; 2025 Natale Identity Corp. All rights reserved.</p>
          </div>
          <div className="an-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security Whitepaper</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

