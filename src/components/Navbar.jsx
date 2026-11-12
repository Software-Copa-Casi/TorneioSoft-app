import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <img src="/ball.svg" alt="" width="28" height="28" />
          <span>Copa Casi</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>Torneios</NavLink>
          {user && <NavLink to="/torneios/novo">Novo torneio</NavLink>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">{user.username}</span>
              <button className="btn btn-ghost-light" onClick={() => { logout(); navigate('/') }}>Sair</button>
            </>
          ) : (
            <Link to="/entrar" className="btn btn-accent">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  )
}
