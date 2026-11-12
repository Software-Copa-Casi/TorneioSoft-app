# Copa Casi – Front end

Interface em **React 19 + Vite** do MVP do sistema de gerenciamento de torneios de futsal. Consome a API do repositório do back end (Spring Boot).

## Telas

- **Home** com navbar e botão **Entrar**, lista de torneios.
- **Entrar**: login do usuário root.
- **Novo/editar torneio**: campos do RF32 e escolha do formato com campos dinâmicos (mata-mata, pontos corridos, grupos + mata-mata), incluindo regras de desempate ordenáveis e upload do regulamento em PDF.
- **Torneio** com abas:
  - *Visão geral*: dados e formato.
  - *Equipes*: cadastro de equipes (nome, e-mail, logo, descrição) até a quantidade definida.
  - *Sorteio*: com todas as equipes cadastradas, sorteia grupos/confrontos. O **modo apresentação** faz uma contagem regressiva e revela as equipes uma a uma, em tela cheia, com tempo configurável (2 a 8 s). Dá para reapresentar ou desfazer o sorteio.
  - *Rodadas*: jogos gerados automaticamente após o sorteio, agrupados por rodada, com filtro por grupo.
- **Equipe**: cadastro de jogadores (nome, CPF ou CRNM/RNE, nascimento, gênero, posições, foto, e-mail).

## Como rodar

Pré-requisito: Node 20+ e o back end rodando em `http://localhost:8080`.

```bash
npm install
npm run dev
```

Acesse http://localhost:5173. Usuário padrão: `root` / `root123` (configurado no back end).

Em desenvolvimento o Vite encaminha `/api` para `http://localhost:8080` (mude com `VITE_PROXY_TARGET`).
Para produção, gere o build com a URL da API:

```bash
VITE_API_URL=https://sua-api.exemplo.com/api npm run build
```

e libere a origem do front na variável `CORS_ORIGINS` do back end.
