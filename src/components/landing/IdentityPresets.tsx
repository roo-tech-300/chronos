import { useState } from 'react'
import { content, type Preset } from '../../data/landing-content'
import futminnaLogo from '../../assets/logo.jpg'
import kangarooLogo from '../../assets/companies/KangarooTech.png'
import nataleLogo from '../../assets/companies/natale.png'

interface Props {
  onPresetChange: (preset: Preset) => void
}

const logoMap: Record<string, string> = {
  futminna: futminnaLogo,
  kangaroo: kangarooLogo,
  natale: nataleLogo,
}

export default function IdentityPresets({ onPresetChange }: Props) {
  const [active, setActive] = useState(content.presets[0])

  const handleSelect = (preset: Preset) => {
    setActive(preset)
    onPresetChange(preset)
  }

  return (
    <section className="presets-section">
      <h2 className="presets-title">{content.dashboard.title}</h2>
      <p
        style={{
          textAlign: 'center',
          color: 'var(--lp-on-surface-variant)',
          maxWidth: 520,
          margin: '-16px auto var(--lp-space-md)',
          fontSize: 15,
          lineHeight: 1.6,
        }}
      >
        Switch between industry presets to see how Chronos adapts its visual
        identity and hierarchy instantly. Built for enterprise scale.
      </p>

      <div className="presets-switcher">
        {content.presets.map((preset) => (
          <button
            key={preset.id}
            className={`preset-btn${active.id === preset.id ? ' active' : ''}`}
            onClick={() => handleSelect(preset)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="preset-card">
        <div className="preset-card-logo">
          <img src={logoMap[active.id]} alt={active.name} />
        </div>

        <div className="preset-card-info">
          <div className="preset-card-institution">{active.institution}</div>
          <div className="preset-card-role">{active.role}</div>

          <div className="preset-card-stats">
            <div className="preset-stat">
              <div
                className="preset-stat-value"
                style={{ color: active.theme.primary }}
              >
                {active.stats.totalVerified}
              </div>
              <div className="preset-stat-label">Total Verified</div>
            </div>
            <div className="preset-stat">
              <div className="preset-progress">
                <div className="preset-progress-bar">
                  <div
                    className="preset-progress-fill"
                    style={{
                      width: `${active.stats.terminalProgress}%`,
                      background: active.theme.primaryContainer,
                    }}
                  />
                </div>
                <div className="preset-progress-label">
                  Terminal Deployment Progress {active.stats.terminalProgress}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
