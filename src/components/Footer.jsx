import { Link } from 'react-router-dom'

/** Rodapé com os documentos legais, acessíveis de qualquer tela. */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span>© {new Date().getFullYear()} Copa Casi</span>
        <nav>
          <Link to="/termos">Termos de Uso</Link>
          <Link to="/privacidade">Política de Privacidade</Link>
        </nav>
      </div>
    </footer>
  )
}