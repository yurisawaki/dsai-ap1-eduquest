# SPEC/2026-09-30-tecnica-fundacoes.md — SPEC Técnica de Fundações (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-09-30-tecnica-fundacoes.md` (T0.2 — SPEC técnica de fundações) |
| Status | **Aprovada** — resolve **DP-01** (stack + ambiente de execução, §2.1), **DP-02** (escopo D1/D2) e **DP-03** (escopo F1): os aspectos necessários para desbloquear F1, não todas as decisões futuras do sistema (§1) |
| Data | 2026-09-30 |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` → `PLAN.md` → `TASKS.md` → `SPEC/2026-09-30-decisoes-pendentes.md` |
| Desbloqueia | SPEC de D1 (T1.1), SPEC de D2, implementação de F1 (T1.2–T1.6) |
| Não resolve | DP-04–DP-19 (permanecem pendentes — ver §4 e §6.4) |
| Alterações a outros artefatos | Nenhuma nesta etapa; `PLAN.md` §8 e `TASKS.md` só em revisão formal posterior (§5, pós-requisito) |

---

## 1. Objetivo

Registrar, de forma concreta e justificada, as decisões técnicas **DP-01 (stack tecnológica), DP-02 (modelo físico de dados para D1 e D2) e DP-03 (contratos de API, autenticação técnica e versionamento)**, para desbloquear a primeira parte implementável do sistema — **F1: Identidade, acesso e perfis (D1, D2)** (`PLAN.md` §7).

Conforme `PLAN.md` §8, o tratamento de DP-01 é "definir em etapa/fase própria ou **SPEC técnica** antes de F1 detalhada"; DP-02 e DP-03 têm tratamento "**SPEC técnica própria**". O `TASKS.md` (T0.2) designa este artefato como o roteiro que os resolve. A ordem obrigatória registrada em `SPEC/2026-09-30-decisoes-pendentes.md` §5 é: **DP-01/02/03 → SPEC técnica → SPECs de domínio → implementação**.

Este documento **não cria requisitos funcionais**: toda exigência funcional citada é rastreável à SPEC de visão geral. Toda informação necessária que não está especificada nas fontes é registrada como **pendência (P-xx)** em §6.4, em vez de ser inventada. Nenhum código é escrito aqui.

**Limite desta resolução:** esta SPEC técnica resolve **apenas os aspectos necessários para desbloquear F1** (as decisões de Categoria A no alcance de F1: D1, D2 e suas operações). **Não resolve todas as decisões futuras do sistema** — modelos, contratos e detalhes funcionais das demais fases permanecem com as SPECs de domínio, conforme listado em §6.4.

---

## 2. Escopo

### 2.1 DP-01 — Stack tecnológica

#### 2.1.1 Critérios de seleção (declarados neste documento)

Os artefatos de origem **não definem critérios de escolha** (os NFRs quantificados são DP-04, pendente e não bloqueante — `TASKS.md` preâmbulo). Como o `PLAN.md` §8 delega a resolução de DP-01 a uma SPEC técnica, os critérios são declarados aqui, com a origem de cada um:

| # | Critério | Origem/rastreabilidade |
|---|---|---|
| C1 | Plataforma **web responsiva**, acessada via navegador em desktop e mobile | SPEC visão §6 ("Dentro dos limites") |
| C2 | **Persistência própria** dos dados da plataforma | SPEC visão §6 |
| C3 | **Regra de ouro**: toda recompensa (e demais regras de negócio) calculada **no servidor**; cliente apenas exibe | SPEC visão §4 (regra de ouro), §6, `PLAN.md` §4 princípio 2 |
| C4 | Banco **relacional com restrições e transações**: unicidade de credencial (D1), compra atômica e saldo não negativo (D12, futuro) | SPEC visão §5 D1, §5 D12; `PLAN.md` §5.1, §5.12 |
| C5 | **Uma única linguagem** em camadas de aplicação e testes, para reduzir atrito entre camadas (critério de simplicidade declarado aqui) | declarado neste documento (origem: delegação do `PLAN.md` §8; nenhum artefato anterior o define) |
| C6 | Ecossistema **consolidado e de código aberto**, com manutenção ativa (critério de sustentabilidade declarado aqui) | declarado neste documento (mesma origem de C5) |
| C7 | Ambiente de execução que permita **executar e publicar F1** de forma reproduzível, sem exigir seleção de provedor (nenhum artefato fornece critério de provedor; NFRs operacionais são DP-04) | declarado neste documento (mesma origem de C5); finalidade do desbloqueio = F1 (`TASKS.md` T1.2–T1.6) |

**Nota de fronteira:** se a SPEC de NFRs (DP-04) futuramente impuser restrições incompatíveis com as escolhas abaixo, a resolução será revista formalmente — as escolhas deste documento estão sujeitas a essa revisão (registrado em §5).

#### 2.1.2 Decisões de stack

| Camada | Decisão | Justificativa (critério) |
|---|---|---|
| Linguagem | **TypeScript** | C5 (uma linguagem em backend, frontend e testes), C6 |
| Runtime de backend | **Node.js (versão LTS)** | execução do backend sob C1/C3; C6 |
| Framework de backend | **Express** | C3 (autoridade no servidor), C6; atende a implementação dos contratos HTTP de §2.3 sem extras desnecessários (C5) |
| Frontend | **React** (aplicação de página única) | C1 (web responsiva), consome os contratos JSON de §2.3; C6 |
| Ferramenta de build do frontend | **Vite** | C1/C6; ferramenta mínima de build e servidor de desenvolvimento |
| Banco de dados | **PostgreSQL** | C2 (persistência própria), C4 (constraints únicas, transações, tipo ENUM para papéis fixos — SPEC visão §6) |
| Camada de acesso e migrações | **Prisma** (ORM com esquema declarativo e migrações versionadas) | C2/C4; modelo físico de §2.2 declarado uma única vez e versionado como migrações no repositório |
| Testes automatizados | **Vitest** | os artefatos de tarefas de F1 exigem testes (ex.: `TASKS.md` T1.2 "testes das regras de unicidade"); C5/C6 |
| Formato de dados entre camadas | **JSON sobre HTTP** | contratos de §2.3 (DP-03) |

**Ambiente de execução:** decidido em §2.1.3 (resolução de P-10). A **seleção de provedor de nuvem** não é necessária para executar/publicar F1 e permanece sob DP-04 (NFRs), que continua pendente (§4).

#### 2.1.3 Ambiente de execução e publicação (resolução de P-10)

| Decisão | Detalhe | Justificativa (rastreabilidade) |
|---|---|---|
| Empacotamento | **Contêiner Docker da aplicação** (Node/Express) que também serve o build estático do React — API e páginas em **mesma origem** | C1/C7; mesma origem é coerente com o cookie `SameSite=Lax` de §2.3.2 e dispensa configuração de CORS (nenhuma fonte exige origens cruzadas) |
| Persistência | Contêiner **PostgreSQL com volume persistente** | C2 (persistência própria); C4 |
| Orquestração | **Docker Compose** com serviços `app` e `db`, no **mesmo formato em desenvolvimento e produção** | C5/C7: um único formato de execução reduz atrito e torna a publicação reproduzível |
| Publicação de F1 | Execução do Compose em **qualquer host com Docker** (servidor próprio ou provedor à escolha operacional), com **proxy reverso Caddy** na frente para **TLS** | C7; TLS é necessário para o cookie `Secure` de §2.3.2 e para a publicação web (C1); Caddy por configuração mínima de TLS (declaração técnica) |
| Configuração | Parâmetros por **variáveis de ambiente** (mesmo mecanismo já adotado para o custo de bcrypt em §2.3.2) | C5; decisões operacionais não fixadas em código |
| Não decididos aqui | **Provedor de nuvem, disponibilidade, escalabilidade, backup, disaster recovery, região** — não são necessários para executar e publicar F1 | pertencem a **DP-04 e DP-15**, que permanecem pendentes (§4); nenhum artefato fornece critérios (C7) |

### 2.2 DP-02 — Modelo físico de dados (escopo: D1 e D2)

#### 2.2.1 Convenções

- Banco: PostgreSQL (§2.1.2). Migrações versionadas gerenciadas por Prisma; o esquema físico é materializado como migrações no repositório **na etapa de implementação** (este documento descreve o modelo em tabelas; não escreve código).
- Chaves primárias: **UUID v4 gerado pela aplicação** (justificativa: identificadores de perfil aparecem em rotas consultáveis — §2.3 — e o contrato de perfil envolve dados visíveis conforme D2; chave opaca evita enumeração; decisão técnica declarada aqui).
- Timestamps: `criado_em`, `atualizado_em` em todas as tabelas (utilidade operacional declarada aqui; nenhum artefato exige campos temporais adicionais).
- Entidades **fora de D1/D2 não são modeladas aqui** → P-08 (§6.4).

#### 2.2.2 Tabelas

**`usuario`** — entidade *usuário* (SPEC visão §5 D1)

| Coluna | Tipo | Restrição | Justificativa (rastreabilidade) |
|---|---|---|---|
| `id` | UUID | PK | §2.2.1 |
| `email` | VARCHAR(255) | **UNIQUE, NOT NULL** | SPEC visão §5 D1: "e-mail/credencial únicos" |
| `papel` | ENUM(`estudante`,`professor`,`administrador`) | NOT NULL | SPEC visão §5 D1 (entidade *papel*) e §6: "Papéis fixos: estudante, professor, administrador" — conjunto fixo, portanto ENUM e não tabela de lookup |
| `criado_em` / `atualizado_em` | TIMESTAMP | NOT NULL | §2.2.1 |

**`credencial`** — entidade *credencial* (SPEC visão §5 D1)

| Coluna | Tipo | Restrição | Justificativa |
|---|---|---|---|
| `usuario_id` | UUID | PK, **FK → `usuario.id` (ON DELETE CASCADE)** | entidade 1:1 com usuário (SPEC visão §5 D1) |
| `hash_senha` | TEXT | NOT NULL | SPEC visão §5 D1: "senha protegida" — armazena somente hash (§2.3.2) |
| `atualizada_em` | TIMESTAMP | NOT NULL | §2.2.1 |

**`sessao`** — entidade *sessão* (SPEC visão §5 D1)

| Coluna | Tipo | Restrição | Justificativa |
|---|---|---|---|
| `id` | UUID | PK | §2.2.1 |
| `usuario_id` | UUID | FK → `usuario.id` (ON DELETE CASCADE), **INDEX** | sessão pertence a usuário |
| `criado_em` | TIMESTAMP | NOT NULL | §2.2.1 |
| `expira_em` | TIMESTAMP | NOT NULL, **INDEX** | SPEC visão §5 D1: "sessão expira" |
| `revogada_em` | TIMESTAMP | NULL | encerra logout/revogação de forma explícita (T1.3 — `TASKS.md`) |

**`perfil_estudante`** — entidade *perfil de estudante* (SPEC visão §5 D2)

| Coluna | Tipo | Restrição | Justificativa |
|---|---|---|---|
| `usuario_id` | UUID | PK, FK → `usuario.id` (ON DELETE CASCADE) | perfil é 1:1 com o usuário |
| `criado_em` / `atualizado_em` | TIMESTAMP | NOT NULL | §2.2.1 |
| *(demais atributos)* | — | — | **não especificados** nas fontes → P-05 (§6.4) |

**`perfil_professor`** — entidade *perfil de professor* (SPEC visão §5 D2)

| Coluna | Tipo | Restrição | Justificativa |
|---|---|---|---|
| `usuario_id` | UUID | PK, FK → `usuario.id` (ON DELETE CASCADE) | perfil é 1:1 com o usuário |
| `bio` | TEXT | NULL | SPEC visão §5 D2: "professor pode ter bio pública" |
| `criado_em` / `atualizado_em` | TIMESTAMP | NOT NULL | §2.2.1 |
| *(demais atributos)* | — | — | **não especificados** → P-05 (§6.4) |

**`preferencias`** — entidade *preferências* (SPEC visão §5 D2)

| Coluna | Tipo | Restrição | Justificativa |
|---|---|---|---|
| `usuario_id` | UUID | FK → `usuario.id` (ON DELETE CASCADE) | preferências pertencem ao usuário |
| `chave` | VARCHAR(100) | PK (com `usuario_id`) | entidade declarada em SPEC visão §5 D2 |
| `valor` | JSONB | NOT NULL | formato flexível; **catálogo de chaves não especificado** → P-07 (§6.4) |

**`visibilidade`** — entidade *visibilidade* (SPEC visão §5 D2)

| Coluna | Tipo | Restrição | Justificativa |
|---|---|---|---|
| `usuario_id` | UUID | FK → `usuario.id` (ON DELETE CASCADE) | visibilidade pertence ao perfil |
| `chave` | VARCHAR(100) | PK (com `usuario_id`) | quais dados são visíveis a terceiros |
| `visivel` | BOOLEAN | NOT NULL | SPEC visão §5 D2 + regra "dados privados (e-mail, notas) nunca públicos" |
| *(granularidade das chaves)* | — | — | **não especificada** → P-06 (§6.4) |

#### 2.2.3 Regras de integridade

1. **UNIQUE** de `usuario.email` — SPEC visão §5 D1.
2. Ao criar usuário com papel X (transação), criar a linha da tabela de perfil correspondente (`perfil_estudante` ou `perfil_professor`) — SPEC visão §4 passo 1: "sistema valida e cria o perfil"; §5 D2.
3. `papel` restrito aos 3 valores fixos — SPEC visão §6.
4. FKs com `ON DELETE CASCADE` nas tabelas dependentes (decisão técnica declarada aqui: apagar conta remove credencial/sessões/perfil).
5. **Nenhuma coluna de gamificação** (nível, conquistas, inventário) em `perfil_*`: T1.6 (`TASKS.md`) exige exibição "aceitando dados vazios até F5/F8"; esses dados pertencem a D7/D8/D12 e serão modelados nas SPECs de domínio correspondentes.

### 2.3 DP-03 — Contratos de API, autenticação técnica e versionamento (escopo: F1)

#### 2.3.1 Formato e versionamento

- **Transporte:** JSON sobre HTTP. Todas as rotas sob o prefixo de versão **`/api/v1`** (versionamento por URL — decisão declarada aqui, exigida por DP-03).
- **Regras de versão:** mudanças aditivas (campo opcional novo) permanecem em `v1`; quebra de contrato (remoção/renomeação/tipagem incompatível) exige `v2`. `v1` é mantido enquanto houver consumidor.
- **Resposta de erro padrão:** objeto `{"erro": {"codigo": "<codigo>", "mensagem": "<texto>"}}` com códigos HTTP: `400` validação, `401` sem sessão válida, `403` papel/não-titular insuficiente, `404` inexistente, `409` conflito (credencial duplicada), `500` erro interno. (Semântica declarada aqui; significado funcional de cada regra vem da SPEC visão.)
- **Escopo:** apenas operações de **F1** (T1.2–T1.6). Contratos de F2+ → P-09 (§6.4).

#### 2.3.2 Autenticação técnica (parte de DP-03)

| Decisão | Detalhe | Justificativa (rastreabilidade) |
|---|---|---|
| Mecanismo | **Sessão no servidor**: ao autenticar, cria-se registro em `sessao` e o cliente recebe **cookie `eduquest_session` (HttpOnly, SameSite=Lax; Secure quando HTTPS)** com ID opaco de sessão | SPEC visão §5 D1 possui a entidade *sessão* com a regra "sessão expira"; `PLAN.md` §5.1 mantém "sessão" como entidade — um registro servidor-side é a representação direta dessa entidade. A regra de ouro (SPEC visão §4) exige autoridade no servidor |
| Expiração | campo `sessao.expira_em`; validação a cada requisição autenticada; **valor padrão de duração não é fixado aqui** (não especificado nas fontes) | SPEC visão §5 D1: "sessão expira" → P-03 (§6.4) |
| Logout | define `sessao.revogada_em` e descarta o cookie | `TASKS.md` T1.3 (login, logout, sessão) |
| Autorização | rota protegida sem sessão válida → `401`; sessão válida com papel não permitido → `403` | SPEC visão §5 D1: "acesso determinado por papel"; "sem login não há ação de estudante" |
| Senha | armazenar **apenas hash com bcrypt** (parâmetro de custo configurável por variável de ambiente) | SPEC visão §5 D1: "senha protegida" |
| Escopo de rotas de perfil | leitura/edição de perfil exige sessão autenticada | SPEC visão §5 D1: "sem login não há ação de estudante" |

#### 2.3.3 Contratos de F1

| # | Método | Rota | Propósito | Rastreabilidade (tarefa/fluxo) | Sucesso | Erros |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/v1/auth/registro` | Criar conta (usuário + credencial + perfil) | `TASKS.md` T1.2; SPEC visão §4 passo 1 | `201` `{usuarioId, papel}` — **sem sessão automática** (passos 1 e 2 do fluxo são distintos: SPEC visão §4) | `400` validação; `409` credencial duplicada (D1: unicidade) |
| 2 | POST | `/api/v1/auth/login` | Autenticar e iniciar sessão | T1.2/T1.3; SPEC visão §4 passo 2 | `200` + cookie de sessão | `400`; `401` credenciais inválidas |
| 3 | POST | `/api/v1/auth/logout` | Encerrar sessão | T1.3; SPEC visão §4 passo 2 | `204` (idempotente) | `401` sem sessão |
| 4 | GET | `/api/v1/auth/sessao` | Estado da sessão atual | T1.3 (ciclo de sessão/expiração) | `200` `{usuarioId, papel, expiraEm}` | `401` sem sessão/expirada |
| 5 | POST | `/api/v1/auth/recuperacao-senha` | Solicitar recuperação de senha | T1.3; SPEC visão §5 D1 (escopo: "recuperação de senha") | `202` resposta única e neutra (não revela existência do e-mail — decisão técnica declarada aqui) | `400` validação |
| 6 | POST | `/api/v1/auth/redefinicao-senha` | Concluir recuperação com token | T1.3; SPEC visão §5 D1 | `204` | `400` token inválido/expirado |
| 7 | GET | `/api/v1/perfis/{id}` | Ler perfil (visão conforme visibilidade) | T1.5/T1.6; SPEC visão §4 passos 1–2 | `200` `{id, papel, bio?, nome?, nivel?, conquistas?, inventario?}` — campos de gamificação `null`/vazios até F5/F8 (T1.6); **`email` nunca presente para terceiros** (SPEC visão §5 D2: dados privados nunca públicos) | `401`; `404` |
| 8 | PATCH | `/api/v1/perfis/{id}` | Editar perfil (titular) | T1.5; SPEC visão §5 D2: "estudante edita apenas o próprio perfil" | `200` com perfil atualizado | `401`; `403` não-titular; `404`; `400` (conjunto de campos editáveis → P-05) |

