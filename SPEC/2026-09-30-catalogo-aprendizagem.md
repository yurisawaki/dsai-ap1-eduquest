# SPEC/2026-09-30-catalogo-aprendizagem.md — SPEC do domínio D3: Catálogo de aprendizagem (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-09-30-catalogo-aprendizagem.md` (T2.1 — SPEC do domínio D3) |
| Status | **Nova — aguardando auditoria/aprovação** |
| Data | 2026-09-30 |
| Domínio / Fase | **D3 — Catálogo de aprendizagem (cursos, módulos, aulas)** · Fase **F2** (`PLAN.md` §7) |
| Tarefa de origem | **T2.1** (`TASKS.md` — "Elaborar SPEC do domínio D3 (catálogo)") |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` → `PLAN.md` → `TASKS.md` → `SPEC/2026-09-30-decisoes-pendentes.md`; decisões técnicas vinculantes: `SPEC/2026-09-30-tecnica-fundacoes.md` (aprovada; P-08/P-09 delegam modelo físico e contratos de D3/F2 às SPECs de domínio) |
| Desbloqueia (conteúdo) | T2.2 (hierarquia), T2.4 (autoria), T2.5 (consumo e conclusão); condições de conteúdo de T2.3 (estrutura dos três tipos de conteúdo — **formato/limites permanecem bloqueados por DP-19**) e de T2.6 (validação de F2) |
| Não resolve | **DP-19 registrada como pendência, não resolvida** (§10.1); DP-04–DP-18 (nenhuma); P-08/P-09 apenas na parcela de D3/F2 (D4–D17 e F3–F13 permanecem abertos); pendências novas P-14–P-17 (§10.2); nada pertencente a D2, D4–D17 |
| Restrições desta etapa | Sem código; sem alterar `PLAN.md`, `TASKS.md`, SPEC de visão, SPEC técnica ou `decisoes-pendentes.md`; sem inventar requisitos — informação não especificada vira pendência (§10) |

---

## 1. Objetivo

Transformar em **critérios verificáveis** tudo o que já foi definido para **D3 — Catálogo de aprendizagem** nos artefatos anteriores, cobrindo: criação, organização e consumo de cursos → módulos → aulas, conteúdo de aula (texto, mídia embedada, material anexo), publicação e conclusão de aula (`SPEC/2026-09-30-visao-geral.md` §5 D3), conforme a tarefa T2.1 do `TASKS.md`.

Esta SPEC **não cria requisitos funcionais**: toda regra aqui declarada é citação, detalhamento ou decomposição rastreável da SPEC de visão geral, do `PLAN.md` ou das delegações já aprovadas na SPEC técnica de fundações. Toda informação necessária **não especificada** nessas fontes é registrada como **pendência** em §10, em vez de escolhida arbitrariamente. Nenhum código é escrito aqui.

Esta SPEC **consome, não redefine**: as decisões técnicas da SPEC técnica de fundações (stack, convenções de modelo físico, formato de erro `{"erro": {...}}`, versionamento `/api/v1`, autenticação por sessão com cookie, integridade "FKs ON DELETE CASCADE") são vinculantes e não são reabertas (§2.4). Ao mesmo tempo, ela **exerce as delegações P-08 e P-09** (técnica §6.4) na sua parcela: define o modelo físico de D3 e os contratos de F2, com pós-requisito de revisão da SPEC técnica declarado em §9.4. Nenhuma decisão pertencente a D4–D17 ou às fases posteriores é resolvida aqui.

---

## 2. Escopo de D3

### 2.1 Áreas cobertas (fonte: SPEC visão §5 D3)

> **D3 — Catálogo de aprendizagem (cursos, módulos, aulas).** Escopo: criação, organização e consumo de cursos → módulos → aulas. Entidades: curso, módulo, aula, conteúdo de aula (texto, mídia embedada, material anexo), publicação. Regras: hierarquia fixa curso > módulo > aula; apenas professor dono (ou admin) edita; aula só é consumível quando publicada; conclusão de aula é registrada por estudante.

| # | Área de D3 | Conteúdo nesta SPEC | Tarefa `TASKS.md` | Funcionalidade (visão §5 / `PLAN.md` §2) | Contratos (§3.5) |
|---|---|---|---|---|---|
| 1 | Cursos | Fluxo A (§3.1), regras R-13/R-16/R-17 (§4), dados (§5.1) | T2.2, T2.4 | 3 (cursos) | F2-01–F2-05 |
| 2 | Módulos | Fluxo A (§3.1), regras R-12/R-16 (§4), dados (§5.2) | T2.2, T2.4 | 4 (módulos) | F2-06–F2-08 |
| 3 | Aulas | Fluxo A (§3.1), regras R-12/R-16 (§4), dados (§5.3) | T2.2, T2.4 | 5 (aulas) | F2-09–F2-11 |
| 4 | Conteúdo de aula (texto, mídia embedada, material anexo) | §3.1 passo 3, Fluxo C (§3.3), regra R-18 (§4), dados (§5.4); **formato/limites → DP-19** | T2.3 (parcial: estrutura; formato/limites `[Bloqueada: DP-19]`); T2.5 (leitura) | 5 (aulas) | F2-12, F2-13 |
| 5 | Publicação | §3.1 passo 4, regras R-14/R-16/R-17 (§4), estados (§7.1) | T2.2 | 3–5 | F2-04, F2-07, F2-10 |
| 6 | Consumo e conclusão de aula | Fluxos B–D (§3.2–§3.4), regras R-14/R-15 (§4), dados (§5.5) | T2.5 | 5 (aulas); passos 3–4 do fluxo | F2-13, F2-14 |

**Entidades de D3** (SPEC visão §5 D3): **curso, módulo, aula, conteúdo de aula, publicação** — materializadas conforme §5 (modelo físico delegado por P-08). A **conclusão de aula** é regra de D3 ("conclusão de aula é registrada por estudante") e o **registro do evento** pertence a esta SPEC (§5.5); sua **agregação em progresso** pertence a D6 (visão §5 D6) e sua tradução em XP a D7 — §2.3.

### 2.2 Fluxos dos quais D3 participa

SPEC visão §4, passos 3–4 (meio do fluxo principal), e o fluxo secundário do professor:

3. **Exploração de catálogo** — estudante navega por cursos disponíveis e abre a estrutura (módulos → aulas). → Fluxo B (§3.2)
4. **Consumo de aula** — estudante lê/assiste à aula e a marca como concluída; recebe XP e atualiza progresso. → Fluxos C e D (§3.3–§3.4); XP e progresso **não** são calculados aqui — o evento de conclusão alimenta F4/F5 (§2.3, §8)

Fluxo secundário (visão §4): **Professor:** cria conta → **cria curso → estrutura módulos/aulas** → publica questões/exercícios/avaliações → acompanha progresso → Fluxo A (§3.1) e §3.5.

`PLAN.md` §7 F2: "hierarquia curso > módulo > aula com publicação; conteúdo de aula (texto, mídia embedada, material anexo); edição restrita a professor dono ou admin; registro de conclusão de aula por estudante"; objetivo **O2 (parte 1)**.

### 2.3 Fronteiras do escopo (D3 × vizinhos)

| Item | Pertence a | Referência |
|---|---|---|
| Questões e exercícios vivendo em curso/módulo | **D4** (F3) — D3 só provê a estrutura | visão §5 D4; `PLAN.md` §5.4 |
| Avaliações compostas por questões | **D5** (F3) | visão §5 D5 |
| Agregação de conclusões em % de aula/módulo/curso, estatísticas | **D6** (F4) — D3 entrega o evento bruto | visão §5 D6; `PLAN.md` §5.6 |
| Concessão de XP e nível ao concluir aula | **D7** (F5) — "regra de ouro": servidor calcula; D3 nunca | visão §4 regra de ouro, §5 D7 |
| Perfil público do autor/dono (nome, bio) | **D2** (F1) | visão §5 D2 |
| Gamificação do próprio curso (missões, desafios, recompensas) | **D9/D10/D12** | visão §3 P2 |
| Certificado do curso | **D16** (F12) | visão §5 D16 |
| Moderação/remoção de conteúdo, gestão de contas | **D17** (F13) | visão §5 D17 |
| Notificações de eventos (nova aula, conclusão) | **D13** (F9) — D3 apenas produz eventos | visão §5 D13 |
| **Formato de conteúdo, limites de upload, regras de embed** | **DP-19** (pendente — registrada em §10.1, **não resolvida**) | visão §5 D3 (entidades citadas sem detalhe); `PLAN.md` §8, §11 item 9 |
| Matrícula, turma, vínculo institucional | **não existe** — "não é um LMS institucional completo" (limite fixo) | visão §6; §8 |

### 2.4 Decisões técnicas consumidas (vinculantes, da SPEC técnica de fundações)

Registradas aqui apenas como base de execução — **não são redecididas nem contraditas**:

| Decisão | Onde (SPEC técnica) | Uso em D3 |
|---|---|---|
| Stack (TypeScript, Node.js, Express, React/Vite, PostgreSQL, Prisma, Vitest, JSON/HTTP) | §2.1.2 | meios de T2.2–T2.6 (sem efeito em critérios funcionais) |
| Convenções de modelo: UUID v4 gerado pela aplicação, timestamps `criado_em`/`atualizado_em`, ENUMs minúsculas, migrações versionadas na etapa de implementação | §2.2.1 | §5 (tabelas de D3) |
| Integridade: FKs com **ON DELETE CASCADE** nas tabelas dependentes; ENUM para conjuntos fixos; transação em operações compostas | §2.2.3 (regra 4) | §5; R-13; consequências de exclusão → P-16 |
| Erro padrão `{"erro": {"codigo", "mensagem"}}` e códigos 400/401/403/404/409/500 | §2.3.1 | §7 e contrafluxos de §3 |
| Versionamento por URL sob prefixo **`/api/v1`**; regras de versão aditiva/quebra | §2.3.1 | §3.5 (contratos de F2) |
| Autenticação: sessão servidor-side + cookie `eduquest_session` (HttpOnly, SameSite=Lax; Secure quando HTTPS); `401` sem sessão, `403` com papel/titularidade insuficiente | §2.3.2 | §4.2 (matriz de F2) |
| **P-08** — modelo físico de D3–D17 delegado às "SPECs de domínio (+ revisão desta SPEC)" | §6.4 | esta SPEC define o modelo de D3 em §5 (parcela D3 cumprida; D4–D17 seguem abertos) |
| **P-09** — contratos de F2–F13 delegados às "SPECs de domínio (+ revisão desta SPEC)" | §6.4 | esta SPEC define os contratos de F2 em §3.5 (parcela F2 cumprida; F3–F13 seguem abertos) |
| Fronteira de vídeo: "Não é um host de vídeo: aulas podem exibir vídeo por incorporação (embed) de provedor externo, mas o EduQuest não armazena nem transmite vídeo próprio" | visão §6 (limite fixo) | R-18 (§4); verificação em T2.6 |
| Revisão formal de `PLAN.md`/`TASKS.md` (remoção de bloqueios, marcação de DPs) é pós-requisito, não executado na etapa de SPEC | técnica §5, §6.5; D1 §9.4 | §9.4 |

---

## 3. Fluxos de criação, exploração, consumo e conclusão

Todos os fluxos detalham os passos 3–4 da SPEC visão §4 e o fluxo do professor (visão §4), conforme as tarefas T2.2–T2.5. As respostas HTTP são as definidas em §3.5 (contratos, no formato da técnica §2.3.1) — aqui se descrevem passos, decisões do usuário e contrafluxos.

Os **nomes exatos das chaves JSON** de requisição/resposta não estão fixados em nenhuma fonte e não são requisito funcional: esta SPEC os **delega à implementação técnica**, mantendo vinculados os campos de sucesso fixados aqui (`201 {cursoId}`, `201 {aulaId, concluidaEm}` etc.) e o formato de erro `{"erro": {...}}` (técnica §2.3.1). O **corpo de conteúdo** (PUT/GET de conteúdo da aula) é pendência **DP-19** (§10.1).

### 3.1 Fluxo A — Criação, estruturação, conteúdo e publicação (professor; T2.2, T2.3, T2.4)

**Ator:** professor autenticado (futuro dono). *Atributos aceitos além de `titulo` não existem no modelo (§5) — nenhum é criado aqui.*

1. Professor cria um **curso** (`POST /api/v1/cursos`, F2-01). O curso nasce como **rascunho** (`publicado = false` — R-16) e registra o autor como **dono** (R-13). → `201 {cursoId}`.
2. Professor adiciona **módulos** ao curso (F2-06) e **aulas** a cada módulo (F2-09), sempre dentro da hierarquia fixa (R-12): módulo só em curso existente, aula só em módulo existente. → `201 {moduloId}` / `201 {aulaId}`; todos nascem em rascunho.
3. Professor registra o **conteúdo da aula** (`PUT /api/v1/aulas/{id}/conteudo`, F2-12) com um dos três tipos declarados na visão — **texto**, **média embedada** ou **material anexo** (§5.4). O **formato do corpo, limites de tamanho/upload e regras de embed não estão especificados** → **DP-19** (§10.1); nesta SPEC o contrato existe com resposta `204` e a validade de formato fica pendente (E-24). O PUT é de **substituição total** (decisão técnica REST, não regra de produto).
4. Professor **publica** os recursos que deseja tornar disponíveis, alterando `publicado` via PATCH (F2-04/F2-07/F2-10) → `200`. Publicação é **ação explícita por recurso** (R-16); a visibilidade para leitores segue R-17 (§4).
5. Professor pode **editar** (PATCH) ou **excluir** (DELETE → `204`) qualquer recurso do qual é dono (efeitos: §3.4/§3.5, P-15/P-16).

**Contrafluxos:** sem sessão → `401` (E-14); papel que não é professor tentando **criar curso** → `403` (E-15 — visão §3 P2 "CRUD dos próprios cursos"; P3 "não substitui o professor na autoria"); professor não-dono ou estudante em qualquer mutação → `403` (E-16); alvo inexistente → `404` (E-18); referência de hierarquia inexistente no caminho → `404`, payload malformado → `400` (E-17); título ausente → `400` por campo obrigatório, **política de formato/tamanho é P-17** (§10.2); conteúdo com formato não conforme → `400`, **validade pendente de DP-19** (E-24).

### 3.2 Fluxo B — Exploração de catálogo (passo 3; T2.2, T2.5)

**Ator:** usuário autenticado (estudante no passo 3 do fluxo; dono/admin veem mais — R-17).

1. Usuário lista os cursos (`GET /api/v1/cursos`, F2-02) → `200` `[{id, titulo, publicado, donoId}]`. Para leitores comuns: **apenas cursos publicados** ("cursos disponíveis" — visão §4 passo 3; R-17); dono vê os próprios (inclusive rascunhos); admin vê todos.
2. Usuário abre um curso (`GET /api/v1/cursos/{id}`, F2-03) → `200` com a **estrutura** módulos → aulas (id, título, `publicado`), respeitando a visibilidade de cada nível (R-17).
3. Curso inexistente ou não visível (rascunho de outro autor) → `404` (E-18/E-19).

**Contrafluxos:** `401` sem sessão (todas as rotas de F2 exigem sessão — §4.2); `404` para não-visível.

**Nota (não é LMS):** não existe matrícula, turma ou inscrição: acesso ao catálogo é por visibilidade de publicação + sessão, nunca por vínculo (visão §6 — "não é um LMS institucional completo").

### 3.3 Fluxo C — Consumo de aula (passo 4, leitura; T2.3, T2.5)

**Ator:** usuário autenticado com aula visível.

1. Usuário abre a aula (`GET /api/v1/aulas/{id}`, F2-13) → `200 {id, titulo, publicado, conteudo}` — a **forma de `conteudo` é pendência DP-19** (§10.1); o modelo aceita os três tipos da visão (§5.4).
2. **Aula só é consumível quando publicada** (R-14): aula não publicada consultada por quem não é dono/admin → `404` (E-20); dono/admin leem rascunho (é edição/preview, não consumo).
3. Vídeo/mídia aparece por **embed de provedor externo** (R-18): o cliente busca no provedor externo; o EduQuest não armazena nem transmite vídeo (verificação de fronteira em T2.6).
4. Material anexo é servido conforme formato pendente (DP-19).

**Contrafluxos:** `401` sem sessão; `404` inexistente/não-visível; corpo armazenado inválido → `400` (critério: DP-19).

### 3.4 Fluxo D — Conclusão de aula (passo 4, marcação; T2.5)

**Ator:** estudante autenticado (papel `estudante` — visão §5 D3: "conclusão de aula é registrada por estudante").

1. Estudante marca a aula como concluída (`POST /api/v1/aulas/{id}/conclusao`, F2-14).
2. Pré-condições: sessão (D1 R-05 → `401` — E-14); papel **estudante** (`403` para professor/admin — E-21); aula visível/consumível conforme R-14 (`404` — E-22).
3. **Sucesso:** `201 {aulaId, concluidaEm}` — o **registro do evento** persiste em `conclusao_aula` (§5.5) e é a **entrada para D6** (progresso) e **D7** (XP): "evento alimenta F4" (T2.5), "progresso deriva de conclusões registradas" (visão §5 D6). **D3 não calcula progresso nem XP** (§8).
4. **Repetição da conclusão** (mesmo estudante, mesma aula): comportamento **não especificado** em nenhuma fonte → **P-14** (§10.2). Enquanto a pendência estiver aberta, o critério observável para o teste de T2.5 é: submissão repetida **não produz erro de servidor (status < 500)** e **não altera o registro original** (a primeira `concluidaEm` permanece); a semântica final (novo evento × idempotente × `409`) **não é fixada aqui** (E-23). O modelo físico, deliberadamente, **não impõe unicidade** (§5.5).

**Contrafluxos:** `401` (E-14), `403` não-estudante (E-21), `404` aula não visível (E-22), duplicata → P-14 (E-23).

### 3.5 Contratos de F2 (exercício de P-09 — técnica §6.4)

Todos sob `/api/v1`, JSON sobre HTTP, erro `{"erro": {"codigo", "mensagem"}}` e códigos conforme técnica §2.3.1. **14 contratos**, sem contrato órfão e sem tarefa de F2 sem contrato (mapa em §9.3).

| # | Método | Rota | Propósito | Rastreabilidade | Sucesso | Erros |
|---|---|---|---|---|---|---|
| F2-01 | POST | `/api/v1/cursos` | Criar curso (torna o autor dono) | T2.2, T2.4; visão §5 D3 | `201` `{cursoId}` (rascunho) | `400`; `401`; `403` (não-professor) |
| F2-02 | GET | `/api/v1/cursos` | Listar catálogo conforme visibilidade | T2.2; visão §4 passo 3 | `200` `[{id, titulo, publicado, donoId}]` | `401` |
| F2-03 | GET | `/api/v1/cursos/{id}` | Estrutura do curso (módulos → aulas) | T2.2; visão §4 passo 3 | `200` `{id, titulo, publicado, donoId, modulos: [{id, titulo, publicado, aulas: [{id, titulo, publicado}]}]}` | `401`; `404` (inexistente/não-visível) |
| F2-04 | PATCH | `/api/v1/cursos/{id}` | Editar `titulo` / `publicado` | T2.2, T2.4 | `200` com curso atualizado | `400` (P-17); `401`; `403` (não-dono, não-admin); `404` |
| F2-05 | DELETE | `/api/v1/cursos/{id}` | Excluir curso (e dependentes) | T2.2, T2.4; efeitos → P-16 | `204` | `401`; `403`; `404` |
| F2-06 | POST | `/api/v1/cursos/{id}/modulos` | Criar módulo no curso | T2.2, T2.4 | `201` `{moduloId}` (rascunho) | `400`; `401`; `403`; `404` (curso) |
| F2-07 | PATCH | `/api/v1/modulos/{id}` | Editar `titulo` / `publicado` | T2.2, T2.4 | `200` com módulo atualizado | `400` (P-17); `401`; `403`; `404` |
| F2-08 | DELETE | `/api/v1/modulos/{id}` | Excluir módulo (e dependentes) | T2.2, T2.4; efeitos → P-16 | `204` | `401`; `403`; `404` |
| F2-09 | POST | `/api/v1/modulos/{id}/aulas` | Criar aula no módulo | T2.2, T2.4 | `201` `{aulaId}` (rascunho) | `400`; `401`; `403`; `404` (módulo) |
| F2-10 | PATCH | `/api/v1/aulas/{id}` | Editar `titulo` / `publicado` da aula | T2.2, T2.4 | `200` com aula atualizada | `400` (P-17); `401`; `403`; `404` |
| F2-11 | DELETE | `/api/v1/aulas/{id}` | Excluir aula (e conteúdo) | T2.2, T2.4; efeitos → P-16 | `204` | `401`; `403`; `404` |
| F2-12 | PUT | `/api/v1/aulas/{id}/conteudo` | Definir conteúdo da aula (substituição total) | T2.3; visão §5 D3; **formato → DP-19** | `204` | `400` (validade do formato: **DP-19**); `401`; `403`; `404` |
| F2-13 | GET | `/api/v1/aulas/{id}` | Consumir aula publicada (conteúdo) | T2.3, T2.5; visão §4 passo 4 | `200` `{id, titulo, publicado, conteudo}` (**forma de `conteudo`: DP-19**) | `401`; `404` (inexistente ou não publicada p/ não-dono) |
| F2-14 | POST | `/api/v1/aulas/{id}/conclusao` | Registrar conclusão da aula por estudante | T2.5; visão §5 D3, §4 passo 4 | `201` `{aulaId, concluidaEm}` | `400`; `401`; `403` (não-estudante); `404`; duplicata → P-14 (E-23) |

**Notas:** (a) `409` **não é usado** em F2 enquanto P-14 estiver aberta — se a decisão futura adotar conflito, o código passa a ser emitido pela revisão correspondente; (b) nenhuma rota aceita filtro, paginação ou ordenação por parâmetro — nada disso está especificado (ordenação: P-17); (c) rotas administrativas de moderação de conteúdo (D17) não existem aqui (§2.3).

---

## 4. Regras de D3

### 4.1 Regras

Toda regra tem rastreabilidade obrigatória. As 4 primeiras são literalmente as regras de D3 da SPEC visão §5 (cada uma vira ≥1 AC em §6).

| ID | Regra | Detalhe (derivado das fontes) | Rastreabilidade |
|---|---|---|---|
| R-12 | **Hierarquia fixa curso > módulo > aula** | Só existe essa ordem e nenhuma outra: módulo pertence a exatamente 1 curso; aula pertence a exatamente 1 módulo; não há aula direta em curso, módulo órfão nem níveis alternativos. Criação fora da hierarquia (alvo inexistente) → `404`; payload malformado → `400`. A restrição é imposta pelo modelo físico (FKs, §5) e testada em T2.2 | visão §5 D3; `PLAN.md` §5.3; T2.2 |
| R-13 | **Apenas professor dono (ou admin) edita** | **Criação** de curso: apenas papel `professor` (visão §3 P2 "CRUD dos próprios cursos"; P3 "não substitui o professor na autoria" → admin não cria). **Edição, publicação, exclusão e conteúdo**: professor dono do curso ou `administrador`. Professor de outro curso → `403`; estudante → `403`. Titularidade é transitiva: módulo/aula herdam o dono do curso (§5) | visão §5 D3; §3 P1/P2/P3; `PLAN.md` §5.3; T2.4 |
| R-14 | **Aula só é consumível quando publicada** | O `GET` de conteúdo (F2-13) exige `aula.publicada = true` para quem não é dono/admin; rascunho de outro autor → `404`. Dono/admin leem rascunho (edição/preview). A regra é **literal** para a aula; o encadeamento com a publicação de curso/módulo é a provisória R-17 e pendência **P-15** | visão §5 D3; `PLAN.md` §5.3; T2.2, T2.5 |
| R-15 | **Conclusão de aula é registrada por estudante** | Requer sessão e papel `estudante` (outros papéis → `403`) e aula visível/consumível (→ `404`); sucesso `201 {aulaId, concluidaEm}` persiste o evento em `conclusao_aula` (§5.5), insumo de D6/D7. D3 não calcula progresso nem XP. Repetição → **P-14** | visão §5 D3, §4 passo 4, §5 D6; `PLAN.md` §5.3, §6 item 3; T2.5 |
| R-16 | **Publicação é estado explícito por recurso; estado inicial é rascunho** | Curso, módulo e aula têm `publicado` (visão §5 D3, entidade *publicação*; T2.2 "estados de publicação"). Todo recurso nasce com `publicado = false` — nada é publicado sem ação explícita do dono/admin (derivação conservadora: consumo exige publicação logo, estar publicado exige ato deliberado) | visão §5 D3; T2.2; §5.1–§5.3 |
| R-17 | **Visibilidade do catálogo (regra provisória conservadora)** | Leitores comuns (não-dono, não-admin) veem um recurso **somente se ele e todos os seus ancestrais** estão publicados: catálogo (F2-02) lista apenas cursos publicados; estrutura (F2-03) filtra módulos/aulas não publicados; dono vê os próprios e admin vê todos. Derivação de "cursos disponíveis" (visão §4 passo 3) + estados de publicação (T2.2) + P2/P3. **Encadeamento exato, visibilidade de rascunhos e despublicação não estão especificados → P-15** | visão §4 passo 3, §5 D3, §3 P2/P3; `PLAN.md` §5.3; T2.2 |
| R-18 | **Sem armazenamento/transmissão de vídeo próprio** | Mídia em aula é **embed de provedor externo** (o EduQuest guarda apenas a referência); nenhum recurso de F2 armazena ou transmite vídeo. Verificação obrigatória em T2.6 | visão §6 (limite fixo); `PLAN.md` §7 F2, §11; T2.3, T2.6 |

**Derivações declaradas** (todas rastreáveis, nenhuma requisito novo): visibilidade `publicado OU dono OU admin` decorre do passo 3 do fluxo + P2/P3; **não** existe matrícula/inscrição (visão §6 — não é LMS); ordenação de listagem por `criado_em` (apresentação — nenhuma fonte define ordem → P-17); atributo mínimo de curso/módulo/aula é `titulo` (entidades nomeadas navegáveis no catálogo; demais atributos não criados; validação e limites → P-17).

### 4.2 Matriz de sessão e papel por rota (F2)

Determinada apenas de requisitos existentes (nenhuma regra nova):

| Rotas | Sessão exigida | Papel / titularidade exigida | Base (rastreabilidade) |
|---|---|---|---|
| F2-02, F2-03, F2-13 (leitura de catálogo/estrutura/conteúdo) | **Sim** | qualquer papel autenticado, sujeito à **visibilidade** (R-17/R-14) | visão §4 passos 3–4 (percurso pós-login); D1: "sem login não há ação de estudante" |
| F2-01 (criar curso) | **Sim** | **professor** (apenas) | visão §3 P2; P3 |
| F2-04–F2-12 (edição, publicação, exclusão, conteúdo) | **Sim** | **professor dono do curso** ou **administrador** | visão §5 D3: "apenas professor dono (ou admin) edita"; §3 P2/P3 |
| F2-14 (conclusão) | **Sim** | **estudante** | visão §5 D3: "conclusão de aula é registrada por estudante" |
| Rotas administrativas (moderação de conteúdo, F13) | — | — | fora de F2 → §2.3 (D17) |

**Notas herdadas:** (a) `401` = sem sessão válida, `403` = sessão com papel/titularidade insuficiente (técnica §2.3.2) — distinção aplicada a toda operação de F2; (b) leitura de rascunho por dono/admin decorre da coluna de titularidade, não é papel especial novo; (c) estudante não edita nada (negação `403`, coerente com visão §3 P1 "não edita conteúdo de cursos").

---

## 5. Dados do catálogo de aprendizagem (modelo físico — exercício de P-08)

Modelo delegado a esta SPEC pela técnica §6.4 (P-08), escrito nas convenções da técnica §2.2.1 (PostgreSQL; UUID v4 gerado pela aplicação como PK; `criado_em`/`atualizado_em`; ENUMs minúsculas; FKs `ON DELETE CASCADE` conforme §2.2.3 regra 4). **Nenhum campo além dos abaixo é criado** — validação e atributos não detalhados são pendência P-17 (§10.2) e o formato de conteúdo é DP-19 (§10.1).

### 5.1 Curso — tabela `curso`

| Dado | Tipo/restrição | Papel em D3 | Rastreabilidade |
|---|---|---|---|
| `id` | UUID (PK, gerado pela aplicação) | identificador opaco do curso; usado em respostas (`cursoId`) e rotas | técnica §2.2.1 |
| `titulo` | TEXT NOT NULL | nome do curso no catálogo (atributo mínimo — §4) | visão §4 passo 3; `PLAN.md` §5.3 |
| `dono_id` | FK → `usuario.id` (ON DELETE CASCADE), INDEX | autor — titular das permissões de edição (R-13); cascata de exclusão de conta → **P-16** | visão §5 D3, §3 P2; técnica §2.2.3 regra 4 |
| `publicado` | BOOLEAN NOT NULL, DEFAULT `false` | estado de publicação (R-16/R-17) | visão §5 D3 (entidade *publicação*); T2.2 |
| `criado_em` / `atualizado_em` | TIMESTAMP NOT NULL | timestamps; ordenação de listagem (§4) | técnica §2.2.1 |

### 5.2 Módulo — tabela `modulo`

| Dado | Tipo/restrição | Papel em D3 | Rastreabilidade |
|---|---|---|---|
| `id` | UUID (PK) | identificador opaco (`moduloId`) | técnica §2.2.1 |
| `curso_id` | FK → `curso.id` (ON DELETE CASCADE), INDEX | hierarquia (R-12): módulo só existe dentro de curso | visão §5 D3; T2.2 |
| `titulo` | TEXT NOT NULL | nome do módulo | visão §5 D3 |
| `publicado` | BOOLEAN NOT NULL, DEFAULT `false` | estado de publicação (R-16/R-17) | visão §5 D3; T2.2 |
| `criado_em` / `atualizado_em` | TIMESTAMP NOT NULL | timestamps | técnica §2.2.1 |

### 5.3 Aula — tabela `aula`

| Dado | Tipo/restrição | Papel em D3 | Rastreabilidade |
|---|---|---|---|
| `id` | UUID (PK) | identificador opaco (`aulaId`); usado em F2-10–F2-14 | técnica §2.2.1 |
| `modulo_id` | FK → `modulo.id` (ON DELETE CASCADE), INDEX | hierarquia (R-12) | visão §5 D3; T2.2 |
| `titulo` | TEXT NOT NULL | nome da aula | visão §5 D3 |
| `publicado` | BOOLEAN NOT NULL, DEFAULT `false` | condição de consumo (R-14); nasce em rascunho (R-16) | visão §5 D3; T2.2 |
| `criado_em` / `atualizado_em` | TIMESTAMP NOT NULL | timestamps | técnica §2.2.1 |

### 5.4 Conteúdo de aula — tabela `conteudo_aula`

| Dado | Tipo/restrição | Papel em D3 | Rastreabilidade |
|---|---|---|---|
| `id` | UUID (PK) | identificador do bloco de conteúdo | técnica §2.2.1 |
| `aula_id` | FK → `aula.id` (ON DELETE CASCADE), INDEX | conteúdo pertence à aula; excluir aula remove conteúdo | visão §5 D3 |
| `tipo` | ENUM(`texto`, `midia_embedada`, `material_anexo`), NOT NULL | **exatamente os 3 tipos declarados na visão** (conjunto fechado) | visão §5 D3 |
| `dados` | JSONB NOT NULL | conteúdo do bloco — **forma interna, formatos aceitos, limites e regras de embed: DP-19 (não definidos aqui)** | visão §5 D3; `PLAN.md` §8 (DP-19); §10.1 |
| `criado_em` / `atualizado_em` | TIMESTAMP NOT NULL | timestamps | técnica §2.2.1 |

**Cardinalidade:** aula 1:N blocos — a **estrutura fina** (ordem, quantidade máxima, um-bloco-por-aula ou lista) é parte de **DP-19** e não é fixada como requisito aqui; a modelagem apenas não impede a lista.

### 5.5 Conclusão de aula — tabela `conclusao_aula` (registro do evento; regra R-15)

| Dado | Tipo/restrição | Papel em D3 | Rastreabilidade |
|---|---|---|---|
| `id` | UUID (PK) | identificador do evento | técnica §2.2.1 |
| `aula_id` | FK → `aula.id` (ON DELETE CASCADE), INDEX | conclusão sobre qual aula | visão §5 D3 |
| `usuario_id` | FK → `usuario.id` (ON DELETE CASCADE), INDEX | qual estudante concluiu; cascata de exclusão de conta → **P-16** | visão §5 D3; técnica §2.2.3 regra 4 |
| `concluida_em` | TIMESTAMP NOT NULL | momento da conclusão (devolvido em `concluidaEm`) | visão §4 passo 4; T2.5 |
| `criado_em` / `atualizado_em` | TIMESTAMP NOT NULL | timestamps | técnica §2.2.1 |
| índice `(aula_id, usuario_id)` | **NÃO único** (índice comum) | **sem restrição de unicidade enquanto P-14 estiver aberta** — a modelagem não prejulga a semântica de duplicata (§3.4 passo 4) | §10.2 (P-14) |

**O que D3 não modela:** percentuais e agregações de progresso (D6), XP/nível (D7), matrículas (não existem), reordenação (P-17), formatos de conteúdo (DP-19).

---

## 6. Critérios de aceitação verificáveis

### 6.1 Mapa regra da visão → critério (exigência da T2.1: "critérios de aceitação para hierarquia, publicação, autoria e conclusão de aula")

| Regra de D3 (SPEC visão §5) | Critérios |
|---|---|
| Hierarquia fixa curso > módulo > aula | AC-05 |
| Apenas professor dono (ou admin) edita | AC-06 |
| Aula só é consumível quando publicada | AC-07 |
| Conclusão de aula é registrada por estudante | AC-08 |

### 6.2 Critérios

| ID | Critério | Método de verificação |
|---|---|---|
| AC-01 | O arquivo existe e contém as 10 seções numeradas: 1 Objetivo, 2 Escopo de D3, 3 Fluxos, 4 Regras de D3, 5 Dados do catálogo, 6 Critérios de aceitação, 7 Casos de erro e estados, 8 Fora de escopo, 9 Dependências e rastreabilidade, 10 Pendências | `ls` + leitura das seções `## 1.` a `## 10.` |
| AC-02 | O escopo cobre as **6 áreas de D3** da visão (cursos, módulos, aulas, conteúdo de aula, publicação, consumo/conclusão), cada uma ligada a tarefa T2.2–T2.5, funcionalidade 3–5 e contratos (§2.1); as **4 regras da visão** estão transcritas em §4 | cruzamento §2.1 × visão §5 D3 × `TASKS.md` T2.2–T2.5 |
| AC-03 | Os **4 fluxos** (A–D) detalham os passos 3–4 do fluxo da visão §4 e o fluxo do professor, com contrafluxos, contrato correspondente e o registro de duplicata remetido a P-14 | leitura de §3 × visão §4 × §3.5 |
| AC-04 | Toda decisão técnica consumida é citada com a seção da SPEC técnica; **nenhuma decisão técnica é reaberta ou contradita**; **P-08 e P-09 são exercidas** na parcela de D3/F2 (modelo §5, contratos §3.5) com o pós-requisito de revisão declarado (§9.4) | revisão cruzada §2.4/§5/§3.5 × técnica §2.1–§2.3 e §6.4 |
| AC-05 | **Hierarquia:** criação fora de curso > módulo > aula é rejeitada (`404` alvo inexistente, `400` payload malformado — E-17); o modelo físico impõe a hierarquia por FKs (§5.1–§5.3); teste de hierarquia inválida em T2.2 | §4 R-12, §5, E-17; `TASKS.md` T2.2 |
| AC-06 | **Autoria:** criação de curso só com papel professor (E-15); toda outra mutação exige dono professor ou administrador — professor de outro curso e estudante recebem `403` (E-16); matriz §4.2 completa | §4 R-13, §4.2, E-15/E-16; teste em T2.4 |
| AC-07 | **Publicação:** aula publicada é servida a leitor autenticado (`200`); aula não publicada não é servida a não-dono/admin (`404` — E-20); rascunho de curso de outro autor não aparece no catálogo nem abre (`404` — E-19); todo recurso nasce em rascunho (R-16) | §4 R-14/R-16/R-17, E-19/E-20; `TASKS.md` T2.2 |
| AC-08 | **Conclusão:** apenas papel estudante conclui (`403` demais — E-21); aula não visível → `404` (E-22); sucesso `201 {aulaId, concluidaEm}` persiste evento em `conclusao_aula` (§5.5) declarado como insumo de D6/D7; D3 não calcula progresso/XP | §4 R-15, §3.4, §5.5, E-21/E-22; teste em T2.5 |
| AC-09 | **Duplicata de conclusão (critério de T2.5):** comportamento observável mínimo fixado — repetição não produz `5xx` e preserva o registro original; a semântica (novo evento × idempotente × `409`) **não** é fixada e está registrada como P-14; o modelo não impõe unicidade (§5.5) | §3.4 passo 4, §5.5, E-23, §10.2 |
| AC-10 | **Fronteira de vídeo:** nenhum armazenamento/transmissão de vídeo próprio em F2 — mídia é apenas embed de provedor externo (R-18), coerente com visão §6 e com T2.3/T2.6 | §4 R-18, §3.3, §8; `TASKS.md` T2.3, T2.6 |
| AC-11 | **Modelo físico de D3** presente com as 5 tabelas (`curso`, `modulo`, `aula`, `conteudo_aula`, `conclusao_aula`) nas convenções da técnica §2.2.1 (UUID, timestamps, ENUMs, FKs CASCADE), sem campo inventado — parcela D3 de **P-08** cumprida, demais domínios seguem abertos | leitura de §5 × técnica §2.2; §10.3 |
| AC-12 | **Contratos de F2** presentes: 14 operações sob `/api/v1` no formato de erro da técnica §2.3.1, **sem contrato órfão e sem tarefa de F2 sem contrato** (mapa §9.3); corpo de conteúdo remetido a DP-19 nos contratos F2-12/F2-13 — parcela F2 de **P-09** cumprida | cruzamento §3.5 × `TASKS.md` T2.2–T2.6 × técnica §2.3 |
| AC-13 | **Matriz de sessão e papel** de F2 presente (§4.2): todas as rotas com sessão exigida; criação professor; mutações dono/admin; conclusão estudante; leitura por visibilidade — base rastreável e `401`/`403` conforme técnica §2.3.2 | §4.2 × visão §3/§5 D3 × técnica §2.3.2 |
| AC-14 | **DP-19 citada como pendência, não resolvida:** nenhuma forma de conteúdo, limite de upload, regra de embed ou critério de validade de formato é fixado; F2-12/F2-13 remetem a DP-19; T2.3 permanece `[Bloqueada: DP-19]` para formato/limites | busca por `DP-19` no arquivo (ocorrências apenas como pendência: §2.3, §3, §5.4, §10.1); conferência de ausência de formatos/tamanhos definidos |
| AC-15 | **Nenhuma outra decisão é resolvida:** DP-04–DP-18 não recebem tratamento; P-14–P-17 registradas com motivo e destino, **nenhum valor arbitrário** (sem política de validação, sem semântica de duplicata/despublicação/exclusão, sem ordenação definida) | leitura de §10; conferência de ausência de valores inventados |
| AC-16 | Os casos de erro **E-14–E-27** (§7) estão todos contemplados, cada um com resposta já definida (técnica §2.3.1) ou pendência declarada | cruzamento §7 × §3.5 × técnica §2.3.1 |
| AC-17 | Toda regra funcional desta SPEC é rastreável a SPEC visão, `PLAN.md`, `TASKS.md` ou SPEC técnica (coluna "Rastreabilidade" completa em §4; referências em §2/§3/§5) | leitura de colunas de rastreabilidade |
| AC-18 | Nenhum código foi criado e nenhum outro artefato foi alterado (`src/`, `tests/`, `prisma/` sem alterações desta etapa; `PLAN.md`, `TASKS.md`, demais SPECs inalterados) | `git status` / `git diff`; `ls` |
| AC-19 | O mapa tarefa ↔ seções (§9.3) é completo: T2.2, T2.4 e T2.5 (bloqueadas por `[Depende de SPEC D3]`) têm seções e critérios próprios; T2.3 tem condições de conteúdo com DP-19 explícita; T2.6 tem ACs e verificação de fronteira — a SPEC é **suficiente para desbloquear F2** no conteúdo | cruzamento §9.3 × `TASKS.md` T2.1–T2.6 |

