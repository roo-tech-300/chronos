import { Link, useNavigate } from 'react-router-dom'
import appLogo from '../../assets/logo.png'
import { content } from '../../data/landing-content'
import { useAuth } from '../../context/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const { session, user } = useAuth()

  const handleGetStarted = () => {
    if (session || user) {
      navigate('/workspaces')
    } else {
      navigate('/login')
    }
  }

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
        <button
          type="button"
          onClick={handleGetStarted}
          className="btn btn-ghost"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={handleGetStarted}
          className="btn btn-primary"
        >
          Get started
        </button>
      </div>
    </nav>
  )
}