**Mapeamento obrigatório (AC-04):** T1.2 → contratos 1, 2; T1.3 → 2, 3, 4, 5, 6; T1.4 → autorização `401/403` aplicada a todas as rotas; T1.5 → 7, 8 (e criação de perfil no contrato 1, SPEC visão §4 passo 1); T1.6 → campos de gamificação do contrato 7; fluxo SPEC visão §4 passos 1–2 → contratos 1–4. **Sem contratos órfãos e sem tarefas de F1 sem contrato.**

#### 2.3.4 Matriz de sessão e papel por rota

Determinada exclusivamente de requisitos existentes (nenhuma regra de negócio nova):

| Rotas | Sessão exigida | Papel exigido | Base (rastreabilidade) |
|---|---|---|---|
| Contratos 1–6 (`/api/v1/auth/*`) | **Não** (acesso público) | nenhum | visitante executa os passos 1–2 do fluxo (SPEC visão §4); exigir sessão prévia tornaria cadastro e login inalcançáveis |
| Contrato 7 `GET /perfis/{id}` | **Sim** | qualquer papel autenticado (nenhuma fonte restringe leitura de perfil por papel) | SPEC visão §5 D1: "sem login não há ação de estudante" |
| Contrato 8 `PATCH /perfis/{id}` | **Sim** | **titular do perfil** (qualquer papel, apenas sobre o próprio perfil) | SPEC visão §5 D2: "estudante edita apenas o próprio perfil"; nenhuma fonte concede edição de perfil de terceiros |
| Rotas administrativas (gestão de usuários, T13.2/F13) | — | — | fora de F1 → P-09 |