**Critério de encerramento da etapa (T2.1):** esta SPEC pode ser considerada apta quando AC-01–AC-19 forem todos atendidos (verificação documental) **e** a auditoria/aprovação do usuário for registrada no cabeçalho — inclusive a confirmação de que **DP-19 permanece pendente** (validação de T2.1).

## 7. Casos de erro e estados relevantes

### 7.1 Estados de publicação (entidade *publicação* — visão §5 D3)

| Estado | Condição | Efeito |
|---|---|---|
| **Rascunho** | `publicado = false` (estado inicial de todo recurso — R-16) | visível apenas para dono e admin; não listado no catálogo nem consumível por terceiros (R-17) |
| **Publicado** | `publicado = true` (ação explícita do dono/admin) | listado/servido a qualquer leitor autenticado conforme visibilidade (R-17); aula consumível (R-14) |
| **Visibilidade derivada** (leitor comum) | recurso **e todos os ancestrais** publicados (R-17 — provisória, P-15) | `200`; caso contrário `404` (não revela existência de rascunho alheio) |
| **Não-visível** (dono/admin) | qualquer estado | dono/admin sempre veem (edição/preview) |

### 7.2 Estados de conclusão (tabela `conclusao_aula`)

| Estado | Condição | Efeito |
|---|---|---|
| **Concluída** | existe registro com `concluida_em` | evento insumo de D6/D7 (§3.4 passo 3); nenhuma agregação é feita aqui |
| **Repetição** | segundo `POST` do mesmo par (aula, estudante) | comportamento observável mínimo em E-23; semântica → **P-14** |

