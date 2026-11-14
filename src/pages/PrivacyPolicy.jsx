import { Link } from 'react-router-dom'
import { CONTROLLER, PRIVACY_VERSION, formatVersion } from '../legal/legalVersions.js'

/*
 * RASCUNHO da Política de Privacidade. Precisa de revisão por advogado especialista
 * em proteção de dados antes de ir para produção. Ao mudar o texto, troque PRIVACY_VERSION.
 */
export default function PrivacyPolicy() {
  const c = CONTROLLER
  return (
    <article className="card legal-page">
      <h1>Política de Privacidade</h1>
      <p className="muted small">Versão de {formatVersion(PRIVACY_VERSION)}</p>

      <p>
        Esta política explica, de forma simples, quais dados pessoais o Copa Casi coleta, para que usa,
        com quem compartilha, por quanto tempo guarda e como você pode exercer os seus direitos, conforme a
        Lei Geral de Proteção de Dados (Lei nº 13.709/2018, a LGPD).
      </p>

      <h2>1. Quem cuida dos seus dados</h2>
      <p>
        O controlador dos dados é {c.name}, {c.document}, {c.address}.
      </p>
      <p>
        <strong>Encarregado de Dados (DPO):</strong> {c.dpoName},{' '}
        e-mail <a href={`mailto:${c.dpoEmail}`}>{c.dpoEmail}</a>. É por esse contato que você faz pedidos
        sobre os seus dados ou tira dúvidas sobre esta política.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li><strong>Para criar a sua conta:</strong> nome completo, CPF, data de nascimento, e-mail e senha. A senha é guardada
          criptografada (com hash), e ninguém da equipe consegue lê-la.</li>
        <li><strong>Prova de aceite:</strong> data e hora do cadastro, endereço IP, navegador usado, a versão
          dos Termos de Uso e desta política que você aceitou e, para menores de 18 anos, a declaração de
          autorização do responsável legal.</li>
        <li><strong>Dados que você insere ao organizar torneios:</strong> informações do torneio, das equipes
          (nome, escudo, e-mail de contato) e dos jogadores (nome, documento, data de nascimento, e-mail,
          gênero, posições e foto), além dos lances das partidas.</li>
        <li><strong>Dados técnicos:</strong> endereço IP e horário das requisições, usados para segurança e para
          limitar tentativas abusivas. O seu acesso fica salvo no próprio navegador (armazenamento local),
          e não usamos cookies de publicidade ou rastreamento.</li>
      </ul>
      <p>Não pedimos telefone nem endereço no cadastro, porque não precisamos deles agora.</p>

      <h2>3. Para que usamos e com qual base legal</h2>
      <table className="legal-table">
        <thead><tr><th>Finalidade</th><th>Base legal (LGPD)</th></tr></thead>
        <tbody>
          <tr><td>Criar e manter a sua conta, permitir o login e identificar você de forma única (CPF)</td><td>Execução de contrato (art. 7º, V)</td></tr>
          <tr><td>Aplicar os limites de idade de torneios que tenham essa regra e saber se você é menor de idade (data de nascimento)</td><td>Execução de contrato (art. 7º, V)</td></tr>
          <tr><td>Organizar torneios, equipes, jogadores, partidas, classificação e estatísticas</td><td>Execução de contrato (art. 7º, V)</td></tr>
          <tr><td>Guardar a prova de que você aceitou os Termos e esta política</td><td>Cumprimento de obrigação legal e exercício regular de direitos (art. 7º, II e VI)</td></tr>
          <tr><td>Segurança: evitar fraude, ataques e contas duplicadas</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Não enviamos e-mail de marketing</strong> nem vendemos ou alugamos dados pessoais. Se um dia
        quisermos enviar novidades, vamos pedir o seu consentimento separadamente, com uma opção desmarcada.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <ul>
        <li><strong>Outros usuários:</strong> torneios públicos (com equipes, jogadores, partidas e
          estatísticas) podem ser vistos por qualquer pessoa. Torneios privados só por quem tem o código de
          acesso. O e-mail de contato das equipes só aparece para quem organiza o torneio.</li>
        <li><strong>Fornecedores de infraestrutura:</strong> empresas de hospedagem e banco de dados que
          guardam os dados em nosso nome, sob contrato e com obrigação de sigilo.
          [INFORMAR SE O SERVIDOR FICA FORA DO BRASIL, o que é transferência internacional.]</li>
        <li><strong>Autoridades:</strong> quando houver obrigação legal ou ordem judicial.</li>
      </ul>

      <h2>5. Por quanto tempo guardamos</h2>
      <ul>
        <li>Dados da conta: enquanto a conta existir. Quando você pedir a exclusão, apagamos em até 30 dias.</li>
        <li>Prova de aceite e registros de acesso: pelo prazo exigido por lei (o Marco Civil da Internet exige
          ao menos 6 meses para registros de acesso) e, para defesa em eventual processo, até 5 anos após o
          fim da conta.</li>
        <li>Dados de torneios: enquanto o organizador mantiver o torneio no sistema.</li>
      </ul>

      <h2>6. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode, a qualquer momento e sem custo:</p>
      <ul>
        <li>confirmar se tratamos seus dados e ter acesso a eles;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>pedir a exclusão da conta e dos dados, salvo os que a lei obriga a guardar;</li>
        <li>pedir a portabilidade dos dados e saber com quem foram compartilhados;</li>
        <li>revogar um consentimento que tenha dado e se opor a um tratamento.</li>
      </ul>
      <p>
        Faça o pedido pelo e-mail <a href={`mailto:${c.dpoEmail}`}>{c.dpoEmail}</a>. Respondemos em até 15 dias.
        Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.
      </p>

      <h2>7. Crianças e adolescentes</h2>
      <p>
        Menores de 18 anos podem criar conta para acompanhar torneios, desde que tenham a autorização de pelo
        menos um dos pais ou do responsável legal, que deve ler esta política. No cadastro, o menor declara
        essa autorização, e guardamos a data, a hora e o IP da declaração. Tratamos os dados de crianças e
        adolescentes sempre no melhor interesse deles (art. 14 da LGPD), coletamos só o necessário e não
        usamos esses dados para publicidade. O responsável pode pedir a qualquer momento, pelo e-mail do
        Encarregado, o acesso, a correção ou a exclusão da conta do menor.
      </p>
      <p>
        Quando um organizador cadastra jogadores menores de idade, ele é responsável por ter a autorização de
        pelo menos um dos pais ou do responsável legal e por cadastrar apenas os dados necessários para o torneio.
      </p>
      {/* TODO advogado: para crianças (até 12 anos incompletos) o art. 14, §1º pede consentimento específico
          dado por um dos pais. A declaração feita pelo próprio menor pode não bastar. Avaliar exigir que o
          responsável confirme por e-mail ou crie a conta. */}

      <h2>8. Segurança</h2>
      <p>
        Usamos conexão criptografada, senhas com hash, controle de acesso por organizador e limite de
        tentativas de login. Se houver um incidente de segurança que possa trazer risco a você, avisaremos
        você e a ANPD.
      </p>

      <h2>9. Mudanças nesta política</h2>
      <p>
        Quando esta política mudar, a data da versão no topo muda e avisamos na plataforma. As versões
        anteriores ficam guardadas.
      </p>

      <p className="small muted">Veja também os <Link to="/termos">Termos de Uso</Link>.</p>
    </article>
  )
}