**Notas:** (a) nenhuma rota de F1 exige um papel específico (estudante vs. professor vs. administrador) — a ausência de restrição é constatação sobre as fontes, não nova regra; (b) a política de papéis no cadastro permanece P-01 (SPEC de D1); edição de perfis de terceiros não está especificada em nenhuma fonte e **não foi criada aqui** (não há rota correspondente em F1).

#### 2.3.5 Fora dos contratos de F1

Gestão de usuários administrativa (T13.2/F13), preferências de notificação (T9.3/F9), relações sociais (F10), consumo de catálogo (F2+): **não modelados nem contratados aqui** → P-07/P-09 (§6.4).

---

## 3. Critérios de aceitação verificáveis

| ID | Critério | Método de verificação |
|---|---|---|
| AC-01 | O arquivo existe e contém exatamente as 6 seções numeradas: 1 Objetivo, 2 Escopo, 3 Critérios de aceitação verificáveis, 4 Fora de escopo, 5 Dependências, 6 Decisões necessárias | `ls` + leitura das seções `## 1.` a `## 6.` |
| AC-02 | As três DPs aparecem resolvidas **nos escopos declarados** — **DP-01 integralmente** (linguagem, runtime, framework, banco, camada de dados, testes, transporte **e ambiente de execução**: §2.1.1–§2.1.3), **DP-02 no escopo D1/D2** (estrutura, IDs, relacionamentos, índices, persistência: §2.2; P-05/P-06/P-07 delegadas), **DP-03 no escopo F1** (8 contratos, autenticação, autorização, matriz papel×rota, versionamento: §2.3; P-04 delegada) — atendendo os itens 1–5 do critério de `decisoes-pendentes` §6: (1) este artefato existe; (2) decisão registrada de forma inequívoca; (3) status "Aprovada" no cabeçalho; (4) rastreabilidade às fontes em cada decisão; (5) registro do pós-requisito de revisão formal de `PLAN.md`/`TASKS.md` (§5). Item 6 (remoção de bloqueios) fica para essa revisão formal | leitura cruzada deste documento × `decisoes-pendentes` §6 |
| AC-03 | O modelo físico cobre **8/8 entidades** de D1 e D2 da SPEC visão §5 (usuário, credencial, sessão, papel; perfil de estudante, perfil de professor, preferências, visibilidade) com PK/FK/UNIQUE declarados | cruzamento entidade × §2.2 |
| AC-04 | Os contratos cobrem **T1.2–T1.6 e os passos 1–2 do fluxo**, sem tarefa sem contrato e sem contrato órfão (§2.3.3, mapeamento obrigatório); a matriz de sessão/papel está presente (§2.3.4); as lacunas de payload são **deliberadas e delegadas**: contrato 6 (token → P-04, SPEC de D1) e contrato 8 (campos editáveis → P-05, SPEC de D2) | cruzamento tarefas × contratos; leitura de §2.3.4, §6.4 |
| AC-05 | **DP-04–DP-19 permanecem pendentes**: este documento não as declara resolvidas e nenhuma delas recebe decisão em §2 ou §6 | busca por `DP-04`…`DP-19` neste documento: só aparecem como pendências/lista de não-resolução; comparação com `decisoes-pendentes` §2 (nenhum status alterado) |
| AC-06 | Toda exigência funcional citada é rastreável à SPEC visão (unicidade, sessão expira, papéis fixos, privacidade, titularidade de perfil, recuperação de senha, criação de perfil no cadastro) | rastreabilidade por item (coluna "Justificativa" em §2) |
| AC-07 | Nenhum conteúdo de DP proibida foi definido: sem fórmulas de XP/níveis, sem tipos de questão, sem regras de ranking, sem NFRs quantificados (DP-04), sem design UI (DP-05), sem acessibilidade/i18n (DP-06), sem pagamentos (DP-12), sem IA/LLM (DP-13), sem multi-tenancy (DP-14) | busca por esses temas neste documento: ocorrências apenas como declaração de não-resolução |
| AC-08 | Todas as pendências abertas por este documento estão registradas em §6.4 com ID (P-xx), descrição e artefato responsável (≥ 8 pendências, cada uma com destino) | contagem e leitura de §6.4 |
| AC-09 | Nenhum código foi criado e nenhum outro artefato foi alterado nesta etapa (`src/` e `tests/` vazios; `PLAN.md`, `TASKS.md` e SPEC de visão inalterados) | `ls src tests`; `git status`/`git diff` |

