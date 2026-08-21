import appLogo from '../../assets/logo.png'
import { content } from '../../data/landing-content'

export default function Footer() {
  const { footer } = content

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo-row">
            <img src={appLogo} alt="Chronos" className="footer-logo" />
            <span>{content.company}</span>
          </div>
          <p className="footer-desc">{footer.description}</p>
        </div>

        {footer.columns.map((col) => (
          <div key={col.title}>
            <div className="footer-column-title">{col.title}</div>
            <ul className="footer-column-links">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>{footer.copyright}</span>
      </div>
    </footer>
  )
}