### 7.3 Casos de erro (respostas conforme técnica §2.3.1–§2.3.3 — nenhuma resposta nova é inventada)

| ID | Contexto | Comportamento esperado | Rastreabilidade |
|---|---|---|---|
| E-14 | Qualquer rota de F2 sem sessão válida | `401` | técnica §2.3.2; §4.2; visão §5 D1 (R-05) |
| E-15 | Criação de curso com papel ≠ professor (estudante ou administrador) | `403` — criação é dos professores; admin não substitui o professor na autoria | visão §3 P2/P3; R-13; AC-06 |
| E-16 | Edição/publicação/exclusão/conteúdo por professor não-dono ou estudante | `403` | visão §5 D3; R-13; AC-06 |
| E-17 | Criação fora da hierarquia: curso/módulo inexistente no caminho → `404`; payload malformado → `400` | `404`/`400` conforme o caso | visão §5 D3; R-12; AC-05 |
| E-18 | GET/PATCH/DELETE de curso/módulo/aula inexistente | `404` | técnica §2.3.1; §3.5 |
| E-19 | Recurso existente porém **não visível** ao solicitante (rascunho de outro autor; nível não publicado) | `404` (mesmo código do inexistente — não revela rascunho alheio) | visão §4 passo 3; R-17; AC-07 |
| E-20 | `GET` de conteúdo (F2-13) de aula **não publicada** por não-dono/admin → `404`; por dono/admin → `200` (preview) | `404`/`200` conforme titularidade | visão §5 D3; R-14; AC-07 |
| E-21 | Conclusão (F2-14) com papel ≠ estudante (professor ou administrador) | `403` | visão §5 D3; R-15; AC-08 |
| E-22 | Conclusão (F2-14) de aula inexistente ou não visível/consumível | `404` | R-14/R-15; AC-08 |
| E-23 | **Conclusão repetida** (mesmo estudante, mesma aula) | status **< 500** e **registro original preservado** (primeira `concluidaEm` intacta); semântica final (novo evento × idempotente × `409`) **não fixada** → **P-14** | visão (não especifica); §3.4 passo 4; AC-09 |
| E-24 | `PUT` de conteúdo com formato inválido | `400` — **o que é "válido" depende de DP-19** (nenhum formato é definido aqui) | visão §5 D3; `PLAN.md` §8 (DP-19); AC-14 |
| E-25 | Exclusão (F2-05/F2-08/F2-11) concedida (`204`) com conclusões/progresso existentes | `204`; **efeitos sobre conclusões, progresso e certificados não especificados** → **P-16** | técnica §2.2.3 regra 4 (CASCADE); §10.2 |
| E-26 | Despublicação (`publicado: false`) de recurso com conclusões existentes | `200`; **efeito sobre conclusões/progresso já registrados não especificado** → **P-15** | visão (não especifica); §10.2 |
| E-27 | Título vazio/ausente ou fora de política (formato, tamanho); limites de quantidade de módulos/aulas | comportamento **não fixado** — ausência de política → **P-17** (o `400` de campo obrigatório em §3.1 é o mínimo mecânico; tamanho/formato/límites são P-17) | visão (não especifica); §10.2 |