---

## 4. Fora de escopo

- **DP-04–DP-19: nenhuma é resolvida por este documento** — NFRs quantificados (DP-04), UI/UX (DP-05), acessibilidade/i18n (DP-06), fórmula de XP/níveis (DP-07), tipos de questão (DP-08), correção de dissertativas (DP-09), regras de ranking (DP-10), integrações externas (DP-11), pagamentos (DP-12), IA/LLM (DP-13), multi-tenancy (DP-14), carga/backup/DR (DP-15), legais (DP-16), P4/analytics (DP-17), catálogos de gamificação (DP-18), formato de conteúdo de aula (DP-19).
- **Código-fonte, migrações executáveis e scripts** — etapa de implementação posterior.
- **Requisitos funcionais novos** — este documento só decide meios técnicos; nenhuma regra funcional além das já declaradas na SPEC visão.
- **Contratos de F2–F13** e **modelo físico de D3–D17** (P-08, P-09).
- **Alterações** na SPEC de visão, no `PLAN.md`, no `TASKS.md` ou em `decisoes-pendentes` — apenas a **revisão formal** pós-aprovação registrada em §5.
- **Provedor de nuvem e NFRs operacionais** (disponibilidade, escalabilidade, backup/DR — DP-04/DP-15): permanecem fora deste documento; o **ambiente de execução e publicação de F1 está decidido em §2.1.3**.

