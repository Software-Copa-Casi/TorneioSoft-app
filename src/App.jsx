import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import { useAuth } from './auth.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import TournamentForm from './pages/TournamentForm.jsx'
import TournamentDetail from './pages/TournamentDetail.jsx'
import TeamDetail from './pages/TeamDetail.jsx'
import MatchLive from './pages/MatchLive.jsx'

function Private({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return null
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/torneios/novo" element={<Private><TournamentForm /></Private>} />
          <Route path="/torneios/:id/editar" element={<Private><TournamentForm /></Private>} />
          <Route path="/torneios/:id" element={<TournamentDetail />} />
          <Route path="/torneios/:id/:tab" element={<TournamentDetail />} />
          <Route path="/torneios/:id/equipes/:teamId" element={<TeamDetail />} />
          <Route path="/torneios/:id/partidas/:matchId" element={<MatchLive />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
