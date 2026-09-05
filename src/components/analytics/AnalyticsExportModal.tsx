import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button, Modal } from '../ui'

interface AnalyticsExportModalProps {
  open: boolean
  onClose: () => void
}

/** Export configuration dialog for the historical attendance ledger. */
export default function AnalyticsExportModal({ open, onClose }: AnalyticsExportModalProps) {
  const [format, setFormat] = useState<'excel' | 'csv'>('excel')

  return (
    <Modal
      open={open}
      onClose={onClose}
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Download size={16} />}
            onClick={onClose}
          >
            Download Ledger
          </Button>
        </div>
      </div>
    </Modal>
  )
}
