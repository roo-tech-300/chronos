import { useState } from 'react'
import Navbar from './components/landing/Navbar'
import Hero from './components/landing/Hero'
import TrustedBy from './components/landing/TrustedBy'
import Features from './components/landing/Features'
import IdentityPresets from './components/landing/IdentityPresets'
import DashboardPreview from './components/landing/DashboardPreview'
import FAQ from './components/landing/FAQ'
import Footer from './components/landing/Footer'
import type { Preset } from './data/landing-content'
import './styles/landing-base.css'
import './styles/landing-hero.css'
import './styles/landing-sections.css'
import './styles/landing-faq-footer.css'

export default function LandingPage() {
  const [preset, setPreset] = useState<Preset | null>(null)

  const handlePresetChange = (p: Preset) => {
    setPreset(p)
  }

  const presetStyle = preset
    ? ({
        '--lp-primary': preset.theme.primary,
        '--lp-primary-container': preset.theme.primaryContainer,
        '--lp-secondary': preset.theme.secondary,
        '--lp-surface': preset.theme.surface,
        '--lp-on-surface': preset.theme.onSurface,
      } as React.CSSProperties)
    : undefined

  return (
    <div
      className="landing-page"
      data-preset={preset?.id ?? ''}
      style={presetStyle}
    >
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <IdentityPresets onPresetChange={handlePresetChange} />
      <DashboardPreview />
      <FAQ />
      <Footer />
    </div>
  )
}
