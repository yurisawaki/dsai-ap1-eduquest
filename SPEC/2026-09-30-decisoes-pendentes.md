# SPEC/2026-09-30-decisoes-pendentes.md — Inventário das decisões pendentes do EduQuest

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-09-30-decisoes-pendentes.md` (apoio ao processo SDD) |
| Tarefa de origem | T0.1 — Inventário das decisões pendentes do EduQuest (`TASKS.md`, fase F0) |
| Fonte de autoridade | SPEC → PLAN → TASKS → este documento |
| Status | Inventário registrado; nenhuma decisão resolvida |
| Data | 2026-09-30 |
| Fora de escopo deste artefato | Resolver DP-01–DP-19; escolher stack, arquitetura, endpoints, schemas, fórmulas ou tipos de questão; alterar SPEC/PLAN/TASKS; escrever código |

---

## 1. Objetivo do documento

Este documento é o **inventário das decisões pendentes** identificadas pelo `PLAN.md` (Seção 8) e operacionalizadas pelo `TASKS.md` (estados de bloqueio e pré-requisitos globais). Ele consolida, em um único lugar:

- quais decisões ainda estão pendentes (DP-01–DP-19);
- o que cada decisão significa;
- quais partes do projeto dependem dela;
- em que fase cada decisão precisa ser resolvida;
- quais decisões bloqueiam a implementação;
- quais decisões são permanentemente fora do escopo (desta visão);
- quais decisões dependem da criação de uma SPEC específica.

**Este documento NÃO resolve nenhuma decisão.** Ele apenas registra, classifica e rastreia as pendências já declaradas. Toda informação aqui presente é citação ou reorganização de `SPEC/2026-09-30-visao-geral.md`, `PLAN.md` e `TASKS.md`. Onde esses artefatos não definem algo, a informação é registrada explicitamente como **não especificada** — nunca preenchida por suposição.

---

## 2. Status geral

Legenda de status: **Pendente** = decisão ainda não tomada, com artefato futuro indicado; **Fora de escopo (desta visão)** = decisão que o produto não terá nesta visão (não é pendência de implementação, conforme `PLAN.md` §8 DP-12 e §11).

| DP | Nome curto | Status atual | Fase relacionada | Bloqueia implementação? | Dependências |
|---|---|---|---|---|---|
| DP-01 | Stack tecnológica | Pendente | F0 (antes de F1 detalhada) | **Sim** — global, todas as tarefas de implementação | Sem dependência declarada entre DP-01/02/03 |
| DP-02 | Modelo de dados físico | Pendente | F0 (antes de F1 detalhada) | **Sim** — global | Sem dependência declarada entre DP-01/02/03 |
| DP-03 | Contratos de API | Pendente | F0 (antes de F1 detalhada) | **Sim** — global | Sem dependência declarada entre DP-01/02/03 |
| DP-04 | Requisitos não funcionais quantificados | Pendente | Não atribuída no `PLAN.md` (artefato próprio) | Não bloqueia tarefas funcionais (não citada como bloqueio no `TASKS.md`) | DP-15 depende dela |
| DP-05 | Design de UI/UX | Pendente | Não atribuída no `PLAN.md` (artefato próprio) | Não (declarado no `TASKS.md` preâmbulo) | Nenhuma declarada |
| DP-06 | Acessibilidade e internacionalização | Pendente | Não atribuída no `PLAN.md` (artefato próprio) | Não (declarado no `TASKS.md` preâmbulo) | Nenhuma declarada |
| DP-07 | Fórmula de XP e fórmula/tabela de níveis | Pendente | F5 (antes do detalhe de F5); efeitos em F13 | **Sim** — T5.1, T5.2, T5.3, T5.4, T13.4 | Nenhuma outra DP declarada |
| DP-08 | Conjunto definitivo de tipos de questão | Pendente | F3 (antes do detalhe de F3) | **Sim** — T3.1, T3.2, T3.3, T3.5 | Nenhuma outra DP declarada |
| DP-09 | Correção manual de dissertativas | Pendente | F3 (antes do detalhe de F3) | **Parcial** — só dissertativas: T3.4 (item), T3.5 (parcial) | Nenhuma outra DP declarada |
| DP-10 | Regras detalhadas de ranking (empate, privacidade fina) | Pendente | F7 (antes do detalhe de F7) | **Sim** — T7.1, T7.2, T7.3 | Nenhuma outra DP declarada |
| DP-11 | Integrações externas (LTI/SCORM, OAuth social, e-mail, CDN, vídeo, analytics de terceiros) | Pendente | F9 (canal de e-mail de D13) | **Parcial** — só e-mail: T9.4 bloqueada; T9.1 parcial (in-app `[Livre]`) | Nenhuma outra DP declarada |
| DP-12 | Pagamentos, moedas reais, marketplace | **Fora de escopo (desta visão)** | Nenhuma (não gera tarefas) | Não — não é pendência de implementação | Não aplicável |
| DP-13 | Moderação por IA, recomendação, LLM | **Fora de escopo (desta visão)** | Nenhuma (não gera tarefas) | Não | Não aplicável |
| DP-14 | Multi-tenancy | **Fora de escopo (desta visão)** | Nenhuma (não gera tarefas) | Não | Não aplicável |
| DP-15 | Testes de carga, backup, disaster recovery | Pendente | Não atribuída no `PLAN.md` | Não gera tarefas no `TASKS.md` atual | **Depende de DP-04** (tratamento do `PLAN.md` §8: "SPEC de NFRs (DP-04)") |
| DP-16 | Aspectos legais (termos de uso, LGPD/GDPR, consentimentos) | Pendente (consideração futura) | Não atribuída no `PLAN.md` | Não gera tarefas | Nenhuma declarada |
| DP-17 | Persona P4 e relatórios de analytics | Pendente | F11 (antes/durante F11) | **Parcial** — só P4: T11.5 bloqueada; T11.1 parcial (`[Livre]` para professor/admin) | Nenhuma outra DP declarada |
| DP-18 | Catálogos e tabelas de gamificação (conquistas, missões, itens/preços, desafios) | Pendente | F5, F6, F8 | **Sim** — T5.5, T6.1, T6.3, T8.1 | Nenhuma outra DP declarada |
| DP-19 | Formato de conteúdo de aula, limites de upload, embeds | Pendente | F2 (antes do detalhe de F2) | **Parcial** — só formato/limites: T2.3 bloqueada; T2.1 (registro) e execução parcial `[Livre]` | Nenhuma outra DP declarada |

**Contagem:** 19 decisões (DP-01–DP-19); 16 com status **Pendente**; 3 **Fora de escopo (desta visão)** (DP-12, DP-13, DP-14); **0 resolvidas**.

---

## 3. Inventário detalhado

Para cada decisão: ID; nome; descrição objetiva; origem no `PLAN.md`; domínio(s) afetado(s); fase(s) afetada(s); tarefas `TASKS.md` afetadas; dependências; se é bloqueadora; artefato futuro que deverá resolvê-la. **Nenhuma solução é escolhida aqui.**

### DP-01 — Stack tecnológica

- **Descrição objetiva:** definição de linguagem, framework, banco de dados e infraestrutura. O `PLAN.md` não a resolve, apesar de a SPEC de visão geral (§7.1) admitir delegar a escolha ao PLAN: a restrição da etapa de criação do PLAN prevaleceu e a decisão ficou registrada como pendência (`PLAN.md` §4 princípio 4, §8 DP-01).
- **Origem no PLAN.md:** §8 (linha DP-01); §4 princípio 4; §11 item 1.
- **Domínio(s) afetado(s):** transversal — nenhum domínio funcional específico; afeta todos D1–D17 indiretamente (condição de execução).
- **Fase(s) afetada(s):** F0 (resolução) — `PLAN.md` §8: "antes de F1 detalhada"; efeito sobre F1–F13.
- **Tarefas TASKS.md afetadas:** T0.2 (roteirizar a SPEC técnica, sem escolher); e o pré-requisito global "DP-01–DP-03" presente em todas as tarefas cujo artefato é funcionalidade (T1.2–T13.5, conforme preâmbulo do `TASKS.md`).
- **Dependências:** nenhuma dependência declarada para com outras DPs.
- **Bloqueadora:** **Sim** (global de implementação).
- **Artefato futuro:** etapa/fase própria ou **SPEC técnica** (tratamento do `PLAN.md` §8), roteirizada em T0.2.

### DP-02 — Modelo de dados físico

- **Descrição objetiva:** esquema físico, migrations, índices e IDs. A visão geral define apenas entidades conceituais por domínio (SPEC §5); o modelo físico está explicitamente fora de escopo (SPEC §7.2).
- **Origem no PLAN.md:** §8 (linha DP-02); §11 item 2.
- **Domínio(s) afetado(s):** transversal (todos D1–D17 como condição de execução).
- **Fase(s) afetada(s):** F0 (resolução antes de F1 detalhada); efeito sobre F1–F13.
- **Tarefas TASKS.md afetadas:** T0.2; pré-requisito global DP-01–DP-03 (T1.2–T13.5).
- **Dependências:** nenhuma dependência declarada para com outras DPs.
- **Bloqueadora:** **Sim** (global de implementação).
- **Artefato futuro:** **SPEC técnica própria** (`PLAN.md` §8).

### DP-03 — Contratos de API

- **Descrição objetiva:** endpoints, payloads, autenticação técnica e versionamento. Explicitamente fora de escopo da visão geral (SPEC §7.3).
- **Origem no PLAN.md:** §8 (linha DP-03); §11 item 3.
- **Domínio(s) afetado(s):** transversal (todos D1–D17 como condição de execução).
- **Fase(s) afetada(s):** F0 (resolução antes de F1 detalhada); efeito sobre F1–F13.
- **Tarefas TASKS.md afetadas:** T0.2; pré-requisito global DP-01–DP-03 (T1.2–T13.5).
- **Dependências:** nenhuma dependência declarada para com outras DPs.
- **Bloqueadora:** **Sim** (global de implementação).
- **Artefato futuro:** **SPEC técnica própria** (`PLAN.md` §8).

### DP-04 — Requisitos não funcionais quantificados

- **Descrição objetiva:** performance, disponibilidade, escalabilidade e limites de carga, com valores quantificados. Explicitamente fora de escopo da visão geral (SPEC §7.4), com ressalva de que devem vir em SPEC própria de NFRs.
- **Origem no PLAN.md:** §8 (linha DP-04); §11 item 4.
- **Domínio(s) afetado(s):** nenhum domínio funcional específico (transversal de qualidade).
- **Fase(s) afetada(s):** não atribuída no `PLAN.md`.
- **Tarefas TASKS.md afetadas:** nenhuma (o preâmbulo do `TASKS.md` não a lista como bloqueio de tarefas funcionais).
- **Dependências:** nenhuma; **DP-15 depende dela**.
- **Bloqueadora:** **Não** (para as tarefas funcionais atuais).
- **Artefato futuro:** **SPEC de NFRs própria** (`PLAN.md` §8).

### DP-05 — Design de UI/UX

- **Descrição objetiva:** wireframes, paleta, componentes, guia visual e animações. Fora de escopo da visão geral (SPEC §7.5).
- **Origem no PLAN.md:** §8 (linha DP-05); §11 item 5.
- **Domínio(s) afetado(s):** nenhum domínio funcional específico (afeta a apresentação de todos).
- **Fase(s) afetada(s):** não atribuída no `PLAN.md`.
- **Tarefas TASKS.md afetadas:** nenhuma (preâmbulo do `TASKS.md`: "não bloqueiam tarefas funcionais abaixo").
- **Dependências:** nenhuma declarada.
- **Bloqueadora:** **Não**.
- **Artefato futuro:** **SPEC de UI/UX própria** (`PLAN.md` §8).

### DP-06 — Acessibilidade e internacionalização

- **Descrição objetiva:** níveis de conformidade de acessibilidade, idiomas e fuso horário. Fora de escopo da visão geral (SPEC §7.6).
- **Origem no PLAN.md:** §8 (linha DP-06); §11 item 6.
- **Domínio(s) afetado(s):** nenhum domínio funcional específico (transversal).
- **Fase(s) afetada(s):** não atribuída no `PLAN.md`.
- **Tarefas TASKS.md afetadas:** nenhuma (preâmbulo do `TASKS.md`: não bloqueiam tarefas funcionais).
- **Dependências:** nenhuma declarada.
- **Bloqueadora:** **Não**.
- **Artefato futuro:** **SPEC própria** (`PLAN.md` §8).

### DP-07 — Fórmula de XP e fórmula/tabela de níveis

- **Descrição objetiva:** fórmula exata de concessão de XP e fórmula/tabela de níveis. A visão geral define apenas as regras de alto nível (XP só por ações verificadas; nível monotônico; XP total ≠ XP do período — SPEC §5 D7, §1) e declara fórmulas fora do escopo (SPEC §7.7).
- **Origem no PLAN.md:** §8 (linha DP-07); §5.7 pendências; §11 item 6.
- **Domínio(s) afetado(s):** **D7** (XP e níveis); **D17** (configuração global de parâmetros de gamificação).
- **Fase(s) afetada(s):** **F5** (antes do detalhe de F5); **F13** (T13.4 — configuração global).
- **Tarefas TASKS.md afetadas:** T5.1 (SPEC D7 — veículo de resolução), T5.2, T5.3, T5.4 (bloqueadas); T13.4 (parâmetros de XP/níveis); menções em T0.3 e T13.6 (checklist).
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Sim** (para o detalhe de F5 e para T13.4).
- **Artefato futuro:** **SPEC de D7** (`PLAN.md` §8: "antes do detalhe de F5").

### DP-08 — Conjunto definitivo de tipos de questão

- **Descrição objetiva:** quais tipos de questão a plataforma suportará. A visão geral cita exemplos (múltipla escolha, verdadeiro/falso, numérica, dissertativa) mas declara o conjunto "a confirmar em SPEC própria" (SPEC §5 D4). Este documento também não define tipos.
- **Origem no PLAN.md:** §8 (linha DP-08); §5.4 pendências; §11 item 6.
- **Domínio(s) afetado(s):** **D4** (exercícios e questões); **D5** (avaliações — composição e nota dependem dos tipos).
- **Fase(s) afetada(s):** **F3** (antes do detalhe de F3).
- **Tarefas TASKS.md afetadas:** T3.1 (SPEC D4 — veículo de resolução), T3.2, T3.3, T3.5 (bloqueadas); menções em T0.3 e T13.6.
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Sim** (para F3).
- **Artefato futuro:** **SPEC de D4** (`PLAN.md` §8).

### DP-09 — Correção manual de dissertativas

- **Descrição objetiva:** se e como ocorre a correção manual de questões dissertativas. A visão geral declara "a confirmar em SPEC própria" (SPEC §5 D5) e remete a correção de dissertativas a SPEC própria (SPEC §6).
- **Origem no PLAN.md:** §8 (linha DP-09); §5.5 pendências; §11 item 7.
- **Domínio(s) afetado(s):** **D5** (avaliações).
- **Fase(s) afetada(s):** **F3** (antes do detalhe de F3).
- **Tarefas TASKS.md afetadas:** T3.4 (item de correção manual — bloqueada), T3.5 (parcialmente — só dissertativas); menção em T0.3.
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Parcial** — apenas o componente dissertativo; demais partes de D5 seguem conforme SPEC D5.
- **Artefato futuro:** **SPEC de D5** (`PLAN.md` §8).

### DP-10 — Regras detalhadas de ranking

- **Descrição objetiva:** regra de empate e política fina de privacidade/pseudonimização dos rankings. A visão geral define apenas as regras de alto nível (métrica declarada, empate por regra fixa, privacidade conforme configuração, cálculo servidor-side — SPEC §5 D11) e declara as regras detalhadas fora do escopo (SPEC §7.7).
- **Origem no PLAN.md:** §8 (linha DP-10); §5.11 pendências; §11 item 6.
- **Domínio(s) afetado(s):** **D11** (rankings).
- **Fase(s) afetada(s):** **F7** (antes do detalhe de F7).
- **Tarefas TASKS.md afetadas:** T7.1 (SPEC D11 — veículo de resolução), T7.2, T7.3 (bloqueadas); menções em T0.3 e T13.6.
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Sim** (para F7).
- **Artefato futuro:** **SPEC de D11** (`PLAN.md` §8).

### DP-11 — Integrações externas

- **Descrição objetiva:** LTI/SCORM, OAuth social, e-mail transacional, CDN, vídeos e analytics de terceiros. Fora de escopo da visão geral (SPEC §7.9). Efeito funcional imediato identificado: canal de e-mail opcional de D13.
- **Origem no PLAN.md:** §8 (linha DP-11); §5.13 pendências; §11 item 8.
- **Domínio(s) afetado(s):** **D13** (notificações — canal de e-mail); demais integrações sem domínio funcional atribuído no `PLAN.md`.
- **Fase(s) afetada(s):** **F9** (canal de e-mail).
- **Tarefas TASKS.md afetadas:** T9.1 (parcial — in-app `[Livre]`, e-mail `[Bloqueada: DP-11]`), T9.4 (bloqueada — registrar dependência do canal de e-mail).
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Parcial** — apenas o canal de e-mail em F9; a entrega in-app de D13 não depende dela (preâmbulo e T9.1 do `TASKS.md`).
- **Artefato futuro:** **SPEC de integrações** (`PLAN.md` §8); e-mail opcional vinculado a D13.

### DP-12 — Pagamentos, moedas reais e marketplace

- **Descrição objetiva:** compra de moedas com dinheiro real, assinaturas, moeda fiscal, checkout, gateway de pagamento e marketplace de conteúdo. A visão geral declara o sistema **não** um sistema de pagamento (SPEC §6) e o item fora de escopo (SPEC §7.10); o `PLAN.md` classifica como "**Fora de escopo do produto nesta visão** (não pendência de implementação)".
- **Origem no PLAN.md:** §8 (linha DP-12); §11 item 8 (e §3 — fora do escopo).
- **Domínio(s) afetado(s):** nenhum (a economia de D12 é fechada por regra da visão: SPEC §6, §5 D12).
- **Fase(s) afetada(s):** nenhuma (não gera tarefas).
- **Tarefas TASKS.md afetadas:** nenhuma (preâmbulo: "Fora do escopo permanente (não geram tarefas)"); menção apenas em checklist (T13.6).
- **Dependências:** não aplicável.
- **Bloqueadora:** **Não**.
- **Artefato futuro:** nenhum dentro deste SDD. Qualquer inclusão futura exigiria nova SPEC de visão/escopo (registro aqui como pendência de escopo, não como tarefa).

### DP-13 — Moderação por IA, recomendação inteligente e uso de LLM

- **Descrição objetiva:** funcionalidades de IA, recomendação e LLM. Fora de escopo da visão geral (SPEC §7.11); classificado fora de escopo permanente no `TASKS.md` preâmbulo.
- **Origem no PLAN.md:** §8 (linha DP-13); §11 item 8.
- **Domínio(s) afetado(s):** nenhum atribuído (D15 menciona apenas analytics derivado dos próprios eventos — SPEC §6).
- **Fase(s) afetada(s):** nenhuma (não gera tarefas).
- **Tarefas TASKS.md afetadas:** nenhuma.
- **Dependências:** não aplicável.
- **Bloqueadora:** **Não**.
- **Artefato futuro:** nenhum dentro deste SDD (mesmo tratamento de DP-12).

### DP-14 — Multi-tenancy / múltiplas instituições

- **Descrição objetiva:** suporte a múltiplas instituições/tenants. Fora de escopo da visão geral (SPEC §7.12); classificado fora de escopo permanente no `TASKS.md` preâmbulo.
- **Origem no PLAN.md:** §8 (linha DP-14); §11 item 8.
- **Domínio(s) afetado(s):** nenhum.
- **Fase(s) afetada(s):** nenhuma (não gera tarefas).
- **Tarefas TASKS.md afetadas:** nenhuma.
- **Dependências:** não aplicável.
- **Bloqueadora:** **Não**.
- **Artefato futuro:** nenhum dentro deste SDD (mesmo tratamento de DP-12).

### DP-15 — Testes de carga, backup e disaster recovery

- **Descrição objetiva:** testes de carga, política de backup e plano de disaster recovery. Fora de escopo da visão geral (SPEC §7.13).
- **Origem no PLAN.md:** §8 (linha DP-15); §11 item 8.
- **Domínio(s) afetado(s):** nenhum domínio funcional específico.
- **Fase(s) afetada(s):** não atribuída no `PLAN.md`.
- **Tarefas TASKS.md afetadas:** nenhuma (preâmbulo: "DP-15 e DP-04 dependem de SPEC de NFRs").
- **Dependências:** **depende de DP-04** (tratamento do `PLAN.md` §8: "SPEC de NFRs (DP-04)").
- **Bloqueadora:** **Não** (para as tarefas funcionais atuais).
- **Artefato futuro:** **SPEC de NFRs** (via DP-04).

### DP-16 — Aspectos legais

- **Descrição objetiva:** termos de uso, LGPD/GDPR e consentimentos. A visão geral os menciona apenas como consideração futura (SPEC §7.14).
- **Origem no PLAN.md:** §8 (linha DP-16); §11 item 8.
- **Domínio(s) afetado(s):** nenhum domínio funcional atribuído.
- **Fase(s) afetada(s):** não atribuída no `PLAN.md`.
- **Tarefas TASKS.md afetadas:** nenhuma (menção apenas em checklist — T13.6).
- **Dependências:** nenhuma declarada.
- **Bloqueadora:** **Não**.
- **Artefato futuro:** "Consideração futura própria" (`PLAN.md` §8) — artefato próprio a ser definido no processo; não especificado nos artefatos atuais.

### DP-17 — Persona P4 e relatórios de analytics

- **Descrição objetiva:** requisitos do persona observador/analista (P4) e seus relatórios agregados de gestão institucional. A visão geral deixa P4 "mencionada, não detalhada" com requisitos para SPEC de analytics (SPEC §3 P4).
- **Origem no PLAN.md:** §8 (linha DP-17); §5.15 pendências; §3 (persona P4).
- **Domínio(s) afetado(s):** **D15** (analytics).
- **Fase(s) afetada(s):** **F11**.
- **Tarefas TASKS.md afetadas:** T11.1 (parcial — professor/admin `[Livre]`, P4 `[Bloqueada: DP-17]`), T11.5 (bloqueada — registrar dependência de P4); menção em T0.3.
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Parcial** — apenas relatórios de P4; métricas de professor/admin de D15 não dependem dela.
- **Artefato futuro:** **SPEC de analytics** (`PLAN.md` §8).

### DP-18 — Catálogos e tabelas de gamificação

- **Descrição objetiva:** catálogo inicial de conquistas e critérios (D8), tipos de missão/tabela de recompensas (D9), mecânica de pontuação e premiação de desafios (D10), catálogo de itens/preços/estoque/efeitos da loja (D12). A visão geral define as regras de alto nível, mas não traz catálogos (SPEC §5 D8, D9, D10, D12).
- **Origem no PLAN.md:** §8 (linha DP-18); §5.8, §5.9, §5.10, §5.12 pendências.
- **Domínio(s) afetado(s):** **D8, D9, D10, D12**.
- **Fase(s) afetada(s):** **F5** (D8), **F6** (D9, D10), **F8** (D12).
- **Tarefas TASKS.md afetadas:** T5.5 (catálogo de conquistas — bloqueada), T6.1 (missões — bloqueada), T6.3 (desafios — bloqueada), T8.1 (catálogo da loja — bloqueada); menção em T0.3.
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Sim** (para as tarefas de SPEC/definição de catálogo de F5, F6 e F8).
- **Artefato futuro:** **SPECs de cada domínio correspondente** (D8, D9, D10, D12) — `PLAN.md` §8.

### DP-19 — Formato de conteúdo de aula, limites de upload e embeds

- **Descrição objetiva:** formato exato do conteúdo de aula, limites de upload e regras de incorporação (embed). A visão geral cita as entidades de conteúdo (texto, mídia embedada, material anexo — SPEC §5 D3) sem detalhá-las; o embed de vídeo externo é limite fixo do sistema (SPEC §6 — não é host de vídeo).
- **Origem no PLAN.md:** §8 (linha DP-19); §5.3 pendências; §11 item 9.
- **Domínio(s) afetado(s):** **D3** (catálogo de aprendizagem).
- **Fase(s) afetada(s):** **F2**.
- **Tarefas TASKS.md afetadas:** T2.1 (registrar pendência na SPEC D3), T2.3 (`[Bloqueada: DP-19]` para formato/limites; execução parcial `[Livre]`); menções em T0.1, T0.3 e T13.6.
- **Dependências:** nenhuma outra DP declarada.
- **Bloqueadora:** **Parcial** — só formato/limites de T2.3; a hierarquia e a estrutura de conteúdo seguem em `[Livre]`.
- **Artefato futuro:** **SPEC de conteúdo** (`PLAN.md` §8).

---

## 4. Classificação dos bloqueios

Classificação derivada do tratamento já estabelecido em `PLAN.md` §8 (coluna "Tratamento") e `§11`, e dos estados de bloqueio do `TASKS.md`. **Nenhuma divergência em relação à classificação do PLAN** — não há reclassificação, apenas agrupamento por categoria (justificativa: o PLAN distribui as DPs por coluna, não por categoria; agrupar não altera tratamento, fase, artefato futuro ou status de nenhuma DP).

### Categoria A — Necessárias antes da implementação (globais)

| DP | Observação |
|---|---|
| DP-01 | stack — `PLAN.md` §8: "antes de F1 detalhada" |
| DP-02 | modelo físico — `PLAN.md` §8: "SPEC técnica própria" |
| DP-03 | contratos de API — `PLAN.md` §8: "SPEC técnica própria" |

Efeito: pré-requisito global de toda tarefa cujo artefato é funcionalidade (`TASKS.md` preâmbulo; T0.2 é a tarefa de roteirização).

### Categoria B — Necessárias antes de determinados domínios/fases

| DP | Domínio | Fase | Tarefas bloqueadas |
|---|---|---|---|
| DP-19 | D3 | F2 | T2.3 (parcial) |
| DP-08 | D4 (+D5) | F3 | T3.1, T3.2, T3.3, T3.5 |
| DP-09 | D5 | F3 | T3.4 (item), T3.5 (parcial) |
| DP-07 | D7 (+D17) | F5 (+F13) | T5.1–T5.4, T13.4 |
| DP-18 | D8, D9, D10, D12 | F5, F6, F8 | T5.5, T6.1, T6.3, T8.1 |
| DP-10 | D11 | F7 | T7.1, T7.2, T7.3 |
| DP-11 | D13 (e-mail) | F9 | T9.4; T9.1 parcial |
| DP-17 | D15 (P4) | F11 | T11.5; T11.1 parcial |

### Categoria C — Dependem de uma SPEC futura (artefato próprio; não bloqueiam tarefas funcionais atuais)

| DP | Artefato futuro | Observação |
|---|---|---|
| DP-04 | SPEC de NFRs | não citada como bloqueio em tarefas funcionais |
| DP-05 | SPEC de UI/UX | `TASKS.md` preâmbulo: não bloqueia tarefas funcionais |
| DP-06 | SPEC própria (acessibilidade/i18n) | `TASKS.md` preâmbulo: não bloqueia tarefas funcionais |
| DP-11 | SPEC de integrações | parcela de e-mail; a entrega in-app de D13 é `[Livre]` (também listada na Categoria B por ter fase e tarefa) |
| DP-15 | SPEC de NFRs (via DP-04) | dependência explícita DP-15 → DP-04 |
| DP-16 | consideração futura própria | artefato não especificado nos atuais |

### Categoria D — Fora do escopo permanente (desta visão)

| DP | Origem da classificação |
|---|---|
| DP-12 | `PLAN.md` §8: "**Fora de escopo do produto nesta visão** (não pendência de implementação)"; §11 item 8; SPEC §6 e §7.10 |
| DP-13 | `PLAN.md` §8: "Fora de escopo desta visão"; §11 item 8; SPEC §7.11 |
| DP-14 | `PLAN.md` §8: "Fora de escopo desta visão"; §11 item 8; SPEC §7.12 |

Essas decisões **não geram tarefas** (`TASKS.md` preâmbulo) e não bloqueiam nada — não são pendências de implementação.

---

## 5. Grafo/ordem de dependências

Ordem necessária para avançar no SDD, conforme exigência do prompt e suportada por `TASKS.md` (pré-requisito global + T0.2/T0.3) e `PLAN.md` §8:

```
DP-01
DP-02
DP-03
    ↓
