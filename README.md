# EduQuest

Plataforma web de ensino gamificada: cursos → módulos → aulas, exercícios, avaliações, progresso acadêmico e gamificação (XP, níveis, conquistas, moedas, loja) calculada no servidor.

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
npm test            # 68 testes, 11 arquivos — deve passar 100%
npm run test:watch  # modo watch
```

- **Banco de teste:** `eduquest_test` (mesma instância do compose, porta 5434). Ele é criado automaticamente pelo init do container (`infra/initdb/01-init.sql`) quando você roda `npm run db:up` pela primeira vez; a URL vem de `TEST_DATABASE_URL`.
- **Migrations de teste:** rodam sozinhas — `tests/configuracao/global.ts` executa `npx prisma migrate deploy` contra o banco de teste antes da suíte. Não é preciso migrar na mão.
- **Verde:** a saída final deve ser `Test Files 11 passed (11)` / `Tests 68 passed (68)` e `npm run typecheck` sem erros.
- Cobertura atual: API (auth, perfis, catálogo, conteúdo e anexos — TC-01–TC-20 da SPEC de conteúdo —, conclusão), web (React) e unidade (autorização).

## 7. Estrutura do projeto

```
src/server/          backend Express
  app.ts             cria a app (middlewares, rotas, static)
  index.ts           sobe o servidor na porta configurada
  config.ts          variáveis de ambiente (falha cedo se faltar)
  rotas/             auth, perfis, catalogo (montadas em /api/v1)
  servicos/          regras de negócio (usuarios, sessoes, catalogo, …)
  middlewares/       sessão/papel
src/web/             frontend React (Vite; root = src/web)
  paginas/           Cadastro, Login, Recuperacao, Perfil, Catalogo
tests/               api/ · web/ · unidade/ · configuracao/ · utilidades/
prisma/              schema.prisma + migrations/ (versionadas)
SPEC/                especificações (fonte de requisitos — ver §10)
PLAN.md, TASKS.md    planejamento e tarefas (processo SDD)
docs/validacao/      relatórios de validação de fase (ex.: F2.md — T2.6)
prompts/             prompts usados no processo SDD (histórico)
scripts/             utilitários (ex.: token de recuperação)
infra/               initdb (cria eduquest_test) e caddy/Caddyfile
docker-compose.yml   serviços: db, app, caddy
```

Não existe pasta `diario/` neste repositório.

## 8. Arquitetura atual

- **Backend:** Express 5 + TypeScript, API versionada em **`/api/v1`**:
  - `/api/v1/auth` (registro, login, logout, recuperação), `/api/v1/perfis`, `/api/v1` (catálogo: cursos/módulos/aulas/conteúdo/anexos/conclusão).
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
- **Suíte: 68 testes passando** (`npm test`); **`npm run typecheck` passando** (ambos verificados em 2026-09-30).
- **DP-19 resolvida:** `SPEC/2026-09-30-conteudo-aula.md` **aprovada** após auditoria (§13 da SPEC); `PLAN.md`, `TASKS.md` (T2.3), `decisoes-pendentes.md` e SPEC D3 revisados formalmente. Pendências derivadas abertas: P-18–P-21.
- Outras SPECs: visão geral, técnica de fundações, D3 (catálogo) e conteúdo de aula **aprovadas**; D1 revisada, aguardando re-auditoria.
- **Próximas fases (F3 em diante)** seguem bloqueadas por suas pendências (ex.: DP-08 tipos de questão, DP-09 dissertativas) — ver `PLAN.md` §8.

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
5. **Depois:** F3 (D4/D5) começa pela SPEC de D4 — que resolve DP-08; nada antes disso.

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
