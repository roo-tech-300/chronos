import { Link } from 'react-router-dom'
import appLogo from '../../assets/logo.png'
import { content } from '../../data/landing-content'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src={appLogo} alt="Chronos" className="navbar-logo" />
        <span>{content.company}</span>
      </Link>

      <ul className="navbar-links">
        {content.navLinks.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>

      <div className="navbar-actions">
        <Link to="/login" className="btn btn-ghost">Sign In</Link>
        <Link to="/login" className="btn btn-primary">Launch Portal</Link>
      </div>
    </nav>
  )
}
