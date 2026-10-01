# SPEC/2026-10-01-avaliacoes.md — SPEC do domínio D5: Avaliações (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-10-01-avaliacoes.md` (T3.4 — SPEC do domínio D5; veículo de resolução de **DP-09**) |
| Status | **Aprovada — 2026-10-01**, após auditoria final (§12) e aprovação do usuário das propostas D5-a–D5-j (U-5). Revisões formais de §11.2 executadas na mesma data — **DP-09 resolvida** |
| Data | 2026-10-01 |
| Domínio / Fase | **D5 — Avaliações** · Fase **F3** (`PLAN.md` §7) |
| Tarefa de origem | **T3.4** (`TASKS.md`), `[Bloqueada: DP-09]` para o item de correção manual — esta SPEC é o veículo de resolução |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` → `PLAN.md` → `TASKS.md` → `SPEC/2026-09-30-decisoes-pendentes.md`; técnica: `SPEC/2026-09-30-tecnica-fundacoes.md`; baselines: `SPEC/2026-09-30-catalogo-aprendizagem.md` (D3), `SPEC/2026-10-01-questoes-exercicios.md` (D4) |
| Decisões do usuário (2026-10-01) | **U-1** (DP-09): dissertativas de avaliação têm **correção manual pelo professor dono** (ou admin). **U-2**: a avaliação pertence a um **curso** e é composta por **questões existentes (D4) dos módulos desse curso** — a mesma questão pode servir a exercício e avaliação. **U-3**: nota **0–10 com peso por questão**. **U-4**: o resultado da avaliação é a **maior nota** entre as tentativas corrigidas. **U-5**: propostas D5-a–D5-j aprovadas sem alteração |
| Não resolve | Progresso (D6) e XP/recompensa (D7) a partir do resultado; **P-25** (correção de dissertativas de **exercício** — DP-09 é resolvida só para avaliações); P-30 (superfície web de D4); DP-04–DP-07, DP-10–DP-18; P-14–P-29 |
| Restrições desta etapa | Sem código; sem alterar `PLAN.md`, `TASKS.md`, demais SPECs; informação não determinável vira pendência (§10) |

---

## 1. Objetivo

Transformar em critérios verificáveis o domínio **D5** (visão §5 D5) — avaliações compostas por questões, regras de tentativa, prazo, nota e resultado —, cobrindo a tarefa T3.5, e **registrar a resolução de DP-09** (decisão U-1).

Toda escolha não ditada pelas fontes ou pelas decisões U-1–U-4 está marcada como **Proposta D5-x** (§11.3) ou registrada como pendência (§10). Nenhuma decisão de D6 (progresso), D7 (XP) ou D16 (certificados) é tomada.

---

## 2. Escopo

### 2.1 Fonte (visão §5 D5)

> **D5 — Avaliações.** Escopo: avaliações compostas por questões, regras de tentativa, prazo, nota e resultado. Entidades: avaliação, composição (questões), tentativa de avaliação, nota, prazo. Regras: professor define número de tentativas e janela; nota calculada servidor; resultado atualiza progresso acadêmico; pode haver correção manual de dissertativas (a confirmar em SPEC própria).

Fluxo (visão §4 passo 6): "estudante realiza avaliação (com regras de tentativa e nota); resultado atualiza progresso acadêmico e pode conceder XP/recompensa". Persona P2: "publica e corrige avaliações".

### 2.2 Fronteiras

| Item | Pertence a |
|---|---|
| Questões, tipos, gabarito, formato de resposta | **D4** (consumido, não alterado) |
| "Resultado atualiza progresso acadêmico" | **D6** — D5 expõe o resultado (R-A10) como insumo; nada é agregado aqui |
| "Pode conceder XP/recompensa" | **D7/D12** |
| Nota mínima para certificado | **D16** |
| Notificação de resultado | **D13** |
| Interface web | não especificada — pendência (P-37, junto de P-30) |

---

## 3. Fluxos

### 3.1 Professor — montar e publicar (T3.5)

1. Professor dono do curso (ou admin) cria a avaliação no curso (F3-07) com título, número máximo de tentativas, janela (`abreEm`, `fechaEm`) e composição (lista ordenada de questões do curso com peso) → `201 {avaliacaoId}`, em rascunho.
2. Ajusta e publica (F3-10). A composição só pode mudar enquanto não houver tentativas (R-A6).

### 3.2 Estudante — realizar (passo 6)

1. Lista as avaliações publicadas do curso (F3-08) e abre uma (F3-09): metadados sempre; questões (sem gabarito) apenas dentro da janela (R-A4).
2. Envia **todas as respostas de uma vez** (F3-12) dentro da janela e com tentativas restantes → `201 {tentativaId, status, nota}`.
3. Se não houver dissertativa, a tentativa já sai `corrigida` com nota; se houver, sai `aguardando_correcao` e `nota: null`.
4. Consulta o próprio resultado (F3-13): tentativas, tentativas restantes e resultado (maior nota corrigida).

### 3.3 Professor — corrigir dissertativas (DP-09)

1. Lista as tentativas da avaliação (F3-14), com respostas e status.
2. Atribui os pontos de cada resposta dissertativa (F3-15), entre 0 e o peso da questão.
3. Quando todas as dissertativas da tentativa têm pontos, ela passa a `corrigida` e a nota é calculada (R-A8).

**Contrafluxos:** `401` sem sessão; `404` inexistente ou não visível; `403` papel/titularidade; `400` corpo inválido; `409` fora da janela, tentativas esgotadas ou composição bloqueada (R-A5/R-A6 — Proposta D5-g).

---

## 4. Regras

| ID | Regra | Natureza / detalhe | Rastreabilidade |
|---|---|---|---|
| R-A1 | **Avaliação pertence a 1 curso** | **Decisão U-2.** FK `curso_id`; criação e mutação por professor dono do curso ou admin (D3 R-13); estudante e não-dono → `403` | visão §3 P2, §5 D5; decisão do usuário |
| R-A2 | **Composição por questões do curso, com peso** | **Decisão U-2/U-3.** Lista ordenada de 1–100 questões **distintas**, todas de módulos do mesmo curso (outra origem → `400`); cada uma com `peso` > 0 e ≤ 1.000 (Proposta D5-a para os limites). A `questao.publicado` de D4 — e a publicação do **módulo** — **não** afetam a avaliação: uma questão em rascunho (fora da lista de exercícios) ou de módulo em rascunho pode compor a avaliação; a visibilidade é regida só por R-A4 (Proposta D5-b — permite questões de prova ocultas no exercício; F-2). `peso` com no máximo 2 casas decimais (mais → `400`; F-4) | decisões do usuário |
| R-A3 | **Professor define tentativas e janela** | **Herdada.** `tentativasMax` inteiro 1–100 e janela `abreEm < fechaEm` (instantes ISO 8601 com fuso; comparação no relógio do servidor), todos obrigatórios. Reduzir `tentativasMax` abaixo das tentativas já usadas apenas impede novas tentativas; nada é apagado (F-5) | visão §5 D5 |
| R-A4 | **Publicação e visibilidade** | **Derivação** de D3 R-16/R-17: nasce em rascunho; o estudante vê a avaliação só se ela e o curso estão publicados (senão `404`). Fora da janela, F3-09 devolve só os metadados — as questões aparecem **apenas** entre `abreEm` e `fechaEm` (Proposta D5-c) | visão §5 D5 ("prazo"); D3 R-16/R-17 |
| R-A5 | **Envio dentro da janela e do limite** | **Herdada.** Envio fora da janela, ou com `tentativasMax` já atingido (contando tentativas em qualquer status), → `409` (Proposta D5-g: estado, não validação de corpo) | visão §5 D5 |
| R-A6 | **Composição congelada após a primeira tentativa** | **Proposta D5-d.** Com ≥1 tentativa, alterar `questoes` → `409`; título, janela, `tentativasMax` e `publicado` continuam editáveis | coerência de nota entre tentativas |
| R-A7 | **Tentativa = envio único com todas as respostas** | **Proposta D5-e.** Corpo `{respostas: [{questaoId, resposta}]}`; cada `questaoId` da composição no máximo uma vez (repetido ou alheio → `400`); `resposta` no formato do tipo de D4 (§6 de D4; inválida → `400`). Questão sem resposta vale 0 ponto — inclusive dissertativa, que então **não** aguarda correção; se todas as dissertativas forem omitidas, a tentativa já sai `corrigida` (F-3). Não há rascunho nem tempo limite por tentativa (P-35) | visão §5 D5 ("tentativa de avaliação") |
| R-A8 | **Nota no servidor, 0–10 com pesos** | **Decisão U-3** + regra de ouro. Objetivas: pontos = peso se `acerto` (correção de D4 R-Q7, sem parcial), senão 0. Dissertativas: pontos atribuídos pelo professor (R-A9). `nota = 10 × Σpontos ÷ Σpesos`, arredondada a 2 casas (meio para cima — Proposta D5-f). Calculada só quando todas as dissertativas têm pontos | visão §4 regra de ouro, §5 D5; decisão do usuário |
| R-A9 | **Correção manual de dissertativas (DP-09)** | **Decisão U-1.** Somente professor dono do curso ou admin; `pontos` decimal entre 0 e o peso da questão, com no máximo 2 casas (fora → `400`; F-4). Recorreção é permitida e recalcula a nota (Proposta D5-h; política definitiva com D16 → P-33) | visão §3 P2 ("corrige avaliações"), §5 D5; decisão do usuário |
| R-A10 | **Resultado = maior nota** | **Decisão U-4.** Resultado da avaliação para o estudante = maior `nota` entre suas tentativas `corrigidas`; `null` se nenhuma. É o insumo para D6/D7 (não consumido aqui — P-34) | visão §5 D5; decisão do usuário |
| R-A11 | **Gabarito protegido e retorno mínimo** | **Herdada** (D4 R-Q5) + **Proposta D5-i**: o estudante recebe status e nota da tentativa, nunca o gabarito nem o acerto por questão (evita usar uma tentativa para "descobrir" respostas antes da próxima — P-31) | visão §5 D4; D4 R-Q5 |
| R-A12 | **Somente estudante realiza** | **Derivação** (paralelo com D4 R-Q11). Professor/admin em F3-12/F3-13 → `403` | visão §3 P1 |
| R-A13 | **Notas são instantâneas** | **Proposta D5-j** (paralelo de D4-g): editar gabarito ou excluir questão depois não recalcula notas já calculadas; excluir questão a remove da composição e das respostas (CASCADE). Política definitiva → P-32 | técnica §2.2.3 regra 4 |

---

## 5. Modelo físico (exercício de P-08 para D5)

Convenções da técnica §2.2.1/§2.2.2.

### 5.1 `avaliacao`

| Dado | Tipo/restrição |
|---|---|
| `id` | UUID PK |
| `curso_id` | FK → `curso.id` (CASCADE), INDEX |
| `titulo` | TEXT NOT NULL |
| `tentativas_max` | INTEGER NOT NULL (1–100) |
| `abre_em` / `fecha_em` | TIMESTAMP NOT NULL (`abre_em < fecha_em`) |
| `publicado` | BOOLEAN NOT NULL DEFAULT false |
| `criado_em` / `atualizado_em` | TIMESTAMP |

### 5.2 `avaliacao_questao` (composição)

| Dado | Tipo/restrição |
|---|---|
| `avaliacao_id` | FK → `avaliacao.id` (CASCADE); PK com `questao_id` |
| `questao_id` | FK → `questao.id` (CASCADE) |
| `peso` | NUMERIC(7,2) NOT NULL (> 0) |
| `posicao` | INTEGER NOT NULL; UNIQUE (`avaliacao_id`, `posicao`) |
| `criado_em` / `atualizado_em` | TIMESTAMP — *correção na implementação de T3.5 (2026-10-01): a técnica §2.2.1 (vinculante) exige timestamps em todas as tabelas; a tabela original os omitia* |

### 5.3 `tentativa_avaliacao`

| Dado | Tipo/restrição |
|---|---|
| `id` | UUID PK |
| `avaliacao_id` | FK → `avaliacao.id` (CASCADE), INDEX |
| `usuario_id` | FK → `usuario.id` (CASCADE), INDEX |
| `status` | ENUM(`aguardando_correcao`, `corrigida`) NOT NULL |
| `nota` | NUMERIC(4,2) NULL (só quando `corrigida`) |
| `enviada_em` | TIMESTAMP NOT NULL |
| `criado_em` / `atualizado_em` | TIMESTAMP |

### 5.4 `resposta_avaliacao`

| Dado | Tipo/restrição |
|---|---|
| `id` | UUID PK |
| `tentativa_id` | FK → `tentativa_avaliacao.id` (CASCADE), INDEX |
| `questao_id` | FK → `questao.id` (CASCADE); UNIQUE (`tentativa_id`, `questao_id`) |
| `resposta` | JSONB NOT NULL |
| `acerto` | BOOLEAN NULL (null em dissertativa) |
| `pontos` | NUMERIC(7,2) NULL (null em dissertativa ainda não corrigida) |
| `criado_em` / `atualizado_em` | TIMESTAMP |

Separada de `tentativa` (D4): tentativa de exercício e de avaliação são entidades distintas na visão (D4 "tentativa", D5 "tentativa de avaliação").

---

## 6. Contratos de F3 (parcela D5 — exercício de P-09)

Sob `/api/v1`, JSON, erro padrão, códigos 400/401/403/404/409 (técnica §2.3.1). Todos exigem sessão. Ordem: `401 → 404 → 403 → 409 → 400`; **exceção** em F3-12/F3-13, onde o papel (estudante) é checado antes da existência: `401 → 403 → 404 → 409 → 400` — mesma convenção de D4 F3-06 e D3 F2-14 (F-1).

| # | Método | Rota | Propósito | Papel | Sucesso |
|---|---|---|---|---|---|
| F3-07 | POST | `/cursos/{id}/avaliacoes` | criar | dono/admin | `201 {avaliacaoId}` |
| F3-08 | GET | `/cursos/{id}/avaliacoes` | listar visíveis (ordem `abre_em, id`) | autenticado (R-A4) | `200 [avaliação]` |
| F3-09 | GET | `/avaliacoes/{id}` | ler | autenticado (R-A4/R-A11) | `200 avaliação` |
| F3-10 | PATCH | `/avaliacoes/{id}` | editar `titulo`, `tentativasMax`, `abreEm`, `fechaEm`, `questoes`, `publicado` | dono/admin | `200 avaliação` |
| F3-11 | DELETE | `/avaliacoes/{id}` | excluir (tentativas em CASCADE) | dono/admin | `204` |
| F3-12 | POST | `/avaliacoes/{id}/tentativas` | realizar | estudante | `201 {tentativaId, status, nota}` |
| F3-13 | GET | `/avaliacoes/{id}/resultado` | próprio resultado (tentativas em ordem `enviada_em, id`) | estudante | `200 {tentativas: [{id, enviadaEm, status, nota}], tentativasRestantes, resultado}` |
| F3-14 | GET | `/avaliacoes/{id}/tentativas` | todas as tentativas com respostas (ordem `enviada_em, id`; F-6) | dono/admin | `200 [tentativa]` |
| F3-15 | PUT | `/tentativas-avaliacao/{id}/correcoes/{questaoId}` | pontuar dissertativa | dono/admin | `200 tentativa` |

**Criação (F3-07):** `{titulo, tentativasMax, abreEm, fechaEm, questoes: [{questaoId, peso}]}` (ordem do array = `posicao`); chaves extras → `400`.

**Forma da avaliação (F3-08/F3-09):** `{id, cursoId, titulo, tentativasMax, abreEm, fechaEm, publicado, questoes?}`. Para o estudante, `questoes` só dentro da janela, como `[{questao (forma de leitura de D4, sem gabarito/correta/explicação), peso}]`. Para dono/admin, sempre, com a forma completa de D4.

**F3-15:** corpo `{pontos}`; questão não dissertativa ou fora da tentativa → `400`.

---

## 7. Critérios de aceitação

### 7.1 Documentais

| ID | Critério |
|---|---|
| AC-01 | DP-09 registrada como U-1 (correção manual pelo dono/admin), rastreável à visão §5 D5 |
| AC-02 | U-2–U-4 aplicadas em R-A1, R-A2, R-A8, R-A10 |
| AC-03 | Toda "Proposta D5-x" identificada em §11.3 |
| AC-04 | Nenhuma decisão de D6/D7/D16 tomada; resultado só exposto como insumo |
| AC-05 | Modelo e contratos seguem a técnica; `409` usado só para estado (D5-g) |

### 7.2 Testáveis (para T3.5)

| ID | Teste |
|---|---|
| TA-01 | Criar avaliação válida → `201`, em rascunho; sem sessão `401`; curso inexistente `404`; não-dono/estudante `403` |
| TA-02 | Composição vazia, >100 questões, questão repetida, questão de outro curso, peso ≤ 0 → `400`; `abreEm ≥ fechaEm` ou `tentativasMax` fora de 1–100 → `400` |
| TA-03 | Questão em rascunho de D4 pode compor a avaliação (`201`) |
| TA-04 | Estudante não vê avaliação em rascunho ou de curso em rascunho (`404`); vê metadados publicados; `questoes` só dentro da janela e sem gabarito/correta/explicação |
| TA-05 | Envio antes de `abreEm` ou depois de `fechaEm` → `409`; envio além de `tentativasMax` → `409` |
| TA-06 | Resposta a questão fora da composição, repetida ou em formato inválido → `400`; questão omitida vale 0 |
| TA-07 | Sem dissertativa: nota = 10 × Σpesos acertados ÷ Σpesos, 2 casas; status `corrigida` |
| TA-08 | Com dissertativa: status `aguardando_correcao`, `nota: null`; após pontuar todas (F3-15) → `corrigida` com nota incluindo os pontos |
| TA-09 | F3-15 com pontos < 0 ou > peso → `400`; em questão objetiva → `400`; por não-dono/estudante → `403`; recorreção recalcula a nota |
| TA-10 | F3-13: resultado = maior nota corrigida; `null` enquanto nenhuma corrigida; `tentativasRestantes` correto |
| TA-11 | Professor/admin em F3-12/F3-13 → `403` |
| TA-12 | Com tentativa existente, PATCH de `questoes` → `409`; PATCH de `fechaEm` → `200` |
| TA-13 | Retorno de F3-12/F3-13 nunca contém gabarito nem acerto por questão |
| TA-14 | Excluir avaliação ou curso remove composição, tentativas e respostas (CASCADE) |

---

## 8. Erros

| ID | Situação | HTTP |
|---|---|---|
| EA-01 | Sem sessão | 401 |
| EA-02 | Curso/avaliação/tentativa inexistente ou não visível | 404 |
| EA-03 | Mutação ou correção por não-dono/estudante; realização por não-estudante | 403 |
| EA-04 | Fora da janela; tentativas esgotadas; composição congelada | 409 |
| EA-05 | Corpo inválido | 400 |

---

## 9. Fora de escopo

Progresso a partir do resultado (D6); XP/recompensa (D7/D12); nota mínima e certificado (D16); notificação de resultado (D13); analytics (D15); tempo limite por tentativa, rascunho de respostas, aleatorização, janela individual/prorrogação; interface web; código, migrações e testes (T3.5).

---

## 10. Pendências

| ID | Pendência | Destino |
|---|---|---|
| P-31 | Detalhe por questão (acerto/pontos) e revelação do gabarito ao estudante — por exemplo após `fechaEm` | revisão de D5 |
| P-32 | Efeito de editar gabarito ou excluir questão sobre avaliações com tentativas (provisório: notas instantâneas) | revisão de D5 / D6 / D16 |
| P-33 | Recorreção após o resultado ser usado (progresso, certificado) e imutabilidade | D6 / D16 |
| P-34 | Como o resultado alimenta progresso (D6) e XP/recompensa (D7) | SPECs de D6/D7 |
| P-35 | Tempo limite por tentativa e rascunho de respostas | revisão de D5 |
| P-36 | Revisão dos limites (1–100 questões, peso ≤ 1.000, 1–100 tentativas) | SPEC de NFRs (DP-04) |
| P-37 | Superfície web de D5 (junto da P-30 de D4) | revisão de D4/D5 |
| P-38 | Prorrogação ou janela individual por estudante | revisão de D5 |

DP-09 **resolvida por U-1** para **avaliações**. Permanece aberta a **P-25** (dissertativas de exercício, D4), que esta SPEC não trata (F-7). Não resolvidas: DP-04–DP-07, DP-10–DP-18; P-14–P-30.

---

## 11. Rastreabilidade e revisões

### 11.1 Fontes

visão §3 P1/P2, §4 passo 6 e regra de ouro, §5 D5; `PLAN.md` §5.5, §7 F3, §8 DP-09; `TASKS.md` T3.4/T3.5; `decisoes-pendentes.md` DP-09, §6; técnica §2.2–§2.3; D3 R-13/R-16/R-17; D4 R-Q5/R-Q7/§6.

### 11.2 Revisões formais após aprovação (executadas em 2026-10-01)

| Artefato | Revisão |
|---|---|
| `PLAN.md` §8, §5.5, §7 F3 | DP-09 → "Resolvida (SPEC/2026-10-01-avaliacoes.md)" |
| `decisoes-pendentes.md` | DP-09 → Resolvida; contagem |
| `TASKS.md` | T3.4 concluída; T3.5 sem `[Bloqueada: DP-09]` e sem `[Depende de SPEC D5]`; T3.3 passa a citar P-25 em vez de DP-09 (F-8) |

### 11.3 Propostas (aprovadas pelo usuário — U-5)

| ID | Proposta | Alternativa |
|---|---|---|
| D5-a | Limites: 1–100 questões, peso > 0 e ≤ 1.000, 1–100 tentativas | outros valores (P-36) |
| D5-b | Questão em rascunho de D4 pode compor avaliação | exigir questão publicada |
| D5-c | Questões visíveis só dentro da janela; metadados sempre | questões visíveis desde a publicação |
| D5-d | Composição congelada após a 1ª tentativa | permitir e recalcular notas |
| D5-e | Envio único com todas as respostas; omitida vale 0 | tentativa "em andamento" com respostas salvas |
| D5-f | Nota com 2 casas, arredondamento meio para cima | outra precisão |
| D5-g | `409` para fora da janela / tentativas esgotadas / composição congelada | `400` |
| D5-h | Recorreção permitida e recalcula a nota | correção única |
| D5-i | Estudante vê só status e nota; nem gabarito nem acerto por questão | detalhe por questão (P-31) |
| D5-j | Notas instantâneas; excluir questão a remove por CASCADE sem recalcular | bloquear exclusão de questão usada em avaliação |

---

## 12. Registro de auditoria final e aprovação (2026-10-01)

Auditoria contra visão (§3, §4 passo 6, §5 D5), `PLAN.md` (§5.5, §7 F3, §8), `TASKS.md` (T3.3–T3.5), `decisoes-pendentes.md` (DP-09), técnica (§2.2–§2.3), D3 (R-13/R-16/R-17) e D4 (R-Q5/R-Q7/§6). Nenhum conflito de escopo: nada de D6/D7/D16 foi decidido; regra de ouro preservada (nota só no servidor).

| ID | Achado | Correção |
|---|---|---|
| F-1 | Ordem `401 → 404 → 403` contrariava a convenção de rotas restritas a estudante (D4 F3-06, D3 F2-14), em que o papel é checado antes | exceção explícita para F3-12/F3-13 |
| F-2 | D5-b tratava só `questao.publicado`, não o módulo em rascunho | publicação do módulo também ignorada |
| F-3 | Dissertativa omitida: indefinido se aguardaria correção | vale 0 e não aguarda correção |
| F-4 | Casas decimais de `peso`/`pontos` não limitadas (coluna NUMERIC(7,2)) | máximo 2 casas; mais → `400` |
| F-5 | Redução de `tentativasMax` abaixo do já usado não tratada | só impede novas tentativas |
| F-6 | Ordem de F3-13/F3-14 não declarada | `enviada_em, id` |
| F-7 | DP-09 resolve correção de **avaliação**; dissertativa de **exercício** (P-25 de D4) ficava ambígua | P-25 declarada aberta |
| F-8 | `TASKS.md` T3.3 citava "até DP-09" | revisão aponta para P-25 |

**Veredito:** consistente com as fontes → **Aprovada**. DP-09 resolvida para avaliações (U-1); pendências P-31–P-38 abertas; P-25 segue aberta.
