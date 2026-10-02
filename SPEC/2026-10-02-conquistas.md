# SPEC/2026-10-02-conquistas.md — SPEC do domínio D8: Gamificação — conquistas (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-10-02-conquistas.md` (T5.5 — SPEC do domínio D8; veículo de resolução de **DP-18 na parcela conquistas**) |
| Status | **Aprovada — 2026-10-02**, após auditoria (§12), decisões U-1–U-7 e aprovação do usuário das propostas D8-a–D8-j (U-8). Revisões formais de §11.2 executadas na mesma data — **DP-18 resolvida na parcela D8** |
| Data | 2026-10-02 |
| Domínio / Fase | **D8 — Gamificação: conquistas** · Fase **F5** (`PLAN.md` §7) |
| Tarefa de origem | **T5.5** (`TASKS.md`), `[Bloqueada: DP-18]` para o catálogo — esta SPEC é o veículo de resolução da parcela D8 |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` → `PLAN.md` → `TASKS.md` → `SPEC/2026-09-30-decisoes-pendentes.md`; técnica: `SPEC/2026-09-30-tecnica-fundacoes.md`; baselines: D3, D4, D5, D6 (`2026-10-01-progresso-aprendizagem.md`), D7 (`2026-10-02-xp-niveis.md`) |
| Decisões do usuário (2026-10-02) | **U-1** (origem): **catálogo fixo definido nesta SPEC**, gravado pela migração, sem edição na F5. **U-2** (catálogo — resolve **DP-18 parcela D8**): as **10 conquistas** de §4.1; conquista de constância fica fora (P-53). **U-3** ("curso concluído"): **100% das aulas visíveis** (fórmula de D6 R-D6-3/R-D6-4) no momento da avaliação; mudanças editoriais posteriores não revogam. **U-4** (base do critério): avaliado sobre o **estado atual** verificado a cada ação; o histórico anterior à F5 conta. **U-5** (recompensa): **nenhuma na F5**; moedas por conquista ficam para D12. **U-6** (visibilidade): perfil lista as **desbloqueadas** (nome e data); rota própria mostra ao estudante o **catálogo completo com status e progresso**. **U-7** (aviso): campo aditivo `conquistas` nas respostas das ações e aviso na web; a data do desbloqueio fica registrada para a D13; sem fila na F5. **U-8**: propostas D8-a–D8-j aprovadas sem alteração |
| Não resolve | DP-18 nas parcelas D9 (missões), D10 (desafios), D12 (loja); moedas por conquista (D12); notificação (D13); edição do catálogo (D17); P-42 (avaliação no progresso); DP-04–DP-06, DP-10–DP-17 |
| Restrições desta etapa | Sem código; sem alterar `PLAN.md`, `TASKS.md`, demais SPECs; informação não determinável vira pendência (§10) |

---

## 1. Objetivo

Transformar em critérios verificáveis o domínio **D8** (visão §5 D8): definição, avaliação e desbloqueio permanente de conquistas. Cobre a tarefa T5.6 e **registra a resolução de DP-18 na parcela D8** (catálogo inicial e critérios — decisões U-1–U-3).

Toda escolha não ditada pelas fontes ou pelas decisões U-1–U-7 está marcada como **Proposta D8-x** (§11.3) ou registrada como pendência (§10).

---

## 2. Escopo

### 2.1 Fonte (visão §1, §4, §5 D8, D17)

> **Conquista**: marco atingido de forma permanente (ex.: primeiro curso concluído).
>
> **D8 — Gamificação: conquistas.** Escopo: definição, avaliação e desbloqueio permanente de conquistas. Entidades: conquista, critério, desbloqueio. Regras: desbloqueio é permanente e idempotente (nunca duplica); critérios são avaliados por eventos de progresso/gamificação.
>
> **D17** — "alteração de parâmetros de gamificação não altera conquistas já desbloqueadas".

Fluxo (visão §4): passo 8 "conquistas são desbloqueadas de forma permanente"; passo 11 "a plataforma notifica … nova conquista". Regra de ouro: "toda recompensa (… conquista …) é calculada pelo servidor a partir de ações verificadas; o cliente apenas exibe". `PLAN.md` §5.8: "critérios avaliados por eventos de progresso/gamificação".

### 2.2 Fronteiras

| Item | Pertence a |
|---|---|
| Conclusões, acertos, entregas, notas, progresso | **D3/D4/D5/D6** (lidos como estado verificado, não alterados) |
| XP e nível | **D7** (lidos; D8 não concede XP — U-5) |
| "Conquistas pagam moedas" (visão §1) | **D12** (F8) — P-51 |
| Notificação de nova conquista | **D13** (F9) — consome `desbloqueada_em` (P-52) |
| Edição do catálogo e parâmetros | **D17** — P-50 |
| Exibição no perfil | **D2** (campo `conquistas` do contrato 7, já existente) |

---

## 3. Fluxos

### 3.1 Estudante — desbloquear (passo 8)

1. Executa uma ação verificada: conclui aula (F2-14), responde questão de exercício (F3-06) ou envia avaliação (F3-12); ou o professor termina de corrigir sua tentativa (F3-15).
2. Na **mesma transação** da ação, **depois** da concessão de XP de D7, o servidor avalia todas as conquistas do catálogo ainda não desbloqueadas pelo estudante (R-C3) e grava um desbloqueio para cada critério atendido (R-C4).
3. As respostas de F2-14, F3-06 e F3-12 trazem `conquistas: [{codigo, nome}]` com as recém-desbloqueadas (§6.3); a web mostra "Conquista desbloqueada: {nome}".

### 3.2 Estudante — consultar

1. Consulta o catálogo completo com status e progresso (F5-06).
2. Qualquer usuário autenticado vê, no perfil do estudante (contrato 7), a lista de conquistas desbloqueadas.

**Contrafluxos:** `401` sem sessão; `403` F5-06 por professor/admin.

---

## 4. Regras

### 4.1 Catálogo inicial (U-1/U-2 — resolve DP-18 na parcela D8)

| Ordem | `codigo` | Nome | Descrição | Critério (`tipo`, `meta`) |
|---|---|---|---|---|
| 1 | `primeiros_passos` | Primeiros passos | Concluiu a primeira aula | `aulas_concluidas`, 1 |
| 2 | `maratonista` | Maratonista | Concluiu 25 aulas | `aulas_concluidas`, 25 |
| 3 | `curso_concluido` | Curso concluído | Concluiu 100% de um curso | `cursos_concluidos`, 1 |
| 4 | `colecionador_de_cursos` | Colecionador de cursos | Concluiu 100% de 3 cursos | `cursos_concluidos`, 3 |
| 5 | `primeiro_acerto` | Primeiro acerto | Acertou a primeira questão de exercício | `questoes_acertadas`, 1 |
| 6 | `mente_afiada` | Mente afiada | Acertou 50 questões de exercício diferentes | `questoes_acertadas`, 50 |
| 7 | `avaliado` | Avaliado | Entregou a primeira avaliação | `avaliacoes_entregues`, 1 |
| 8 | `nota_maxima` | Nota máxima | Tirou 10 em uma avaliação | `nota_avaliacao`, 10 |
| 9 | `subindo_de_nivel` | Subindo de nível | Alcançou o nível 5 | `nivel`, 5 |
| 10 | `veterano` | Veterano | Alcançou o nível 10 | `nivel`, 10 |

O catálogo é **fixo**: gravado pela migração, sem rota de criação ou edição (U-1). `codigo` é o identificador estável exposto nos contratos (Proposta D8-a).

### 4.2 Critérios

`progresso` é um inteiro calculado no servidor sobre o **estado atual** do estudante (U-4); o critério é atendido quando `progresso ≥ meta`.

| `tipo` | `progresso` | Natureza / detalhe |
|---|---|---|
| `aulas_concluidas` | `COUNT` de `conclusao_aula` do estudante | **Proposta D8-d:** toda conclusão registrada conta, mesmo de aula depois despublicada (a conclusão é fato verificado — D6 R-D6-4 também não a apaga) |
| `cursos_concluidos` | número de cursos em que o progresso de D6 é 100%: `aulasTotal > 0` e todas as aulas visíveis concluídas (R-D6-3/R-D6-4) | **Decisão U-3.** Curso sem aula visível não conta |
| `questoes_acertadas` | `COUNT(DISTINCT questao_id)` de `tentativa` (exercício, D4) com `acerto = true` | **Proposta D8-d:** só exercício — respostas de avaliação não contam (paralelo com D7 R-X6) |
| `avaliacoes_entregues` | `COUNT(DISTINCT avaliacao_id)` de `tentativa_avaliacao` do estudante, qualquer status | Paralelo com D7 R-X4 |
| `nota_avaliacao` | parte inteira da maior `nota` entre as tentativas `corrigida`s do estudante (0 se nenhuma) | Atendido com nota 10,00 |
| `nivel` | `saldo_xp.nivel` (D7 R-X17; 1 sem saldo) | Lido **após** a concessão de XP da mesma ação |

### 4.3 Desbloqueio

| ID | Regra | Natureza / detalhe | Rastreabilidade |
|---|---|---|---|
| R-C1 | **Só no servidor, só por ação verificada** | **Herdada.** Desbloqueio é avaliado apenas dentro de F2-14, F3-06, F3-12 e F3-15. Nenhuma rota aceita conquista, critério ou progresso do cliente; não existe rota de desbloqueio manual | visão §4 regra de ouro, §5 D8 |
| R-C2 | **Só estudante** | **Derivação.** As ações de origem já são restritas a estudante; em F3-15 é avaliado o **dono da tentativa**, nunca o professor | visão §3 P1; D7 R-X9 |
| R-C3 | **Avaliação do catálogo inteiro** | **Proposta D8-b.** A cada ação, todas as conquistas ainda não desbloqueadas pelo estudante são avaliadas (não só as ligadas à ação). Com o catálogo pequeno, evita mapear ação → critério e garante que o histórico anterior desbloqueie na próxima ação (U-4) | visão §5 D8 ("avaliados por eventos") |
| R-C4 | **Idempotente pelo banco** | **Herdada + Proposta D8-c.** UNIQUE (`usuario_id`, `conquista_id`) em `desbloqueio_conquista`; inserção que conflita é ignorada. Ações simultâneas → um único desbloqueio; só a que gravou o devolve em `conquistas` | visão §5 D8 ("nunca duplica") |
| R-C5 | **Atomicidade** | **Proposta D8-c.** Desbloqueios são gravados na mesma transação da ação e do XP (D7 R-X8), depois do XP; falha desfaz tudo | visão §4 regra de ouro |
| R-C6 | **Permanência** | **Herdada.** Desbloqueio nunca é removido nem revogado — nem se o critério deixar de valer (exclusão de conteúdo, novas aulas no curso, recorreção que baixa nota, mudança de parâmetros de D7/D17). Só some com a exclusão da conta (CASCADE) | visão §1, §5 D8, §5 D17 |
| R-C7 | **Sem recompensa na F5** | **Decisão U-5.** Desbloqueio não concede XP, moedas nem itens. O vínculo conquista → moedas é definido na SPEC de D12 (P-51) | visão §1 ("moeda ganha por conquistas") — adiado |
| R-C8 | **Desbloqueio só na próxima ação** | **Proposta D8-e.** Consultas (F5-06, perfil) não desbloqueiam. Se o estado já atende um critério (ex.: histórico anterior à F5), a conquista aparece como não desbloqueada com `progresso` limitado à `meta` até a próxima ação verificada | U-4; GET sem efeito colateral |

### 4.4 Exibição

| ID | Regra | Natureza / detalhe | Rastreabilidade |
|---|---|---|---|
| R-C9 | **Perfil lista as desbloqueadas** | **Decisão U-6.** O campo `conquistas` do contrato 7 passa a `[{codigo, nome, desbloqueadaEm}]` para estudante, ordenado por `desbloqueadaEm` e `codigo`; vazio para professor/admin. Visível a qualquer usuário autenticado (mesma visibilidade do perfil) | visão §5 D2 ("conquistas exibidas"); `TASKS.md` T1.6 |
| R-C10 | **Catálogo com progresso só para o próprio estudante** | **Decisão U-6.** F5-06 devolve todas as conquistas, na `ordem`, com `progresso` (limitado à `meta`), `desbloqueada` e `desbloqueadaEm`. Progresso das não desbloqueadas não aparece a terceiros (Proposta D8-f) | visão §3 P1 |

---

## 5. Modelo físico (exercício de P-08 para D8)

Convenções da técnica §2.2.1/§2.2.2.

### 5.1 `conquista` (conquista + critério)

| Dado | Tipo/restrição |
|---|---|
| `id` | UUID PK |
| `codigo` | TEXT NOT NULL UNIQUE |
| `nome` / `descricao` | TEXT NOT NULL |
| `tipo_criterio` | ENUM(`aulas_concluidas`, `cursos_concluidos`, `questoes_acertadas`, `avaliacoes_entregues`, `nota_avaliacao`, `nivel`) NOT NULL |
| `meta` | INTEGER NOT NULL (≥ 1) |
| `ordem` | INTEGER NOT NULL UNIQUE |
| `criado_em` / `atualizado_em` | TIMESTAMP |

As 10 linhas de §4.1 são inseridas pela migração, com ids fixos.

### 5.2 `desbloqueio_conquista` (desbloqueio)

| Dado | Tipo/restrição |
|---|---|
| `id` | UUID PK |
| `usuario_id` | FK → `usuario.id` (CASCADE) |
| `conquista_id` | FK → `conquista.id` (RESTRICT — o catálogo não é apagado); UNIQUE (`usuario_id`, `conquista_id`) |
| `desbloqueada_em` | TIMESTAMP NOT NULL — insumo da notificação de D13 (P-52) |
| `criado_em` / `atualizado_em` | TIMESTAMP |

---

## 6. Contratos (parcela D8 — exercício de P-09)

Sob `/api/v1`, JSON, erro padrão (técnica §2.3.1). Todos exigem sessão.

### 6.1 Rota nova

| # | Método | Rota | Propósito | Papel | Sucesso |
|---|---|---|---|---|---|
| F5-06 | GET | `/conquistas` | catálogo com status e progresso do próprio estudante | estudante | `200 [{codigo, nome, descricao, meta, progresso, desbloqueada, desbloqueadaEm}]` na `ordem` |

`desbloqueadaEm` é ISO 8601 ou `null`. Ordem de checagem: `401 → 403`.

### 6.2 Perfil (contrato 7, mudança de tipo do campo existente)

`conquistas`: `[{codigo, nome, desbloqueadaEm}]` (R-C9). O campo já existia como lista vazia; o novo conteúdo é **aditivo** (técnica §2.3.1).

### 6.3 Campo aditivo nas ações

As respostas de sucesso de **F2-14**, **F3-06** e **F3-12** ganham `conquistas: [{codigo, nome}]` — as conquistas desbloqueadas **por aquela ação** (`[]` se nenhuma), na `ordem` do catálogo. F3-15 (professor) não ganha o campo; o desbloqueio do estudante aparece no perfil e em F5-06.

### 6.4 Web

| Tela | Mudança |
|---|---|
| Perfil (qualquer) | seção "Conquistas" lista as desbloqueadas com data (substitui o texto genérico atual) |
| Meu perfil (estudante) | catálogo completo (F5-06): desbloqueadas destacadas; não desbloqueadas com "progresso / meta" (Proposta D8-i) |
| Aula, exercício, avaliação | aviso "Conquista desbloqueada: {nome}" para cada item de `conquistas` (Proposta D8-i) |

---

## 7. Critérios de aceitação

### 7.1 Documentais

| ID | Critério |
|---|---|
| AC-01 | DP-18 (parcela D8) registrada como U-1–U-3, rastreável à visão §1 e §5 D8 |
| AC-02 | Catálogo e critérios aparecem **só** nesta SPEC (não em `PLAN.md`/`TASKS.md`, validação de T5.5) |
| AC-03 | Toda "Proposta D8-x" identificada em §11.3 |
| AC-04 | Nenhuma decisão de D9/D10/D12/D13/D17 tomada; moedas e notificação registradas como pendência |

### 7.2 Testáveis (para T5.6)

| ID | Teste |
|---|---|
| TC-01 | Migração cria as 10 conquistas de §4.1 com `codigo`, `tipo_criterio`, `meta` e `ordem` corretos |
| TC-02 | Primeira conclusão de aula → resposta com `conquistas: [{codigo: 'primeiros_passos', …}]`; segunda conclusão (outra aula) → `[]` |
| TC-03 | Concluir todas as aulas visíveis de um curso → `curso_concluido`; curso sem aulas visíveis não conta; aula em rascunho não impede |
| TC-04 | Primeiro acerto de exercício → `primeiro_acerto`; acerto dentro de avaliação não conta para `questoes_acertadas`; acertar a mesma questão de novo não aumenta o progresso |
| TC-05 | Primeira entrega de avaliação → `avaliado`; nota 10 → `nota_maxima` no envio ou, com dissertativa, ao concluir a correção (F3-15) — creditada ao estudante, não ao professor |
| TC-06 | Ação cujo XP leva ao nível 5 desbloqueia `subindo_de_nivel` na mesma resposta |
| TC-07 | Ações simultâneas que atendem o mesmo critério → um único desbloqueio (UNIQUE) |
| TC-08 | Histórico anterior: estudante com 25 conclusões já gravadas desbloqueia `maratonista` (e `primeiros_passos`) na próxima ação; F5-06 antes da ação mostra `progresso = meta` e `desbloqueada = false` |
| TC-09 | Permanência: após desbloquear `curso_concluido`, adicionar aula ao curso ou excluir o curso não remove o desbloqueio |
| TC-10 | F5-06 por estudante → 10 itens na ordem, progresso limitado à meta; por professor/admin → `403`; sem sessão → `401` |
| TC-11 | Perfil de estudante lista desbloqueadas (`codigo`, `nome`, `desbloqueadaEm`) a outro usuário, sem progresso; perfil de professor → `[]` |
| TC-12 | Desbloqueio não altera `saldo_xp` nem cria `evento_xp` (U-5) |
| TC-13 | Falha simulada ao gravar o desbloqueio desfaz a ação e o XP (R-C5) |

---

## 8. Erros

| ID | Situação | HTTP |
|---|---|---|
| EC-01 | Sem sessão | 401 |
| EC-02 | F5-06 por professor/admin | 403 |

Ações F2-14/F3-06/F3-12/F3-15 mantêm seus erros; conquistas não introduzem erro novo nelas.

---

## 9. Fora de escopo

Moedas, XP bônus ou itens por conquista (D12); notificação (D13); edição do catálogo, conquistas por curso ou do professor (D17/P-50, P-54); conquistas de constância/frequência (P-53); conquistas secretas (P-54); raridade, categorias ou níveis de conquista; código, migrações e testes (T5.6).

---

## 10. Pendências

| ID | Pendência | Destino |
|---|---|---|
| **P-50** | Edição do catálogo pelo administrador (criar, desativar, mudar meta) e efeito sobre desbloqueios existentes (R-C6 já garante que não são revogados) | SPEC de D17 |
| **P-51** | Recompensa por conquista ("conquistas pagam moedas") | SPEC de D12 |
| **P-52** | Notificação de nova conquista a partir de `desbloqueada_em` | SPEC de D13 |
| **P-53** | Conquistas de constância (dias seguidos de estudo; definição de "dia de estudo") | revisão de D8 |
| **P-54** | Conquistas secretas, por curso ou criadas pelo professor | revisão de D8 / D17 |
| **P-55** | "Curso concluído" exigindo avaliações ou nota mínima (vincula P-42 e D16) | revisão de D8 / D16 |

DP-18 **resolvida na parcela D8** por U-1–U-3. Seguem abertas as parcelas D9, D10 e D12 de DP-18.

---

## 11. Rastreabilidade e revisões

### 11.1 Fontes

visão §1 (Conquista, Moedas), §3 P1, §4 passos 8 e 11 e regra de ouro, §5 D2/D8/D17; `PLAN.md` §5.8, §7 F5, §8 DP-18; `TASKS.md` T5.5–T5.7; `decisoes-pendentes.md` DP-18, §6; técnica §2.2–§2.3; D4 R-Q6; D5 R-A10; D6 R-D6-3/R-D6-4; D7 R-X6/R-X8/R-X9/R-X17.

### 11.2 Revisões formais após aprovação (executadas em 2026-10-02)

| Artefato | Revisão |
|---|---|
| `PLAN.md` §5.8, §7 F5, §8 DP-18 | catálogo de conquistas → resolvido (SPEC/2026-10-02-conquistas.md); DP-18 segue aberta para D9/D10/D12. Sem copiar o catálogo (AC-02) |
| `decisoes-pendentes.md` | DP-18 → **parcialmente resolvida** (parcela D8); T5.5 deixa de ser bloqueada |
| `TASKS.md` | T5.5 concluída; T5.6 sem `[Depende de SPEC D8]` |

### 11.3 Propostas (aprovadas pelo usuário — U-8)

| ID | Proposta | Alternativa |
|---|---|---|
| D8-a | `codigo` textual estável como identificador público | expor o UUID |
| D8-b | Avaliar o catálogo inteiro a cada ação | mapear ação → critérios afetados |
| D8-c | UNIQUE por usuário e conquista; desbloqueio na transação da ação, após o XP | avaliação assíncrona |
| D8-d | Contam todas as conclusões registradas; acertos só de exercício e distintos por questão | só aulas visíveis; incluir acertos de avaliação |
| D8-e | Consultas não desbloqueiam; progresso limitado à meta até a próxima ação | desbloquear também na leitura |
| D8-f | Progresso visível só ao próprio estudante | progresso público no perfil |
| D8-g | Perfil ordena desbloqueadas por data e `codigo` | ordem do catálogo |
| D8-h | Campo aditivo `conquistas` só em F2-14/F3-06/F3-12 | também em F3-15 |
| D8-i | Catálogo com progresso no perfil próprio e aviso por conquista nas telas de ação | página separada de conquistas |
| D8-j | `conquista_id` com RESTRICT (catálogo nunca apagado com desbloqueios) | CASCADE |

---

## 12. Registro de auditoria e aprovação (2026-10-02)

Auditoria preliminar contra visão (§1, §3, §4, §5 D2/D8/D17), `PLAN.md` (§5.8, §7 F5, §8), `TASKS.md` (T5.5–T5.7), `decisoes-pendentes.md` (DP-18) e SPECs D4–D7. Regras da visão cobertas: definição (§4.1), avaliação por eventos (R-C1, R-C3), desbloqueio permanente (R-C6) e idempotente (R-C4), parâmetros não alteram desbloqueios (R-C6), exibição no perfil (R-C9). Regra de ouro preservada. Nenhuma decisão de D9/D10/D12/D13/D17 tomada.

**Veredito:** consistente com as fontes → **Aprovada** (U-8). DP-18 resolvida na parcela D8; parcelas D9/D10/D12 seguem abertas; pendências P-50–P-55 abertas.