**Não especificados (sem comportamento inventado):** semântica de conclusão repetida (**P-14**); encadeamento/visibilidade/despublicação (**P-15**); efeitos de exclusão de curso/módulo/aula/conta sobre progresso e certificados (**P-16**); validação, atributos extras, limites quantitativos e ordenação (**P-17**); formato de conteúdo, limites de upload e regras de embed (**DP-19**). Ver §10.

---

## 8. Fora de escopo

- **D4/D5 — Exercícios e avaliações:** questões, gabarito, tentativas, avaliações — T3.x (F3); D3 apenas provê curso/módulo onde elas vivem.
- **D6 — Progresso:** agregação de conclusões em %, métricas, estatísticas, reset — T4.x (F4); D3 entrega apenas o evento `conclusao_aula`.
- **D7 — XP/níveis:** concessão e fórmulas (DP-07) — T5.x (F5); D3 não calcula recompensa alguma.
- **D2 — Perfis:** nome/bio do dono exibido no catálogo, edição de perfil — T1.5/T1.6; `donoId` é apenas identificador.
- **D13/D17:** notificações de publicação/conclusão (F9) e moderação/remoção administrativa de conteúdo, gestão de contas (F13) — não existem rotas aqui (§2.3).
- **DP-19: não é resolvida por este documento** — formato de conteúdo de aula, limites de upload e regras de embed aparecem **apenas como pendência** (§2.3, §3.1/§3.3, §5.4, §7.3 E-24, §10.1); nenhum formato, tamanho ou provedor de embed é escolhido.
- **DP-04–DP-18: nenhuma é resolvida** — NFRs, UI/UX, acessibilidade/i18n, fórmulas, tipos de questão, dissertativas, rankings, integrações, pagamentos, IA, multi-tenancy, carga/backup, legais, analytics P4, catálogos de gamificação.
- **P-08/P-09 apenas na parcela de D3/F2** — modelo de D4–D17 e contratos de F3–F13 permanecem abertos (§10.3).
- **Requisitos funcionais novos:** nenhum; nenhuma política de validação, ordenação, limites ou duplicata é escolhida (são pendências, §10).
- **Matrícula/turma/vínculo institucional:** não existem — "não é um LMS institucional completo" (visão §6).
- **Reordenação explícita** de módulos/aulas, arrasto, posições manuais — não é requisito de nenhuma fonte (→ P-17).
- **Código, migrações, testes executáveis** — etapa de implementação (T2.2–T2.6).
- **Alterações** em `PLAN.md`, `TASKS.md`, SPEC de visão, SPEC técnica ou `decisoes-pendentes.md` — remoção dos bloqueios `[Depende de SPEC D3]` é revisão formal posterior (§9.4).

