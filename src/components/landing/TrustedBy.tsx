import futminnaLogo from '../../assets/logo.jpg'
import kangarooLogo from '../../assets/companies/KangarooTech.png'
import nataleLogo from '../../assets/companies/natale.png'
import { content } from '../../data/landing-content'

const logoMap: Record<string, string> = {
  'FUT Minna': futminnaLogo,
  'Kangaroo Tech': kangarooLogo,
  Natale: nataleLogo,
}

export default function TrustedBy() {
  return (
    <section className="trusted-section">
      <p className="trusted-label">Trusted by industry leaders</p>
      <div className="trusted-scroll">
        <div className="trusted-track">
          {content.trustedBy.map((inst) => (
            <div key={inst.abbreviation} className="trusted-card">
              <img
                src={logoMap[inst.abbreviation]}
                alt={inst.name}
                className="trusted-logo"
              />
              <span>{inst.abbreviation}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
