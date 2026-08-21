import { Zap, Layers, WifiOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { content } from '../../data/landing-content'

const iconMap: Record<string, LucideIcon> = {
  Zap,
  Layers,
  WifiOff,
}

export default function Features() {
  const { features } = content

  return (
    <section className="features-section">
      <h2 className="features-title">{features.title}</h2>
      <div className="features-grid">
        {features.items.map((item) => {
          const Icon = iconMap[item.icon]
          return (
            <div key={item.title} className="feature-card">
              <div className="feature-icon">
                {Icon && <Icon size={22} />}
              </div>
              <h3 className="feature-card-title">{item.title}</h3>
              <p className="feature-card-desc">{item.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