---

## 5. Dependências

**Anteriores (fontes):**

1. `SPEC/2026-09-30-visao-geral.md` — requisitos funcionais (§5 D1, D2; §4 passos 1–2; §6 limites).
2. `PLAN.md` §4 (princípio 4 — stack não escolhida no PLAN), §5.1–§5.2, §7 Fase 1, **§8 (delegação de DP-01/02/03 a esta SPEC técnica)**, §11.
3. `TASKS.md` — T0.2 (origem deste artefato), preâmbulo (pré-requisito global DP-01–DP-03), T1.1–T1.7.
4. `SPEC/2026-09-30-decisoes-pendentes.md` §4 Categoria A, §5 (ordem de dependências), §6 (critério de decisão resolvida).

**Posteriores (desbloqueadas por este documento):**

- SPEC de **D1** (T1.1) e SPEC de **D2** — detalham regras funcionais, **não** meios técnicos (já decididos aqui).
- Implementação de **F1** (T1.2–T1.6) e validação da fase (T1.7).

**Pós-requisito de processo (não executado nesta etapa):** após aprovação, **revisão formal** de `PLAN.md` §8 (marcar DP-01/02/03 como resolvidas, apontando este artefato) e do `TASKS.md` (ajustar os bloqueios globais e de T0.2), conforme itens 5–6 do critério de `decisoes-pendentes` §6. Até lá, o `TASKS.md` permanece inalterado.

