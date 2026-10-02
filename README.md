# EduQuest

Plataforma web de ensino gamificada: cursos → módulos → aulas, exercícios, avaliações, progresso acadêmico e gamificação (XP, níveis, conquistas, moedas, loja) calculada no servidor.

**Equipe (AP1):** Breno Yuri Saraiva Sawaki · Jessica Lopes Melo

**URL pública (AP1):** `https://eduquest-n1jj.onrender.com/` — ver [§15](#15-deploy-url-pública).

## 1. Visão geral

- **O que é:** o EduQuest combina uma camada de ensino (cursos, módulos, aulas, exercícios, avaliações, progresso) com uma camada de gamificação (XP, níveis, conquistas, missões, desafios, rankings, moedas, loja, inventário), mais perfis, notificações, recursos sociais, analytics, certificados e administração. Detalhes: `SPEC/2026-09-30-visao-geral.md`.
- **Objetivo:** estudantes consomem conteúdo e evoluem; professores autorem cursos; administradores gerenciem usuários e configuração. Regra de ouro: **toda recompensa é calculada no servidor** — o cliente apenas exibe.
- **Stack** (decidida na SPEC técnica aprovada, `SPEC/2026-09-30-tecnica-fundacoes.md` §2.1):
  - Backend: **Node.js + TypeScript + Express 5**
  - Frontend: **React 19 + Vite 6** (SPA)
  - Dados: **PostgreSQL 17 + Prisma 6**
  - Testes: **Vitest 3** (+ Supertest, Testing Library, jsdom)
  - Infra: **Docker Compose** (Postgres, app) + **Caddy** (proxy/TLS)
- **Estado atual:** ver [§9](#9-estado-atual).

## 2. Pré-requisitos

| Requisito | Versão usada no projeto | Onde está definido |
|---|---|---|
| Node.js | 24 (imagem `node:24-slim`; `@types/node` ^24) | `Dockerfile`, `package.json` |
| npm | distribuída com o Node (usa `npm ci` no build) | `Dockerfile`, `package-lock.json` |
| Docker + Docker Compose | qualquer versão com suporte a `docker compose` | `docker-compose.yml` |
| PostgreSQL | 17 (imagem `postgres:17-alpine`) — só se não usar o container do compose | `docker-compose.yml` |
| Git | qualquer versão recente | repositório |

Não há outros requisitos (nenhum serviço externo, nenhuma ferramenta adicional).

## 3. Instalação

```bash
# 1. clonar
git clone <url-do-repositorio> eduquest
cd eduquest

# 2. dependências
npm install

# 3. ambiente
cp .env.example .env
# edite .env se necessário (veja §4)

# 4. banco de dados (Postgres em container, porta 5434)
npm run db:up

# 5. Prisma: client + migrations
npm run db:generate
npm run db:migrate

# 6. executar (em dois terminais)
npm run dev:server   # API em http://localhost:3000
npm run dev:web      # frontend em http://localhost:5173 (proxy /api → :3000)
```

Pronto: abra a URL que o Vite imprimir. Em produção o build é servido pelo próprio backend:

```bash
npm run build
npm start            # http://localhost:3000 (serve API + dist/web)
```

Contêineres completos (app + banco + proxy): `docker compose up -d --build` (app na porta 3000, Caddy na 443).

> O `.env` está no `.gitignore` — nunca é commitado. Use `.env.example` como modelo.

## 4. Variáveis de ambiente

Modelo: [`.env.example`](.env.example).

| Variável | Obrigatória | Para que serve |
|---|---|---|
| `DATABASE_URL` | sim | connection string do Prisma/Postgres (dev aponta para `localhost:5434`) |
| `SESSION_EXPIRATION_MINUTES` | sim | validade da sessão em minutos (falha ao subir se ausente — `src/server/config.ts`) |
| `RESET_TOKEN_EXPIRATION_MINUTES` | sim | validade do token de recuperação de senha |
| `BCRYPT_COST` | não (padrão 10) | custo do hash de senha |
| `PORT` | não (padrão 3000) | porta do servidor Express |
| `WEB_DIR` | não (padrão `dist/web`) | pasta do frontend servida em produção |
| `TEST_DATABASE_URL` | não | banco dos testes (padrão: `postgresql://…@127.0.0.1:5434/eduquest_test` — `tests/configuracao/variaveis.ts`) |

Os testes **não usam o `.env`**: `vitest.config.ts` fixa `DATABASE_URL` do banco de teste e `BCRYPT_COST=4`.

## 5. Comandos úteis

Todos existem em `package.json`:

| Comando | O que faz |
|---|---|
| `npm run dev:server` | backend em watch (`tsx watch src/server/index.ts`) |
| `npm run dev:web` | frontend Vite com proxy `/api` → `:3000` |
| `npm run build` | `build:server` (tsc → `dist/server`) + `build:web` (vite → `dist/web`) |
| `npm start` | produção: `node dist/server/index.js` |
| `npm run typecheck` | `tsc --noEmit` nos 3 projetos (server, web, tests) |
| `npm test` | suíte inteira uma vez (`vitest run`) |
| `npm run test:watch` | vitest em watch |
| `npm run db:up` | sobe só o Postgres (`docker compose up -d db`) |
| `npm run db:down` | derruba os containers (`docker compose down`) |
| `npm run db:migrate` | `prisma migrate dev` (cria/aplica migration) |
| `npm run db:generate` | regenera o client do Prisma |

**Não existe script de lint** neste projeto — a checagem de tipos é o `typecheck`.

Útil fora do `package.json`:

```bash
npx prisma migrate deploy      # aplica migrations pendentes sem criar (usado pelos testes)
npx tsx scripts/gerar-token-recuperacao.ts <email>   # imprime token de reset (dev/ops)
```

## 6. Testes

```bash
npm test            # 201 testes, 24 arquivos — deve passar 100%
npm run test:watch  # modo watch
```

- **Banco de teste:** `eduquest_test` (mesma instância do compose, porta 5434). Ele é criado automaticamente pelo init do container (`infra/initdb/01-init.sql`) quando você roda `npm run db:up` pela primeira vez; a URL vem de `TEST_DATABASE_URL`.
- **Migrations de teste:** rodam sozinhas — `tests/configuracao/global.ts` executa `npx prisma migrate deploy` contra o banco de teste antes da suíte. Não é preciso migrar na mão.
- **Verde:** a saída final deve ser `Test Files 17 passed (17)` / `Tests 125 passed (125)` e `npm run typecheck` sem erros.
- **Timeout ocasional:** em máquina carregada, um teste pode estourar o limite padrão de 5 s do Vitest (visto uma vez em `tests/api/conclusao.test.ts`, que passa isolado). Se acontecer, rode o arquivo isolado antes de investigar.
- Cobertura atual: API (auth, perfis, catálogo, conteúdo e anexos — TC-01–TC-20 da SPEC de conteúdo —, conclusão, progresso — AC-D6-6–AC-D6-12 —, questões e tentativas — TQ-01–TQ-16 da SPEC de D4 —, avaliações — TA-01–TA-14 da SPEC de D5 —, health check), web (React: catálogo, questões/avaliações, progresso) e unidade (autorização).

## 7. Estrutura do projeto

```
src/server/          backend Express
  app.ts             cria a app (middlewares, rotas, static)
  index.ts           sobe o servidor na porta configurada
  config.ts          variáveis de ambiente (falha cedo se faltar)
  rotas/             auth, perfis, catalogo, questoes, avaliacoes (montadas em /api/v1)
  servicos/          regras de negócio (usuarios, sessoes, catalogo, …)
  middlewares/       sessão/papel
src/web/             frontend React (Vite; root = src/web)
  paginas/           Cadastro, Login, Recuperacao, Perfil, Catalogo
tests/               api/ · web/ · unidade/ · configuracao/ · utilidades/
prisma/              schema.prisma + migrations/ (versionadas)
SPEC/                especificações (fonte de requisitos — ver §10)
PLAN.md, TASKS.md    planejamento e tarefas (processo SDD)
docs/validacao/      relatórios de validação de fase (F2.md — T2.6; F3.md — T3.6)
prompts/             prompts usados no processo SDD (histórico)
scripts/             utilitários (ex.: token de recuperação)
infra/               initdb (cria eduquest_test) e caddy/Caddyfile
docker-compose.yml   serviços: db, app, caddy
```

Não existe pasta `diario/` neste repositório.

## 8. Arquitetura atual

- **Backend:** Express 5 + TypeScript, API versionada em **`/api/v1`**:
  - `/api/v1/auth` (registro, login, logout, recuperação), `/api/v1/perfis`, `/api/v1` (catálogo: cursos/módulos/aulas/conteúdo/anexos/conclusão; questões e tentativas de D4; avaliações, correção e resultado de D5).
  - Código `409` usado em D5 para estado: avaliação fora da janela, tentativas esgotadas, composição congelada.
  - Limite de corpo JSON: 8 MiB em `PUT /aulas/{id}/conteudo` e `POST /aulas/{id}/arquivos`; padrão nas demais. Corpo acima do limite → `400`.
  - Erros no padrão `{"erro": {"codigo", "mensagem"}}` com códigos `400/401/403/404` (`src/server/erros.ts`).
  - Organização: **rotas** (HTTP/validação) → **serviços** (regra de negócio) → **Prisma**.
- **Autenticação:** sessão por **cookie** (`eduquest_session`) com ID de sessão persistido em `sessao`; `middlewares/sessao.ts` carrega a sessão e há guards `exigirSessao`/`exigirPapel` (estudante, professor, administrador).
- **Dados:** Prisma ORM + PostgreSQL; schema em `prisma/schema.prisma`; migrations versionadas em `prisma/migrations/`; integridade com `ON DELETE CASCADE`. Binários de material anexo ficam no próprio Postgres (`arquivo.conteudo BYTEA`) — nenhum volume extra além do `dados-db`.
- **Frontend:** SPA React 19 servida em dev pelo Vite (proxy `/api`) e em produção pelo próprio Express (`dist/web`).
- **Decisões técnicas vinculantes:** `SPEC/2026-09-30-tecnica-fundacoes.md` (stack, convenções de modelo, contrato de erro, versionamento, sessão). Não reabrir sem revisão formal.

## 9. Estado atual

- **F1 — Identidade, acesso e perfis (D1, D2): implementada** (cadastro, login/logout/sessão, recuperação de senha, papéis, perfis).
- **F2 — Catálogo de aprendizagem (D3): implementada** (hierarquia curso > módulo > aula, publicação, autoria, consumo e conclusão de aula; **conteúdo de aula conforme DP-19**: lista ordenada de 0–50 blocos texto/mídia/anexo, upload de anexo JSON+base64 e download).
- **F3 — D4 (questões/exercícios): API e interface web implementadas** — 4 tipos de questão com gabarito protegido, tentativas corrigidas no servidor e feedback (F3-01–F3-06); UI do estudante em `src/web/paginas/Questoes.tsx` (**resolve P-30**).
- **F3 — D5 (avaliações): API e interface web implementadas** — avaliações com pesos, janela, limite de tentativas, nota 0–10 no servidor, correção manual de dissertativas e resultado = maior nota (F3-07–F3-15); UI em `src/web/paginas/Avaliacoes.tsx` (**resolve P-37**).
- **F4 — Progresso (D6): SPEC e implementação concluídas** — `SPEC/2026-10-01-progresso-aprendizagem.md` (T4.1, **resolve P-14** e P-15/P-16 na parcela progresso): flag `concluida` em `GET /aulas/{id}`, progresso derivado de `conclusao_aula` em `GET /cursos/{id}` (somente papel estudante, percentual `floor`), unicidade `(aula_id, usuario_id)` na migration F4, barra de progresso e contagem por módulo no curso.
- **Interface visual:** `SPEC/2026-10-01-identidade-visual-frontend.md` implementada (design system único com tokens, responsivo).
- **F5 — XP (D7, T5.2): concessão implementada no servidor** — 10 XP na 1ª conclusão de aula, 5 no 1º acerto de questão de exercício, 20 na 1ª entrega de avaliação + 3 por ponto de melhoria da maior nota (inclusive após correção manual); eventos idempotentes (`evento_xp`, chave única) e saldo (`saldo_xp`) na mesma transação da ação; campo aditivo `xp: {ganho, total, nivel, subiuNivel}` em F2-14/F3-06/F3-12 (TX-01–TX-09, TX-13, TX-17, TX-20).
- **F5 — Níveis e consulta (D7, T5.3): implementados** — `GET /api/v1/xp` (F5-01, só estudante) com XP total, XP da semana ISO em `America/Sao_Paulo` e faixa do nível; `nivel` preenchido no perfil do estudante (`null` para professor/admin; XP nunca exposto a terceiros); bloco "Experiência" com barra no perfil e avisos "+N XP"/"Subiu para o nível N" em aula, exercício e avaliação (TX-10–TX-12, TX-18, TX-19).
- **F5 — Configuração de XP (D7, T5.4): implementada** — `GET/PUT /api/v1/config/xp` (F5-02/F5-03, só administrador, inteiros 0–1.000) e `GET/PATCH /api/v1/cursos/{id}/config-xp` (F5-04/F5-05, professor dono ou administrador, ajuste 0–2× o global ou `null`); mudanças não retroativas e teto de 2× reaplicado no uso; tela **Administração** (menu visível só ao administrador) e seção **XP do curso** no detalhe do curso (TX-14–TX-16). **D7 (T5.2–T5.4) concluída.**
- **F5 — Conquistas (D8, T5.6): implementadas** — catálogo fixo de 10 conquistas gravado pela migração `f5_conquistas`; critérios avaliados sobre o estado verificado a cada ação (conclusão, resposta, envio e correção de avaliação), na mesma transação e depois do XP; desbloqueio permanente e idempotente (`desbloqueio_conquista`, UNIQUE por estudante e conquista), sem recompensa; `GET /api/v1/conquistas` (F5-06, só estudante) com progresso; perfil lista as desbloqueadas; campo aditivo `conquistas` em F2-14/F3-06/F3-12; catálogo no perfil e aviso "Conquista desbloqueada" na web (TC-01–TC-13).
- **Suíte: 201 testes passando** em 24 arquivos (`npm test`); **`npm run typecheck` passando** (ambos verificados em 2026-10-02).
- **Deploy:** aplicação publica na URL da [§15](#15-deploy-url-pública) — **Render** (Blueprint `render.yaml` + Docker + PostgreSQL gerenciado); migrations aplicadas automaticamente por `npx prisma migrate deploy` na subida do container e seed via `initialDeployHook` no primeiro deploy.
- **Contagem de código (`cloc`, 2026-10-01):** **10.049 linhas** em 69 arquivos (TypeScript 8.423, CSS 1.037, Prisma 289, SQL 258, Dockerfile 24, HTML 18), com `cloc . --vcs=git --exclude-dir=node_modules,vendor,dist,build,prompts --exclude-lang=Markdown,JSON,YAML,CSV,Text,SVG --not-match-f='(lock|\.min\.)'`.
- **DP-19 resolvida:** `SPEC/2026-09-30-conteudo-aula.md` **aprovada** após auditoria (§13 da SPEC); `PLAN.md`, `TASKS.md` (T2.3), `decisoes-pendentes.md` e SPEC D3 revisados formalmente. Pendências derivadas abertas: P-18–P-21.
- **DP-18 resolvida na parcela D8:** SPEC de D8 `SPEC/2026-10-02-conquistas.md` **aprovada** (catálogo fixo de 10 conquistas, critérios sobre o estado verificado, desbloqueio permanente e idempotente, sem recompensa na F5); `PLAN.md`, `TASKS.md` (T5.5, T5.6) e `decisoes-pendentes.md` revisados. Parcelas D9/D10/D12 seguem abertas.
- **DP-07 resolvida:** SPEC de D7 `SPEC/2026-10-02-xp-niveis.md` **aprovada** (XP por aula, 1º acerto e entrega/melhoria de nota de avaliação; curva de níveis progressiva; XP da semana; configuração global + ajuste por curso); `PLAN.md`, `TASKS.md` (T5.1–T5.4, T13.4) e `decisoes-pendentes.md` revisados.
- **DP-09 resolvida:** SPEC de D5 `SPEC/2026-10-01-avaliacoes.md` **aprovada** (avaliação do curso, nota 0–10 com pesos, correção manual de dissertativas pelo professor, resultado = maior nota).
- **DP-08 resolvida:** SPEC de D4 `SPEC/2026-10-01-questoes-exercicios.md` **aprovada** (4 tipos de questão; questão pertence ao módulo); `PLAN.md`, `TASKS.md` e `decisoes-pendentes.md` revisados.
- Outras SPECs: visão geral, técnica de fundações, D3 (catálogo), conteúdo de aula, D4, D5, identidade visual, progresso (D6), XP/níveis (D7) e conquistas (D8) **aprovadas**; D1 revisada, aguardando re-auditoria.
- **Próximas fases:** gamificação (D7/D8) e demais domínios do `PLAN.md` §8 — cada um com sua própria SPEC; pendências abertas listadas em cada SPEC (§12) e no `TASKS.md`.

## 10. SDD / regra de desenvolvimento

Antes de implementar qualquer funcionalidade:

1. Consultar `PLAN.md` (fases, pendências) e `TASKS.md` (tarefa, bloqueios).
2. Consultar as SPECs relevantes em `SPEC/` (fonte única de requisitos).
3. **Não inventar requisitos** — o que não está especificado, não existe.
4. Decisões ainda abertas (DP-xx) permanecem **pendências**: registrar, não resolver por conta própria.
5. Se a decisão não estiver especificada: **atualizar/produzir a SPEC antes do código** (com rastreabilidade e status apropriado).
6. Implementar.
7. Testar (`npm test`).
8. `npm run typecheck` (e `npm run build` quando fizer sentido).
9. Revisar o diff (`git diff`, `git diff --check`).
10. Só então commitar.

## 11. Regras importantes

- **Não resolver D4+ antecipadamente** (avaliações, progresso, XP, rankings…) — cada domínio tem sua SPEC própria como veículo.
- **Não alterar decisões técnicas vinculantes** (`SPEC/2026-09-30-tecnica-fundacoes.md`) sem revisão formal.
- **Não modificar `SPEC/`, `PLAN.md` ou `TASKS.md` arbitrariamente** — mudanças seguem o processo (nova SPEC/revisão com status e rastreabilidade).
- **Não introduzir funcionalidades fora do escopo** da visão geral (ex.: sem vídeo próprio, sem pagamento real, sem IA).
- **Manter rastreabilidade:** toda tarefa/código remete a tarefa do `TASKS.md` + domínio da SPEC.
- **Nunca commitar segredos** — `.env` está no `.gitignore`; só `.env.example` sem valores sensíveis.
- **Migrations devem ser versionadas** em `prisma/migrations/` (commit juntamente com o schema).

## 12. Como continuar o trabalho

1. ~~Aprovar a SPEC de DP-19~~ — feito (2026-09-30).
2. ~~Implementar conteúdo de aula (T2.3)~~ — feito: F2-12/F2-13 definitivos, F2-15/F2-16, migração `f2_conteudo_aula`, editor por tipo; TC-01–TC-20 automatizados.
3. ~~Concluir F2 (T2.6)~~ — feito: `docs/validacao/F2.md` (F2 validada, com ressalvas de ambiente).
4. **Pendências de processo abertas:** revisão formal de DP-01–DP-03 em `PLAN.md` §8/`decisoes-pendentes.md` (técnica §5); re-auditoria da SPEC D1.
5. ~~SPEC de D4 (T3.1, DP-08)~~ — feito (2026-10-01).
6. ~~T3.2/T3.3 (API de D4)~~ — feito (2026-10-01).
7. ~~SPEC de D5 (T3.4, DP-09)~~ — feito (2026-10-01): `SPEC/2026-10-01-avaliacoes.md`.
8. ~~T3.5 (API de D5)~~ — feito (2026-10-01).
9. ~~Validar a F3 (T3.6)~~ — feito: `docs/validacao/F3.md` (API validada; sem interface web — P-30/P-37).
10. ~~F4 — Progresso acadêmico (D6)~~ — feito (2026-10-01): `SPEC/2026-10-01-progresso-aprendizagem.md`.
11. ~~SPEC de D7 (T5.1, DP-07)~~ — feito (2026-10-02): `SPEC/2026-10-02-xp-niveis.md`.
12. ~~T5.2 (concessão de XP)~~ — feito (2026-10-02).
13. ~~T5.3 (níveis, XP da semana, F5-01, perfil e avisos)~~ — feito (2026-10-02).
14. ~~T5.4 (configuração de XP F5-02–F5-05 e telas)~~ — feito (2026-10-02).
15. ~~SPEC de D8 (T5.5, DP-18 parcela D8)~~ — feito (2026-10-02): `SPEC/2026-10-02-conquistas.md`.
16. ~~T5.6 (desbloqueio de conquistas)~~ — feito (2026-10-02).
17. ~~Validar a F5 (T5.7)~~ — feito (2026-10-02): `docs/validacao/F5.md` (F5 validada; F5-04/F5-05 alinhadas à SPEC: curso não publicado de outro dono → 404).
18. **Próximo:** F6 — Missões e desafios (D9, D10), começando pelas SPECs de D9 (T6.1) e D10 (T6.3), que tratam a DP-18 nessas parcelas.

## 13. Git

Fluxo recomendado por mudança:

```bash
git status              # o que mudou
git diff                # conteúdo das mudanças
git diff --check        # whitespace/linhas problemáticas
npm test                # suíte verde
npm run typecheck       # tipos ok
git add <arquivos>      # só os pretendidos
git commit -m "<mensagem objetiva>"
git push
```

Não há estratégia de branches definida neste projeto — siga o fluxo acima na branch atual.

## 14. Troubleshooting

| Problema | Causa provável / solução |
|---|---|
| `npm run dev:server` falha com "Variavel de ambiente obrigatoria" | `.env` ausente → `cp .env.example .env` |
| Banco não sobe | `docker compose ps` para ver o estado; porta **5434** já em uso por outro Postgres; veja logs com `docker compose logs db` |
| Conexão recusada no `db:migrate` | banco de pé? `npm run db:up` e aguarde o healthcheck |
| Migration pendente | `npm run db:migrate` (dev). Nos testes isso é automático (`prisma migrate deploy` no `global.ts`) |
| Testes falham por banco | confirme que `eduquest_test` existe: roda `npm run db:up` uma vez (init cria o banco); se necessário recrie os volumes: `docker compose down -v` (**apaga os dados** do Postgres local) |
| Porta 3000 ocupada | mude `PORT` no `.env`; o proxy do Vite assume `localhost:3000` (`vite.config.ts`) |
| Porta 5173 ocupada | o Vite avisa e escolhe outra porta — use a URL impressa no terminal |
| `npm start` sem frontend | rode `npm run build` antes (o backend serve `dist/web` só se existir) |
| `app`/`caddy` não sobem | build completo: `docker compose up -d --build`; logs: `docker compose logs app` |
| Client do Prisma desatualizado após puxar mudanças | `npm run db:generate` |

## 15. Deploy (URL pública)

**URL pública (AP1):** `https://eduquest-n1jj.onrender.com/`

Como está publicado (Render, verificado em 2026-10-01):

- **Plataforma:** Render — Web Service `eduquest` + PostgreSQL gerenciado `eduquest-db`, provisionados pelo Blueprint `render.yaml` conectado ao repositório no GitHub (cada push no `main` sincroniza o Blueprint).
- **Build:** Dockerfile multi-stage (estágios `dependencias`, `build`, `runtime`): `npm ci` → `prisma generate` → `npm run build` (API + SPA); imagem final `node:24-slim` com `openssl` (engines Prisma `debian-openssl-3.0.x`), contendo `dist/`, `src/`, `prisma/` e `node_modules`.
- **Subida do container:** `npx prisma migrate deploy` (migrations) e, em seguida, `node dist/server/index.js`.
- **Seed:** `initialDeployHook: npx prisma db seed` no `render.yaml` — executa `tsx prisma/seed.ts` uma única vez no primeiro deploy do Blueprint (idempotente; **não** roda a cada deploy/restart).
- **Banco:** PostgreSQL gerenciado com TLS; `DATABASE_URL` injetado pelo Render via `fromDatabase` — nunca versionado nem exposto.
- **Health check:** `GET /api/v1/health` → `200 {"status":"ok"}` (mesmo endpoint usado como health check do serviço).
- **Bundle:** o Express serve `dist/web` (SPA) com `Cache-Control: max-age=0` + ETag — o navegador revalida sempre.
- **Limitações do plano gratuito:** o serviço entra em sono por inatividade (a primeira requisição após o sono leva alguns segundos); sem Shell no container — comandos pontuais (seed manual, consultas) rodam na própria máquina com o `DATABASE_URL` da área do serviço, nunca comandos destrutivos (`migrate reset`, `db push --force-reset`).
- **Desenvolvimento local:** a stack `docker compose` (`db`, `app`, `caddy`, portas restritas a `127.0.0.1`) segue como ambiente de dev/teste — os testes (`npm test`) dependem dela.

Contas de demonstração (criadas pelo seed de `prisma/seed.ts`, senha `Eduquest#Dev2026`):

| Papel | E-mail |
|---|---|
| estudante | `estudante@eduquest.example` |
| professor | `professor@eduquest.example` |
| administrador | `admin@eduquest.example` |
