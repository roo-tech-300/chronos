import { useState } from 'react'
import { Clock, Plus, Check, Shield } from 'lucide-react'
import { useWorkspace } from '../../context/useWorkspace'
import {
  getWorkspaceShifts,
  saveWorkspaceShifts,
} from '../../services/shiftPolicyService'
import type { ShiftProfile } from '../../types/shifts'
import { Button } from '../ui'

export default function ShiftPolicyCard() {
  const { currentWorkspace, accentColor = '#7c007e' } = useWorkspace()
  const workspaceId = currentWorkspace?.id || 'default'

  const [shifts, setShifts] = useState<ShiftProfile[]>(() => getWorkspaceShifts(workspaceId))
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleUpdateShift = (index: number, updates: Partial<ShiftProfile>) => {
    const updated = [...shifts]
    updated[index] = { ...updated[index], ...updates }
    setShifts(updated)
  }

  const handleAddShift = () => {
    const newShift: ShiftProfile = {
      id: `shift_${Date.now()}`,
      workspaceId,
      name: 'New Custom Shift',
      startTime: '09:00',
      endTime: '17:30',
      gracePeriodMins: 15,
      lateThresholdMins: 30,
      overtimeThresholdMins: 60,
      workDays: [1, 2, 3, 4, 5],
      isDefault: false,
    }
    setShifts([...shifts, newShift])
  }

  const handleSave = () => {
    saveWorkspaceShifts(workspaceId, shifts)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-zinc-100">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Clock size={20} style={{ color: accentColor }} />
            <span>Shift Scheduling & Attendance Policies</span>
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Define standard work shifts, morning grace periods, and overtime thresholds applied across attendance logs.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={handleAddShift}
        >
          Add Shift
        </Button>
      </div>

      <div className="divide-y divide-zinc-100 my-4">
        {shifts.map((shift, idx) => (
          <div key={shift.id} className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={shift.name}
                onChange={(e) => handleUpdateShift(idx, { name: e.target.value })}
                className="font-semibold text-sm text-zinc-900 bg-transparent border-b border-dashed border-zinc-300 focus:border-zinc-900 focus:outline-none px-1"
              />
              {shift.isDefault && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield size={10} /> Default Shift
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={shift.startTime}
                  onChange={(e) => handleUpdateShift(idx, { startTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-zinc-500 font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={shift.endTime}
                  onChange={(e) => handleUpdateShift(idx, { endTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Grace Period (mins)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={shift.gracePeriodMins}
                  onChange={(e) => handleUpdateShift(idx, { gracePeriodMins: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Overtime Min (mins)</label>
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={shift.overtimeThresholdMins}
                  onChange={(e) => handleUpdateShift(idx, { overtimeThresholdMins: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
        {savedSuccess ? (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <Check size={14} /> Policies saved successfully
          </span>
        ) : (
          <span className="text-xs text-zinc-400">Punctuality calculations are refreshed automatically</span>
        )}
        <Button variant="primary" size="sm" onClick={handleSave}>
          Save Policy Changes
        </Button>
      </div>
    </div>
  )
}
