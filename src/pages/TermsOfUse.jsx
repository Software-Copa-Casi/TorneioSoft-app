import { Link } from 'react-router-dom'
import { CONTROLLER, TERMS_VERSION, formatVersion } from '../legal/legalVersions.js'

/*
 * RASCUNHO dos Termos de Uso. Precisa de revisão por advogado antes de ir para produção.
 * Ao mudar o texto, troque TERMS_VERSION aqui e no back end.
 */
export default function TermsOfUse() {
  const c = CONTROLLER
  return (
    <article className="card legal-page">
      <h1>Termos de Uso</h1>
      <p className="muted small">Versão de {formatVersion(TERMS_VERSION)}</p>

      <p>
        Estes termos são as regras para usar o Copa Casi, um sistema para organizar e acompanhar torneios
        de futsal, oferecido por {c.name}, {c.document}. Ao criar uma conta, você concorda com eles.
      </p>

      <h2>1. A conta</h2>
      <ul>
        <li>Menores de 18 anos podem criar conta com a autorização de um dos pais ou do responsável legal,
          que responde pelo uso da conta pelo menor.</li>
        <li>Você deve informar dados verdadeiros, ter uma só conta e manter a sua senha em segredo.
          O que for feito com a sua conta é de sua responsabilidade.</li>
        <li>Você pode encerrar a sua conta quando quiser, pelo e-mail <a href={`mailto:${c.dpoEmail}`}>{c.dpoEmail}</a>.</li>
      </ul>

      <h2>2. Como a plataforma funciona</h2>
      <ul>
        <li><strong>Organizador:</strong> quem cria um torneio é o dono dele e é o único que pode editá-lo
          (equipes, jogadores, sorteio e partidas).</li>
        <li><strong>Observador:</strong> quem acompanha um torneio, público ou privado com código de acesso,
          só pode ver as informações.</li>
        <li>Torneios públicos podem ser vistos por qualquer pessoa, inclusive sem conta.</li>
      </ul>

      <h2>3. Responsabilidades do organizador</h2>
      <ul>
        <li>Cadastrar só os dados de equipes e jogadores necessários para o torneio, e com autorização deles.</li>
        <li>Para jogadores menores de idade, ter a autorização de pelo menos um dos pais ou do responsável legal.</li>
        <li>Garantir que tem direito de usar escudos, fotos, regulamentos e outros arquivos que enviar.</li>
        <li>Responder pelas regras, premiações e resultados do próprio torneio.</li>
      </ul>

      <h2>4. O que não é permitido</h2>
      <ul>
        <li>Usar a plataforma para algo ilegal, ofensivo, discriminatório ou que viole direitos de outras pessoas.</li>
        <li>Tentar acessar torneios ou contas sem permissão, quebrar a segurança ou sobrecarregar o sistema.</li>
        <li>Coletar dados de outros usuários ou jogadores de forma automatizada.</li>
      </ul>
      <p>Quem descumprir estes termos pode ter a conta suspensa ou excluída.</p>

      <h2>5. Propriedade intelectual</h2>
      <p>
        O software, a marca e o visual do Copa Casi pertencem a {c.name}. O conteúdo que você envia (escudos,
        fotos, regulamentos) continua sendo seu: você nos dá apenas a permissão de guardar e exibir esse
        conteúdo na plataforma, enquanto ele estiver nela.
      </p>

      <h2>6. Disponibilidade e responsabilidade</h2>
      <p>
        Buscamos manter o sistema no ar e os dados seguros, mas ele pode ficar fora do ar para manutenção ou
        por falhas. O Copa Casi não se responsabiliza por resultados, premiações ou decisões tomadas pelos
        organizadores dos torneios.
      </p>

      <h2>7. Dados pessoais</h2>
      <p>
        O uso dos seus dados está explicado na <Link to="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>8. Mudanças nestes termos</h2>
      <p>
        Podemos atualizar estes termos. Quando isso acontecer, a data da versão muda e avisamos na plataforma.
        Se você continuar usando a conta depois do aviso, os novos termos passam a valer.
      </p>

      <h2>9. Lei e foro</h2>
      <p>Estes termos seguem as leis do Brasil. Fica eleito o foro de [CIDADE/UF], ressalvado o foro do consumidor.</p>
    </article>
  )
}