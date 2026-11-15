import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import { useAuth } from './auth.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import TournamentForm from './pages/TournamentForm.jsx'
import TournamentDetail from './pages/TournamentDetail.jsx'
import TeamDetail from './pages/TeamDetail.jsx'
import MatchLive from './pages/MatchLive.jsx'
import Register from './pages/Register.jsx'
import Footer from './components/Footer.jsx'
import ConfirmEmail from './pages/ConfirmEmail.jsx'
import { Alert } from './components/ui.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsOfUse from './pages/TermsOfUse.jsx'
import './legal/legal.css'

function Private({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return null
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  return children
}

/** Aviso curto passado na navegação, ex.: navigate('/', { state: { flash: 'E-mail confirmado!' } }). */
function Flash() {
  const location = useLocation()
  const text = location.state?.flash
  return text ? <Alert kind="success">{text}</Alert> : null
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Flash />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/torneios/novo" element={<Private><TournamentForm /></Private>} />
          <Route path="/torneios/:id/editar" element={<Private><TournamentForm /></Private>} />
          <Route path="/torneios/:id" element={<TournamentDetail />} />
          <Route path="/torneios/:id/:tab" element={<TournamentDetail />} />
          <Route path="/torneios/:id/equipes/:teamId" element={<TeamDetail />} />
          <Route path="/torneios/:id/partidas/:matchId" element={<MatchLive />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/confirmar-email" element={<ConfirmEmail />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<TermsOfUse />} />


        </Routes>
      </main>
      <Footer />
    </>
  )
}