SPEC técnica
    ↓
SPECs de domínio
    ↓
implementação
```

Leitura textual:

1. **DP-01, DP-02 e DP-03** precisam ser resolvidas primeiro, antes de qualquer execução de código ("antes de F1 detalhada" — `PLAN.md` §8; pré-requisito global do `TASKS.md`), via etapa/fase própria ou SPEC técnica (T0.2 roteiriza esse artefato, sem escolher tecnologias).
2. **SPEC técnica** (resolução de DP-01/02/03) — definida antes das SPECs de domínio entrarem em detalhe de implementação, na ordem exigida pelo prompt: SPEC técnica → SPECs de domínio → implementação.
3. **SPECs de domínio** — cada fase exige a SPEC do seu domínio antes do detalhe (T0.3; `PLAN.md` §9 item 2). Aqui entram as DPs de Categoria B: DP-19 (SPEC D3), DP-08 e DP-09 (SPECs D4/D5), DP-07 (SPEC D7), DP-18 (SPECs D8/D9/D10/D12), DP-10 (SPEC D11), DP-11 (SPEC de integrações, para e-mail), DP-17 (SPEC de analytics, para P4).
4. **Implementação** — só após os itens 1–3 aplicáveis à fase em questão.

**Outras dependências entre decisões registradas (apenas quando suportadas por artefato existente):**

- **DP-15 → DP-04**: o tratamento de DP-15 no `PLAN.md` §8 é "SPEC de NFRs (DP-04)" — DP-15 só se resolve junto/depois de DP-04.
- **Não há outras dependências entre DPs declaradas** em SPEC, PLAN ou TASKS; relações inversas (tarefa depende de DP) estão registradas na Seção 2/3 e não foram convertidas em dependência entre decisões, para não inventar vínculos.

---

## 6. Critério para considerar uma decisão resolvida

Critério **documental/processual** (não técnico). Uma DP-xx deixa de ser considerada pendente **somente** quando **todos** os pontos abaixo forem verdadeiros:

1. **Artefato existe:** o artefato futuro indicado na Seção 3 desta DP (ex.: SPEC técnica, SPEC de D7, SPEC de NFRs) existe no repositório no caminho previsto pelo processo SDD.
2. **Decisão registrada explicitamente:** o artefato contém a decisão de forma inequívoca (não como alternativa listada), com a mesma numeração da DP (ou com mapeamento formal DP-xx → seção do novo artefato).
3. **Aprovação formal:** o cabeçalho do artefato registra status aprovado, conforme o padrão já usado pela SPEC de visão geral (`PLAN.md` cabeçalho/`SPEC/2026-09-30-visao-geral.md`).
4. **Rastreabilidade de origem:** o novo artefato referencia a SPEC de visão geral, o `PLAN.md` §8 (linha da DP) e o `TASKS.md` (tarefas que a vinculavam).
5. **Registro de resolução no processo:** `PLAN.md` §8 e este documento são formalmente atualizados (em revisão própria, posterior a esta tarefa) para marcar a DP como resolvida, indicando o artefato e a data — preservando o histórico da numeração (nenhuma DP é renumerada nem removida).
6. **Bloqueios removidos com rastreabilidade:** os estados de bloqueio correspondentes no `TASKS.md` são removidos/alterados apenas na revisão formal seguinte, rastreando a resolução.

**O que NÃO resolve uma DP:** opção escolhida informalmente durante a implementação; menção em comentário, conversa ou tarefa; qualquer decisão técnica tomada sem o artefato dos itens 1–5.

---

## 7. Verificação de integridade (checklist desta tarefa)

| Verificação exigida pelo prompt | Resultado |
|---|---|
| DP-01–DP-19 aparecem no documento? | **Sim** — Seções 2, 3 e 4 contêm as 19 decisões (contagem: 16 Pendentes + 3 Fora de escopo = 19). |
| Nenhuma DP foi resolvida? | **Sim** — nenhuma solução escolhida; Seção 6 define apenas o critério documental futuro. |
| Todas as DPs possuem rastreabilidade? | **Sim** — cada entrada da Seção 3 registra origem no `PLAN.md` (§8 e demais seções citadas) e tarefas `TASKS.md` afetadas. |
| As 17 áreas D1–D17 continuam preservadas? | **Sim** — nenhuma SPEC/PLAN/TASKS alterado; domínios citados apenas como referência (D3, D4, D5, D7, D8, D9, D10, D11, D12, D13, D15, D17 e transversal D1–D17). |
| As 24 funcionalidades continuam preservadas? | **Sim** — nenhuma alteração nos artefatos que as mapeiam (`SPEC` §5, `PLAN` §2, `TASKS` intro). |
| F0–F13 continuam preservadas? | **Sim** — fases citadas sem alteração; nenhuma nova fase criada. |
| Nenhuma decisão nova foi criada? | **Sim** — apenas as 19 DPs já existentes; nenhum novo ID (DP-20+) criado. |
| Nenhum requisito novo foi introduzido? | **Sim** — todo conteúdo é citação/reorganização de SPEC, PLAN e TASKS; informações ausentes registradas como não especificadas (ex.: DP-16). |
| Nenhum código foi criado? | **Sim** — `src/` e `tests/` permanecem vazios. |
| SPEC, PLAN e TASKS permanecem inalterados? | **Sim** — nenhuma edição nesses arquivos; saída única deste artefato. |

**Restrições cumpridas:** nenhum framework, linguagem, banco, arquitetura, endpoint, schema físico, fórmula de XP/níveis, tipo definitivo de questão ou regra definitiva de ranking foi definido; nenhuma tecnologia foi sequer citada como alternativa (os artefatos de origem também não as nomeiam).