---

## 9. Dependências e rastreabilidade para as SPECs anteriores

### 9.1 Fontes (anteriores)

| Fonte | Seções usadas | Uso |
|---|---|---|
| `SPEC/2026-09-30-visao-geral.md` | §5 D3 (escopo, entidades, 4 regras); §4 passos 3–4 + fluxo do professor + regra de ouro; §3 P1–P3; §6 (não é host de vídeo, não é LMS); §5 D4–D7/D13/D16/D17 (fronteiras) | §2, §3, §4, §5, §6, §7, §8 |
| `PLAN.md` | §5.3 (escopo/entidades/regras/pendências de D3), §6 item 3 (dependências), §7 F2 (objetivo O2 parte 1, resultado, validação, pendência vinculada), §2 (funcionalidades 3–5), §8 (DP-19), §11 item 9 | §1, §2, §4, §6, §9 |
| `TASKS.md` | T2.1 (origem), T2.2, T2.3, T2.4, T2.5, T2.6; preâmbulo (bloqueios) | §2.1, §3, §6, §9.3 |
| `SPEC/2026-09-30-tecnica-fundacoes.md` | §2.1.2 (stack), §2.2 (convenções), §2.3 (formato de erro, `/api/v1`, sessão, `401`/`403`), §6.4 (P-08/P-09 + P-11–P-13 contexto da série P), §5/§6.5 (revisão formal) | §2.4, §3.5, §4.2, §5, §9.4, §10 |
| `SPEC/2026-09-30-identidade-acesso-credenciais.md` | §9.4 (pós-requisito de revisão formal), §10 (tratamento de pendências) | §9.4, §10 |
| `SPEC/2026-09-30-decisoes-pendentes.md` | §2 (status das DPs), entrada **DP-19**, §4 Categoria B, §6 (critérios de encerramento) | §8, §10 |

