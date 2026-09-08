import { useEffect, useState } from 'react'
import { Input, Select } from '../ui'
import type { RecurrenceOption } from './TaskModal'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_WEEKS = ['First', 'Second', 'Third', 'Fourth', 'Last']
const DAILY_RULES = ['Every Weekday', 'Every Day']

interface TaskDueDatePickerProps {
  recurrence: RecurrenceOption
  onDueDateChange: (dueDate: string) => void
}

/**
 * Dynamic due-date builder driven by the selected recurrence rule.
 * One-off keeps a free-text date; daily/weekly/monthly compose a
 * human-readable rule (e.g. "Every first Monday of the month").
 */
export function TaskDueDatePicker({ recurrence, onDueDateChange }: TaskDueDatePickerProps) {
  const [dailyRule, setDailyRule] = useState('Every Weekday')
  const [weeklyDay, setWeeklyDay] = useState('Monday')
  const [monthWeek, setMonthWeek] = useState('First')
  const [monthDay, setMonthDay] = useState('Monday')
  const [customDueDate, setCustomDueDate] = useState('Today, 05:00 PM')

  const dueDate =
    recurrence === 'one_off'
      ? customDueDate
      : recurrence === 'daily'
        ? dailyRule
        : recurrence === 'weekly'
          ? `Every ${weeklyDay}`
          : `Every ${monthWeek} ${monthDay} of the month`

  useEffect(() => {
    onDueDateChange(dueDate)
  }, [dueDate, onDueDateChange])

  if (recurrence === 'one_off') {
    return (
      <Input
        label="Due Date / Expected Completion"
        placeholder="e.g. Today, 05:00 PM or Tomorrow"
        value={customDueDate}
        onChange={(e) => setCustomDueDate(e.target.value)}
      />
    )
  }

  if (recurrence === 'daily') {
    return (
      <Select
        label="Due Date Rule"
        options={DAILY_RULES.map((r) => ({ value: r, label: r }))}
        value={dailyRule}
        onChange={(e) => setDailyRule(e.target.value)}
      />
    )
  }

  if (recurrence === 'weekly') {
    return (
      <Select
        label="Due Day"
        options={WEEKDAYS.map((d) => ({ value: d, label: d }))}
        value={weeklyDay}
        onChange={(e) => setWeeklyDay(e.target.value)}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Select
        label="Week of Month"
        options={MONTH_WEEKS.map((w) => ({ value: w, label: w }))}
        value={monthWeek}
        onChange={(e) => setMonthWeek(e.target.value)}
      />
      <Select
        label="Due Day"
        options={WEEKDAYS.map((d) => ({ value: d, label: d }))}
        value={monthDay}
        onChange={(e) => setMonthDay(e.target.value)}
      />
    </div>
  )
}