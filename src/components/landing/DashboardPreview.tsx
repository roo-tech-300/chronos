import { content } from '../../data/landing-content'

export default function DashboardPreview() {
  const { dashboard } = content

  return (
    <section className="dashboard-section">
      <div className="dashboard-card">
        <div className="dashboard-info">
          <div className="dashboard-institution">{dashboard.institution}</div>
          <div className="dashboard-role">{dashboard.role}</div>
        </div>

        <div className="dashboard-numbers">
          <div>
            <div className="dashboard-number-value">
              {dashboard.totalVerified}
            </div>
            <div className="dashboard-number-label">Total Verified</div>
          </div>
          <div>
            <div style={{ width: 120 }}>
              <div
                className="dashboard-progress-fill"
                style={{ width: `${dashboard.terminalProgress}%` }}
              />
            </div>
            <div className="dashboard-number-label">
              Terminal Deployment Progress {dashboard.terminalProgress}%
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
