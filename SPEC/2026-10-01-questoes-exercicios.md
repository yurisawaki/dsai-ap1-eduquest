# SPEC/2026-10-01-questoes-exercicios.md — SPEC do domínio D4: Exercícios e questões (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-10-01-questoes-exercicios.md` (T3.1 — SPEC do domínio D4; veículo de resolução de **DP-08**) |
| Status | **Aprovada — 2026-10-01**, após auditoria final (§12) e aprovação do usuário das propostas D4-a–D4-h (U-4). Revisões formais de §11.2 executadas na mesma data — **DP-08 resolvida** |
| Data | 2026-10-01 |
| Domínio / Fase | **D4 — Exercícios e questões** · Fase **F3** (`PLAN.md` §7) |
| Tarefa de origem | **T3.1** (`TASKS.md`), hoje `[Bloqueada: DP-08]` — esta SPEC é o veículo de resolução |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` → `PLAN.md` → `TASKS.md` → `SPEC/2026-09-30-decisoes-pendentes.md`; técnica: `SPEC/2026-09-30-tecnica-fundacoes.md`; baseline estrutural: `SPEC/2026-09-30-catalogo-aprendizagem.md` (D3) |
| Decisões do usuário (2026-10-01) | **U-1** (DP-08): conjunto definitivo = múltipla escolha, verdadeiro/falso, numérica, dissertativa. **U-2**: a questão pertence ao **módulo**. **U-3**: escopo desta etapa = apenas a SPEC de D4 (sem código; D5+ fora). **U-4**: propostas D4-a–D4-h aprovadas sem alteração |
| Não resolve | DP-09 (correção de dissertativas — SPEC de D5); DP-07 (XP); fórmula de progresso (D6); DP-04–DP-07, DP-10–DP-18; P-14–P-21 |
| Restrições desta etapa | Sem código; sem alterar `PLAN.md`, `TASKS.md`, demais SPECs; informação não determinável vira pendência (§10) |

---

## 1. Objetivo

Transformar em critérios verificáveis o domínio **D4** da visão (§5 D4): questões, gabarito, tentativas de exercício e feedback imediato, cobrindo as tarefas T3.2 (questões e gabarito protegido) e T3.3 (tentativas e feedback), e **registrar a resolução de DP-08** (conjunto definitivo de tipos de questão — decisão U-1 do usuário).

Esta SPEC não cria requisitos além das fontes. Toda escolha não ditada por elas está marcada como **Proposta D4** (para auditoria) ou registrada como **pendência** (§10). Nenhuma decisão de D5 (avaliações), D6 (progresso) ou D7 (XP) é tomada.

---

## 2. Escopo

### 2.1 Fonte (visão §5 D4)

> **D4 — Exercícios e questões.** Escopo: questões, gabarito, tentativas de exercício e feedback imediato. Entidades: questão (múltipla escolha, verdadeiro/falso, numérica, dissertativa — conjunto a confirmar em SPEC própria), alternativa, tentativa, resposta, feedback. Regras: questão pertence a um curso/módulo; tentativa registrada com resposta e acerto; gabarito não exposto antes do envio; feedback emitido conforme regra da questão.

Fluxo (visão §4 passo 5): "estudante responde questões; recebe feedback e XP imediato por acerto; progresso do módulo avança". Fluxo do professor: "publica questões/exercícios/avaliações".

### 2.2 Áreas cobertas

| Área | Onde | Tarefa |
|---|---|---|
| Tipos de questão (DP-08) | §4 R-Q1 | T3.1 |
| Autoria e publicação de questões no módulo | §3.1, §4 R-Q2–R-Q4, §6 F3-01–F3-05 | T3.2 |
| Gabarito protegido | §4 R-Q5 | T3.2 |
| Tentativa, correção automática e feedback | §3.2, §4 R-Q6–R-Q9, §6 F3-06 | T3.3 |

### 2.3 "Exercício" (Proposta D4-a)

A visão lista **exercícios** como funcionalidade, mas **não** como entidade de D4 (entidades: questão, alternativa, tentativa, resposta, feedback). Esta SPEC **não cria entidade "exercício"**: um exercício é o ato de o estudante responder às questões publicadas de um módulo (passo 5). Um agrupador nomeado de questões seria entidade nova → pendência **P-27**.

### 2.4 Fronteiras

| Item | Pertence a |
|---|---|
| Avaliações (composição, nº de tentativas, janela, nota) | **D5** (F3, SPEC própria) |
| Correção manual de dissertativas | **DP-09 / D5** — aqui a dissertativa é registrada **sem** correção (R-Q8) |
| XP "imediato por acerto" | **D7** (F5) — D4 apenas registra a tentativa com `acerto` (insumo) |
| "Progresso do módulo avança" | **D6** (F4) — idem |
| Estrutura curso/módulo, publicação, autoria | **D3** (consumida, não alterada) |
| Analytics por questão | **D15** |

---

## 3. Fluxos

### 3.1 Professor — autoria (T3.2)

1. Professor dono do curso (ou admin) cria questão num módulo (F3-01) → `201 {questaoId}`, em **rascunho**.
2. Edita enunciado, explicação, alternativas/gabarito (F3-04) e publica (`publicado: true`).
3. Exclui (F3-05) → `204`; tentativas da questão saem por CASCADE (efeito sobre progresso/XP → P-16 da D3, estendida).

**Contrafluxos:** `401` sem sessão; `404` módulo/questão inexistente; `403` não-dono/estudante; `400` corpo inválido. Ordem `401 → 404 → 403 → 400` (mesma convenção da SPEC de conteúdo R-C10).

### 3.2 Estudante — exercício (T3.3; passo 5)

1. Lista as questões publicadas de um módulo visível (F3-02) e abre uma (F3-03) — **sem gabarito**.
2. Envia resposta (F3-06) → `201 {tentativaId, acerto, feedback}`; a tentativa fica registrada com resposta e acerto (R-Q6).
3. Pode tentar de novo (R-Q9); cada envio é uma nova tentativa.

**Contrafluxos:** `401`; `404` questão inexistente ou não visível; `403` papel ≠ estudante; `400` resposta fora do formato do tipo.

---

## 4. Regras

| ID | Regra | Natureza / detalhe | Rastreabilidade |
|---|---|---|---|
| R-Q1 | **Conjunto fechado de 4 tipos** | **Decisão U-1 (DP-08).** `tipo` ∈ {`multipla_escolha`, `verdadeiro_falso`, `numerica`, `dissertativa`}; outro valor → `400`. O tipo é **imutável** após a criação (Proposta D4-b: mudar o tipo invalidaria tentativas já registradas) | visão §5 D4; decisão do usuário |
| R-Q2 | **Questão pertence a exatamente 1 módulo** | **Decisão U-2.** FK `modulo_id`; não há questão direta em curso. Criação em módulo inexistente → `404` | visão §5 D4 ("curso/módulo"); decisão do usuário |
| R-Q3 | **Autoria: professor dono do curso ou admin** | **Herdada** (D3 R-13, titularidade transitiva curso → módulo → questão). Estudante e professor não-dono → `403` | visão §3 P2/P3, §5 D3; D3 R-13 |
| R-Q4 | **Publicação e visibilidade** | **Derivação** de D3 R-16/R-17: questão nasce em rascunho; leitor comum vê a questão só se ela **e** módulo **e** curso estão publicados; dono/admin veem tudo. Não visível → `404` | visão §4 fluxo do professor ("publica questões"); D3 R-16/R-17 |
| R-Q5 | **Gabarito nunca exposto ao leitor** | **Herdada** ("gabarito não exposto antes do envio") + **Proposta D4-c** (conservadora): para não-dono/não-admin, F3-02/F3-03 **omitem** `correta` das alternativas e o `gabarito`; F3-06 devolve apenas `acerto` e `explicacao` — **o gabarito também não é revelado após o envio** (revelar seria regra nova; ver P-29) | visão §5 D4 |
| R-Q6 | **Tentativa registrada com resposta e acerto** | **Herdada.** Toda resposta válida gera linha em `tentativa` com a resposta enviada e `acerto` calculado **no servidor** (regra de ouro, visão §4). O cliente nunca informa `acerto` | visão §5 D4, §4 regra de ouro |
| R-Q7 | **Correção automática por tipo** | **Proposta D4-d.** **Múltipla escolha:** 2–10 alternativas, ≥1 correta; resposta = lista de ids de alternativas sem repetição; acerto ⇔ conjunto enviado = conjunto de corretas (correção exata, sem pontuação parcial). **Verdadeiro/falso:** gabarito booleano; acerto ⇔ igualdade. **Numérica:** gabarito `{valor, tolerancia}` com `tolerancia ≥ 0` definida pelo professor; acerto ⇔ \|resposta − valor\| ≤ tolerancia | visão §5 D4 ("tentativa com resposta e acerto") |
| R-Q8 | **Dissertativa sem correção em D4** | **Derivação** de DP-09 aberta: resposta = texto (1–20.000 pontos de código, não vazio após trim); tentativa gravada com `acerto = null` ("não corrigida"). Nenhuma correção manual existe aqui | visão §5 D5 ("a confirmar"); DP-09 |
| R-Q9 | **Tentativas de exercício ilimitadas** | **Derivação** (ausência de regra): limite de tentativas é regra de **avaliação** (D5); para exercício nenhuma fonte limita. Qual tentativa conta para progresso/XP → P-24 | visão §5 D4/D5 |
| R-Q10 | **Feedback imediato** | **Herdada** ("feedback emitido conforme regra da questão") + **Proposta D4-e**: a "regra da questão" é o `acerto` calculado por R-Q7 mais a `explicacao` opcional escrita pelo professor; para dissertativa, `acerto: null` e a explicação | visão §5 D4, §4 passo 5 |
| R-Q11 | **Somente estudante responde** | **Derivação** de visão §3 P1 ("executa exercícios") e do paralelo com D3 R-15. Professor/admin → `403` | visão §3 P1, §4 passo 5 |
| R-Q12 | **Limites de conteúdo** | **Proposta D4-f** (revisáveis pela SPEC de NFRs — P-26): enunciado 1–20.000 pontos de código (não vazio após trim); explicação `null` ou 1–20.000 (correção F-1 da auditoria); alternativa 1–1.000; 2–10 alternativas; valores numéricos finitos (JSON number) | coerência com SPEC de conteúdo §2.2 |

---

## 5. Modelo físico (exercício de P-08 para D4)

Convenções da técnica §2.2.1/§2.2.2 (UUID da aplicação, `criado_em`/`atualizado_em`, ENUM minúsculo, FKs `ON DELETE CASCADE`).

### 5.1 `questao`

| Dado | Tipo/restrição | Papel |
|---|---|---|
| `id` | UUID PK | `questaoId` |
| `modulo_id` | FK → `modulo.id` (CASCADE), INDEX | R-Q2 |
| `tipo` | ENUM(`multipla_escolha`, `verdadeiro_falso`, `numerica`, `dissertativa`) NOT NULL | R-Q1 |
| `enunciado` | TEXT NOT NULL | R-Q12 |
| `explicacao` | TEXT NULL | feedback (R-Q10) |
| `gabarito` | JSONB NULL | V/F: `{"valor": boolean}`; numérica: `{"valor": number, "tolerancia": number}`; múltipla escolha e dissertativa: `NULL` (MC usa `alternativa.correta`) |
| `publicado` | BOOLEAN NOT NULL DEFAULT false | R-Q4 |
| `criado_em` / `atualizado_em` | TIMESTAMP | ordem de listagem provisória `criado_em, id` (P-22) |

### 5.2 `alternativa` (só múltipla escolha)

| Dado | Tipo/restrição |
|---|---|
| `id` | UUID PK |
| `questao_id` | FK → `questao.id` (CASCADE) |
| `texto` | TEXT NOT NULL |
| `correta` | BOOLEAN NOT NULL |
| `posicao` | INTEGER NOT NULL; UNIQUE (`questao_id`, `posicao`) — ordem de exibição 0…n−1 |
| `criado_em` / `atualizado_em` | TIMESTAMP |

### 5.3 `tentativa`

| Dado | Tipo/restrição | Papel |
|---|---|---|
| `id` | UUID PK | `tentativaId` |
| `questao_id` | FK → `questao.id` (CASCADE), INDEX | |
| `usuario_id` | FK → `usuario.id` (CASCADE), INDEX | estudante |
| `resposta` | JSONB NOT NULL | resposta como enviada (R-Q6) |
| `acerto` | BOOLEAN NULL | `null` só para dissertativa (R-Q8) |
| `criado_em` / `atualizado_em` | TIMESTAMP | momento da tentativa |

`acerto` é **instantâneo** no momento do envio: editar o gabarito depois **não** recalcula tentativas (Proposta D4-g; política definitiva → P-23).

---

## 6. Contratos de F3 (parcela D4 — exercício de P-09)

Sob `/api/v1`, JSON, erro `{"erro": {"codigo", "mensagem"}}`, códigos 400/401/403/404 (técnica §2.3.1). Todos exigem sessão.

| # | Método | Rota | Propósito | Papel | Sucesso | Erros |
|---|---|---|---|---|---|---|
| F3-01 | POST | `/modulos/{id}/questoes` | criar questão | dono/admin | `201 {questaoId}` | 400, 401, 403, 404 |
| F3-02 | GET | `/modulos/{id}/questoes` | listar questões visíveis do módulo | autenticado (visibilidade R-Q4) | `200 [questão]` | 401, 404 (módulo inexistente/não visível) |
| F3-03 | GET | `/questoes/{id}` | ler questão | autenticado (R-Q4/R-Q5) | `200 questão` | 401, 404 |
| F3-04 | PATCH | `/questoes/{id}` | editar `enunciado`, `explicacao`, `alternativas`/`gabarito`, `publicado` | dono/admin | `200 questão` | 400, 401, 403, 404 |
| F3-05 | DELETE | `/questoes/{id}` | excluir questão | dono/admin | `204` | 401, 403, 404 |
| F3-06 | POST | `/questoes/{id}/tentativas` | responder | estudante | `201 {tentativaId, acerto, feedback: {explicacao}}` | 400, 401, 403, 404 |

**Corpo de criação (F3-01):** `{tipo, enunciado, explicacao?, alternativas?, gabarito?}` — `alternativas: [{texto, correta}]` (ordem do array = `posicao`) **somente** em múltipla escolha; `gabarito` somente em V/F e numérica; dissertativa sem ambos. Chaves fora do tipo → `400`.

**F3-04:** campos opcionais (corpo vazio → `400`); `alternativas`, quando enviado, **substitui** a lista inteira (novos ids); `tipo` não é aceito (R-Q1); `alternativas` em questão que não é múltipla escolha, ou `gabarito` em múltipla escolha/dissertativa → `400` (F-2). Tentativas anteriores mantêm a `resposta` original, que pode citar ids de alternativas substituídas — coerente com D4-g (sem recálculo; F-3).

**F3-02:** devolve as questões ordenadas por `criado_em, id` (provisório — P-22; F-4).

**Forma da questão (F3-02/F3-03):** `{id, moduloId, tipo, enunciado, explicacao, publicado, alternativas?: [{id, texto, posicao, correta?}], gabarito?}` — `correta` e `gabarito` **apenas** para dono/admin (R-Q5). `explicacao` só é exposta ao leitor **no feedback** (F3-06), não na leitura da questão (Proposta D4-h: explicação costuma conter a solução).

**Resposta (F3-06), por tipo:** MC `{"alternativas": [<id>, …]}` (≥1 id, sem repetição, todos da questão); V/F `{"valor": boolean}`; numérica `{"valor": number}`; dissertativa `{"texto": string}`. Chaves extras → `400`.

---

## 7. Critérios de aceitação

### 7.1 Documentais

| ID | Critério |
|---|---|
| AC-01 | DP-08 registrada como decisão U-1 com os 4 tipos, rastreável à visão §5 D4 |
| AC-02 | Questão vinculada só a módulo (U-2); nenhuma entidade "exercício" criada (§2.3) |
| AC-03 | Toda "Proposta D4-x" está identificada para auditoria; nenhuma regra nova sem marcação |
| AC-04 | Nenhuma decisão de D5/D6/D7 tomada; DP-09 permanece aberta (R-Q8) |
| AC-05 | Modelo (§5) segue as convenções da técnica; contratos (§6) não criam código HTTP novo |
| AC-06 | Pendências (§10) com origem e destino |

### 7.2 Testáveis (para T3.2/T3.3)

| ID | Teste |
|---|---|
| TQ-01 | Criar questão de cada um dos 4 tipos → `201`; tipo fora do conjunto → `400` |
| TQ-02 | MC com <2 ou >10 alternativas, ou sem alternativa correta → `400`; `gabarito` em MC → `400` |
| TQ-03 | V/F sem `gabarito.valor` booleano → `400`; numérica com tolerância negativa ou valor não finito → `400` |
| TQ-04 | Dissertativa com `gabarito` ou `alternativas` → `400` |
| TQ-05 | Não-dono e estudante em F3-01/F3-04/F3-05 → `403`; sem sessão → `401`; módulo inexistente → `404` |
| TQ-06 | Estudante não vê questão em rascunho nem de módulo/curso em rascunho (`404`); dono/admin veem |
| TQ-07 | Leitura por estudante **não contém** `correta` nem `gabarito` nem `explicacao`; dono vê todos |
| TQ-08 | MC: conjunto exato → `acerto: true`; subconjunto ou superconjunto → `false`; id de outra questão → `400` |
| TQ-09 | V/F e numérica: dentro da tolerância → `true`; fora → `false`; tolerância 0 exige igualdade |
| TQ-10 | Dissertativa → `201` com `acerto: null`; texto vazio/só espaços ou >20.000 → `400` |
| TQ-11 | Toda resposta válida grava 1 linha em `tentativa` com resposta e acerto; o corpo com `acerto` enviado pelo cliente → `400` |
| TQ-12 | Professor/admin em F3-06 → `403`; questão não visível → `404` |
| TQ-13 | Segunda tentativa da mesma questão → `201` e nova linha (R-Q9) |
| TQ-14 | F3-06 devolve `explicacao` no feedback e **nunca** o gabarito |
| TQ-15 | PATCH com `tipo` → `400`; editar gabarito não altera `acerto` de tentativas anteriores |
| TQ-16 | Excluir questão/módulo/curso remove questões, alternativas e tentativas (CASCADE) |

---

## 8. Erros

| ID | Situação | HTTP |
|---|---|---|
| EQ-01 | Sem sessão | 401 |
| EQ-02 | Módulo/questão inexistente ou não visível ao leitor | 404 |
| EQ-03 | Mutação por não-dono/estudante; resposta por não-estudante | 403 |
| EQ-04 | Corpo inválido (tipo, alternativas, gabarito, limites, chaves extras, resposta fora do formato) | 400 |
| EQ-05 | Falha interna | 500 |

---

## 9. Fora de escopo

Avaliações e nota (D5); correção manual (DP-09); XP e níveis (D7, DP-07); progresso e percentuais (D6); notificações (D13); analytics por questão (D15); agrupador "exercício" (P-27); importação/banco de questões; questões compartilhadas entre módulos; aleatorização; tempo limite; código, migrações e testes (etapa T3.2/T3.3).

---

## 10. Pendências

Série P continua após P-21 (SPEC de conteúdo).

| ID | Pendência | Destino |
|---|---|---|
| P-22 | Ordem explícita/reordenação de questões no módulo (provisório: `criado_em, id`) | revisão de D4 |
| P-23 | Efeito de editar gabarito sobre tentativas já registradas (provisório: não recalcula) | revisão de D4 / D6 |
| P-24 | Qual tentativa conta para progresso e XP (primeira, melhor, última, todas) | SPECs de D6/D7 |
| P-25 | Destino das dissertativas de exercício (correção manual?) | DP-09 — SPEC de D5 |
| P-26 | Revisão dos limites numéricos (R-Q12) | SPEC de NFRs (DP-04) |
| P-27 | Entidade agrupadora "exercício" (conjunto nomeado de questões) | revisão de D4 |
| P-28 | Histórico de tentativas visível ao estudante | D6 |
| P-29 | Revelar gabarito após o envio (e a partir de quando) | revisão de D4 |
| P-30 | **Superfície web de D4** (telas de autoria de questões e de resposta pelo estudante): esta SPEC não define interface — diferente da SPEC de conteúdo (R-C8). Registrada na implementação de T3.2/T3.3 (2026-10-01), que entregou só a API | revisão de D4 |

DP-09 permanece **aberta**. Não resolvidas aqui: DP-04–DP-07, DP-10–DP-18; P-14–P-21.

---

## 11. Rastreabilidade e revisões

### 11.1 Fontes

visão §3 P1/P2, §4 passo 5 e regra de ouro, §5 D4/D5; `PLAN.md` §5.4, §7 F3, §8 DP-08/DP-09; `TASKS.md` T3.1–T3.3; `decisoes-pendentes.md` DP-08, §6; técnica §2.2–§2.3; D3 R-13/R-16/R-17.

### 11.2 Revisões formais após aprovação (executadas em 2026-10-01)

| Artefato | Revisão |
|---|---|
| `PLAN.md` §8 | DP-08 → "Resolvida (SPEC/2026-10-01-questoes-exercicios.md)"; §5.4 pendência de tipos resolvida |
| `decisoes-pendentes.md` | DP-08 → Resolvida; contagem |
| `TASKS.md` | T3.1 concluída; T3.2/T3.3 sem `[Bloqueada: DP-08]` (T3.5 continua bloqueada por DP-09 e depende da SPEC de D5) |

### 11.3 Propostas (aprovadas pelo usuário — U-4)

| ID | Proposta | Alternativa não adotada |
|---|---|---|
| D4-a | Sem entidade "exercício" | agrupador nomeado (P-27) |
| D4-b | Tipo imutável | permitir troca apagando tentativas |
| D4-c | Gabarito nunca revelado, nem após envio | revelar após envio (P-29) |
| D4-d | MC com correção exata (sem parcial); numérica com tolerância absoluta | pontuação parcial; tolerância relativa |
| D4-e | Feedback = `acerto` + `explicacao` | textos por alternativa |
| D4-f | Limites de R-Q12 | outros valores (P-26) |
| D4-g | `acerto` instantâneo, sem recálculo | recálculo (P-23) |
| D4-h | Explicação só no feedback | explicação visível junto ao enunciado |

---

## 12. Registro de auditoria final e aprovação (2026-10-01)

Auditoria contra visão (§3, §4 passo 5, §5 D4/D5), `PLAN.md` (§5.4, §7 F3, §8), `TASKS.md` (T3.1–T3.5), `decisoes-pendentes.md` (DP-08/DP-09), técnica (§2.2–§2.3) e D3 (R-13/R-16/R-17). Nenhum conflito de escopo: nada de D5/D6/D7 foi decidido; DP-09 segue aberta; regra de ouro preservada (`acerto` só no servidor).

| ID | Achado | Correção |
|---|---|---|
| F-1 | R-Q12 permitia explicação vazia ("0–20.000") | explicação `null` ou 1–20.000 |
| F-2 | F3-04 não fixava erro para `alternativas` fora de MC ou `gabarito` em MC/dissertativa | `400` explícito |
| F-3 | Substituir alternativas deixa ids antigos em `tentativa.resposta` sem menção | explicitado como consequência de D4-g |
| F-4 | Ordem de F3-02 não declarada | `criado_em, id` provisório (P-22) |
| F-5 | Aprovação das propostas não registrada; título da §11.3 com erro de digitação | U-4 no cabeçalho; §11.3 corrigida |

**Veredito:** consistente com as fontes → **Aprovada**. DP-08 resolvida (U-1); pendências P-22–P-29 abertas.