### 9.2 Posteriores (dependem deste artefato)

- **T2.2** (hierarquia e publicação) — critérios AC-05, AC-07; casos E-17–E-20; fluxo A/B; R-12/R-16/R-17.
- **T2.3** (conteúdo de aula) — estrutura dos três tipos: AC-10, §5.4, R-18; **formato/limites permanecem `[Bloqueada: DP-19]`** (AC-14).
- **T2.4** (autoria) — critérios AC-06; matriz §4.2; casos E-15, E-16; R-13.
- **T2.5** (consumo e conclusão) — critérios AC-08, AC-09; fluxos C/D; casos E-20–E-23; R-14/R-15.
- **T2.6** (validação de F2) — percurso dos passos 3–4 (AC-03), regras via §6.1, fronteira de vídeo (AC-10).
- **SPECs posteriores** — D6 consome `conclusao_aula` (P-14/P-16 relevantes); D4/D5 consomem a estrutura de curso/módulo; D17 recebe as rotas de moderação fora de F2.

### 9.3 Mapa tarefa ↔ seções desta SPEC

| Tarefa | Seções principais | Critérios |
|---|---|---|
| T2.2 | §3.1, §3.2, §4 (R-12, R-16, R-17), §4.2, §5.1–§5.3, §7.1, E-17–E-20 | AC-05, AC-07 |
| T2.3 | §3.1 passo 3, §3.3, §5.4, R-18, §8 (DP-19) | AC-10, AC-14 (estrutura); formato/limites seguem bloqueados |
| T2.4 | §4 (R-13), §4.2, E-15, E-16 | AC-06 |
| T2.5 | §3.3, §3.4, §4 (R-14, R-15), §5.5, §7.2, E-20–E-23 | AC-08, AC-09 |
| T2.6 | §3 (fluxos), §6.1 (mapa regra→AC), R-18, §7 | AC-01–AC-19 |