**Informativa:** DP-04 (NFRs e eventual seleção de provedor), quando resolvida, poderá impor restrições que exijam revisão formal de §2.1.2–§2.1.3 (registrado em §2.1.1).

---

## 6. Decisões necessárias

Somente três decisões de bloqueio são resolvidas aqui (Categoria A de `decisoes-pendentes` §4); todo o resto permanece pendência.

### 6.1 DP-01 — Stack tecnológica

**Decisão:** TypeScript + Node.js (LTS) + Express (backend) | React + Vite (frontend) | PostgreSQL + Prisma (dados/migrações) | Vitest (testes) | JSON/HTTP (justificativas em §2.1.2, contra os critérios C1–C7 de §2.1.1) | ambiente de execução/publicação: Docker + Docker Compose + proxy Caddy/TLS (§2.1.3).

**Escopo da resolução:** linguagem, runtime, framework, banco, camada de dados, ferramenta de testes, formato de transporte **e ambiente de execução/publicação de F1** (§2.1.3 — P-10 resolvida). **Não** são decididos: provedor de nuvem e NFRs operacionais (DP-04/DP-15, §4).

### 6.2 DP-02 — Modelo físico de dados

**Decisão:** modelo das **8 entidades de D1 e D2** conforme §2.2 (tabelas, tipos, PK/FK/UNIQUE, ENUM de papéis, regras de integridade de §2.2.3), materializado como migrações versionadas na implementação.

