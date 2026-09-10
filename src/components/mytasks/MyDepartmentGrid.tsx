import DepartmentUnitCard from '../tasks/DepartmentUnitCard'
import type { UserEnrolledUnit } from '../../hooks/useUserEnrolledUnits'

interface MyDepartmentGridProps {
  units: UserEnrolledUnit[]
  onSelectUnit: (unit: UserEnrolledUnit) => void
}

export default function MyDepartmentGrid({ units, onSelectUnit }: MyDepartmentGridProps) {
  return (
    <section aria-label="Enrolled departments">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Review by Department</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Select an enrolled department to review your assigned deliverables.
          </p>
        </div>
        <span className="tasks-badge">
          {units.length} {units.length === 1 ? 'Department' : 'Departments'}
        </span>
      </div>

      <div className="unit-grid">
        {units.map((unit) => (
          <DepartmentUnitCard
            key={unit.id}
            unitName={unit.name}
            leadName={unit.leadName}
            memberCount={unit.memberCount}
            summary={unit.summary}
            onSelect={() => onSelectUnit(unit)}
          />
        ))}
      </div>
    </section>
  )
}