### 9.4 Pós-requisitos de processo (não executados nesta etapa)

1. **Remoção formal dos bloqueios:** o `TASKS.md` ainda marca T2.2, T2.4 e T2.5 como `[Depende de SPEC D3]` (e T2.3 parcialmente por DP-19). Esta SPEC fornece o **conteúdo** exigido; a **remoção formal** dos estados de bloqueio em `TASKS.md`/`PLAN.md` depende da **revisão formal posterior** já registrada na técnica §5/§6.5 e espelhada em D1 §9.4. Até lá, nenhum desses arquivos é alterado.
2. **Revisão da SPEC técnica (P-08/P-09):** a técnica §6.4 designou as SPECs de domínio como artefato responsável por P-08/P-09 **"(+ revisão desta SPEC)"**. Esta SPEC cumpre a parcela de D3/F2; a revisão da técnica para incorporar essas decisões (e as dos próximos domínios) segue pendente.
3. **Auditoria/aprovação** deste artefato pelo usuário antes de qualquer commit ou execução de T2.2+.

---

## 10. Pendências

Série **P-xx** iniciada na técnica (P-01–P-10) e continuada na SPEC de D1 (P-11–P-13) — esta SPEC inicia em **P-14**. Nenhuma informação abaixo é escolhida arbitrariamente: onde a fonte não define, o valor fica em aberto.