**Escopo da resolução:** D1 e D2 apenas (escopo definido nesta tarefa); **diretriz de extensão:** modelos de D3–D17 serão acrescentados por suas SPECs de domínio, preservando as convenções de §2.2.1 (UUID, timestamps, FKs) — pendência P-08.

### 6.3 DP-03 — Contratos de API, autenticação técnica e versionamento

**Decisão:** contratos JSON/HTTP `/api/v1` de F1 (8 operações, §2.3.3), autenticação por **sessão servidor-side com cookie `eduquest_session` (HttpOnly, SameSite=Lax)** + hash **bcrypt** (§2.3.2), versionamento por prefixo de URL com regras aditivo/quebra (§2.3.1).

**Escopo da resolução:** operações de F1 (T1.2–T1.6), autenticação/autorização, matriz de sessão/papel (§2.3.4) e versionamento — payload do token de recuperação permanece em P-04 (SPEC de D1); contratos de F2+ em P-09 (§6.4).

### 6.4 Pendências abertas por este documento (não inventadas)

| ID | Pendência | Por que não foi decidida aqui | Artefato responsável |
|---|---|---|---|
| P-01 | Política de atribuição de **papel** no cadastro (quem pode se cadastrar como professor/administrador) | SPEC visão §4 passo 1 descreve criação de perfil de estudante; `TASKS.md` T1.2 inclui os três papéis; a política não está especificada | SPEC de D1 |
| P-02 | Validação de **e-mail e senha** (formato, tamanho mínimo) | regra "senha protegida/credencial única" (D1) não define política | SPEC de D1 |
| P-03 | **Duração padrão** de expiração de sessão | D1 diz "sessão expira", sem valor | SPEC de D1 |
| P-04 | **Entrega e validade do token** de recuperação de senha (e-mail é integração, DP-11 pendente) | D1 inclui "recuperação de senha"; mecanismo não especificado; DP-11 não resolvida | SPEC de D1 (com DP-11) |
| P-05 | **Atributos editáveis** dos perfis (inclui se `email` é editável e o corpo do PATCH) | D2 declara entidades, não campos | SPEC de D2 |
| P-06 | **Granularidade das chaves de visibilidade** | D2 declara a entidade, não o conjunto | SPEC de D2 |
| P-07 | **Catálogo de chaves de preferências** (e vínculo com preferências de notificação de D13) | D2 declara a entidade; conteúdo vem de D13/F9 | SPEC de D2/D13 |
| P-08 | **Modelo físico de D3–D17** (e migrações associadas) | fora do escopo DP-02 desta tarefa (D1/D2) | SPECs de domínio (+ revisão desta SPEC) |
| P-09 | **Contratos de F2–F13** | fora do escopo DP-03 desta tarefa (F1) | SPECs de domínio (+ revisão desta SPEC) |

**Encaminhamentos deliberadamente abertos:** P-04 → SPEC de D1; P-05, P-06, P-07 → SPEC de D2/D13. Estas permanecem **abertas nesta SPEC** (não resolvidas aqui) e são condição de fechamento dos payloads delegados. P-10 foi resolvida em §2.1.3 (ambiente de execução); a seleção de provedor permanece sob DP-04.

**DP-04–DP-19 permanecem integralmente pendentes** — nenhuma acima as resolve.

### 6.5 Condição de encerramento

Este documento está apto a desbloquear SPEC de D1/D2 e F1 quando: AC-01–AC-09 forem atendidos (verificação documental) **e** a revisão formal de §5 for executada (marcação em `PLAN.md` §8 e `TASKS.md`). Até lá, os bloqueios do `TASKS.md` seguem válidos, conforme o artefato ainda não revisado.