### 10.1 Pendência herdada, obrigatória nesta SPEC — permanece aberta

| ID | Pendência | Por que permanece aberta | Condição para fechar |
|---|---|---|---|
| **DP-19** | **Formato de conteúdo de aula, limites de upload e regras de embed** (inclui forma interna de `conteudo_aula.dados` e cardinalidade fina dos blocos) | a visão §5 D3 cita as entidades de conteúdo (texto, mídia embedada, material anexo) **sem detalhá-las**; o embed de vídeo externo é limite fixo (visão §6), mas formato, tamanhos, provedores e critérios de validade não estão em nenhuma fonte (visão §5/§6, `PLAN.md` §8/§11 item 9, `TASKS.md` T2.3) | **SPEC de conteúdo** (`PLAN.md` §8; `decisoes-pendentes.md` entrada DP-19) — antes do detalhe/formato de T2.3; **não é resolvida por este documento** (AC-14) |

Efeito reconhecido: **T2.3 permanece `[Bloqueada: DP-19]`** para formato/limites (execução parcial de estrutura é `[Livre]`, conforme `TASKS.md` T2.3); F2-12/F2-13 existem como contrato com corpo remetido a DP-19.

### 10.2 Pendências novas abertas por esta SPEC

| ID | Pendência | Por que não foi decidida aqui | Artefato responsável |
|---|---|---|---|
| **P-14** | **Semântica de re-conclusão da mesma aula** (novo evento × idempotente × conflito `409`) e seu efeito em progresso/XP | nenhuma fonte define; D8 declara desbloqueio "idempotente" e D6 "percentuais monotonicamente crescentes", mas **D3 não tem regra de duplicata** — decidir qualquer uma das três sem fonte seria inventar requisito; por isso o índice de `conclusao_aula` é **não único** (§5.5) e o critério de T2.5 é o mínimo observável (E-23) | SPEC de D3 (com insumo de D6/D7 ao serem escritas) |
| **P-15** | **Semântica de publicação de curso/módulo além da regra da aula**: encadeamento exato (se publicação de pai é exigida), visibilidade de rascunhos em listagens, efeito da **despublicação** sobre conclusões/progresso existentes | a visão só define "aula só é consumível quando publicada"; estados de publicação de curso/módulo vêm de T2.2 (PLAN) sem semântica declarada — a R-17 é **provisória conservadora** e a E-26 não tem comportamento fixado | SPEC de D3 (revisão) |
| **P-16** | **Efeito da exclusão** de curso, módulo, aula ou de **conta de professor/estudante** sobre conclusões, progresso (D6) e certificados (D16) | a técnica §2.2.3 regra 4 fixa FKs `ON DELETE CASCADE` (portanto os registros somem fisicamente), mas a visão não define o destino dos dados derivados (nem a alternativa RESTRICT/transferência de propriedade); decidir seria inventar regra de D6/D16 | SPEC de D6/D16 (+ revisão de D3) |
| **P-17** | **Atributos, validação e limites de curso/módulo/aula**: política de `titulo` (formato, tamanho, vazio), limites quantitativos (módulos por curso, aulas por módulo) e **ordenação explícita** (reordenação) | nenhuma fonte define validação ou ordem; a visão declara entidades, não campos além do essencial — fixar tamanho/limite/ordem seria escolha arbitrária | SPEC de D3 (revisão) |

### 10.3 Pendências de outras SPECs (não tratadas aqui — apenas fronteira citada)

- **P-08/P-09:** esta SPEC cumpre a **parcela de D3 (modelo) e F2 (contratos)**; as parcelas de **D4–D17 e F3–F13 permanecem abertas** — técnica §6.4.
- **P-05/P-06/P-07** → SPEC de **D2/D13** (atributos de perfil, visibilidade, preferências).
- Série de decisões de domínio: DP-07 (D7), DP-08/DP-09 (D4/D5), DP-10 (D11), DP-11 (integrações), DP-17 (analytics), DP-18 (catálogos) — conforme `PLAN.md` §8 e `decisoes-pendentes.md`.
- **DP-01–DP-03:** resolvidas pela técnica aprovada e **consumidas** aqui (§2.4); nenhuma é reaberta.

### 10.4 Confirmação de não-resolução

- **DP-19: não é resolvida por este documento** — todas as ocorrências são remissões a pendência (§2.3, §3.1, §3.3, §5.4, §7.3 E-24, §10.1); nenhum formato, limite ou regra de embed é escolhido (AC-14).
- **DP-04–DP-18: nenhuma é resolvida** — ocorrências apenas como lista de não-resolução (§8).
- **Nenhum valor arbitrário foi escolhido:** não há nesta SPEC política de validação/tamanho de título, limites quantitativos, ordenação, semântica de duplicata, regra de despublicação, efeito de exclusão ou formato de conteúdo — todos registrados como pendência acima (AC-15).
- **Nenhum requisito funcional foi inventado:** visibilidade, derivação de titularidade e estado inicial rascunho são derivadas das fontes com rastreabilidade declarada (§4 nota de derivações); o resto é pendência.


