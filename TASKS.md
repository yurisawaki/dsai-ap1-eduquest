# TASKS — EduQuest

| Campo | Valor |
|---|---|
| Artefato | `TASKS.md` (3ª etapa do processo SDD) |
| Fonte única de derivacao | `PLAN.md` (e, por rastreabilidade, `SPEC/2026-09-30-visao-geral.md`) |
| Processo | SPEC → PLAN → TASKS → implementação → testes → revisão |
| Próxima etapa | execução das tarefas na etapa de implementação (código), depois testes e revisão |
| Restrições desta etapa | Sem código, sem alteração de SPEC/PLAN, sem stack, sem contratos de API, sem modelo físico de dados, sem fórmulas de XP/níveis, sem tipos de questão pendentes, sem resolver DP-01–DP-19 |

---

## Como ler este arquivo

**Formato de cada tarefa:** ID · fase · domínio · descrição objetiva · pré-requisitos · artefatos esperados · validação/critério de conclusão · rastreabilidade (PLAN e SPEC) · dependências/bloqueios.

**Estados de bloqueio:**

- `[Livre]` — pode executar quando os pré-requisitos da fase estiverem concluídos.
- `[Bloqueada: DP-xx]` — decisão pendente do `PLAN.md` §8; não pode ser resolvida nesta etapa, somente após a SPEC/decisão correspondente.
- `[Depende de SPEC Dn]` — detalhe fino será definido na SPEC própria do domínio (`PLAN.md` §9 item 2); a tarefa executa o que já está declarado e deixa o detalhe pendente.

**Pré-requisito global de implementação (vale para todas as tarefas cujo artefato é funcionalidade):** a resolução de **DP-01 (stack), DP-02 (modelo físico) e DP-03 (contratos de API)** antes da execução de código, conforme `PLAN.md` §8 ("antes de F1 detalhada"). Este bloqueio **não é repetido tarefa a tarefa**; é assumido globalmente. Nenhuma dessas decisões é resolvida neste artefato.

**Fora do escopo permanente (não geram tarefas):** DP-12 (pagamentos/moedas reais), DP-13 (IA/LLM), DP-14 (multi-tenancy) — fora da visão (`PLAN.md` §11); DP-15 e DP-04 dependem de SPEC de NFRs; DP-05 (UI/UX) e DP-06 (acessibilidade/i18n) dependem das SPECs próprias e não bloqueiam tarefas funcionais abaixo.

**Pré-requisito de fase (herdado do `PLAN.md` §7):** F2 exige F1; F3 exige F2; F4 exige F2 e F3; F5 exige F4 e F3; F6 exige F5 e F3; F7 exige F5 e F4; F8 exige F5 e F6; F9 exige F1 e eventos de F4–F8; F10 exige F1 e F2; F11 exige eventos de F2–F8 e F10, e F1; F12 exige F4, F3 e F2; F13 exige F1, F10, F5 e F11.

---

## Resumo de cobertura (rastreabilidade rápida)

| Fase | Domínios | Tarefas |
|---|---|---|
| F0 | (transversal, nenhum domínio funcional) | T0.1–T0.4 |
| F1 | D1, D2 (+base de D17) | T1.1–T1.7 |
| F2 | D3 | T2.1–T2.6 |
| F3 | D4, D5 | T3.1–T3.6 |
| F4 | D6 | T4.1–T4.5 |
| F5 | D7, D8 | T5.1–T5.7 |
| F6 | D9, D10 | T6.1–T6.6 |
| F7 | D11 | T7.1–T7.4 |
| F8 | D12 | T8.1–T8.6 |
| F9 | D13 | T9.1–T9.5 |
| F10 | D14 | T10.1–T10.6 |
| F11 | D15 | T11.1–T11.6 |
| F12 | D16 | T12.1–T12.4 |
| F13 | D17 | T13.1–T13.6 |

**24 funcionalidades → tarefa(s):**

| Funcionalidade | Tarefa(s) |
|---|---|
| cadastro e autenticação | T1.2, T1.3 |
| perfis | T1.5, T1.6 |
| cursos / módulos / aulas | T2.2, T2.3, T2.4 |
| exercícios / questões | T3.2, T3.3 |
| avaliações | T3.5 |
| progresso acadêmico | T4.2, T4.3, T4.4 |
| XP | T5.2 |
| níveis | T5.3 |
| conquistas | T5.5, T5.6 |
| missões | T6.1, T6.2 |
| desafios | T6.3, T6.4 |
| rankings | T7.2, T7.3 |
| recompensas | T6.2, T6.4, T8.3 |
| moedas virtuais | T8.2 |
| loja | T8.3 |
| inventário | T8.4, T8.5 |
| notificações | T9.2, T9.3 |
| recursos sociais | T10.3, T10.4 |
| analytics | T11.2, T11.3 |
| certificados | T12.2, T12.3 |
| administração | T13.2, T13.3, T13.4, T13.5 |

---

## F0 — Habilitadores

#### T0.1 — Confirmar inventário de decisões pendentes e vínculo com fases

- **Fase / Domínio:** F0 / transversal
- **Descrição:** Conferir que todas as pendências DP-01–DP-19 do `PLAN.md` §8 existem, estão com origem na SPEC citada e estão vinculadas à fase/domínio que elas bloqueiam; registrar o vínculo "DP → fase bloqueada → tarefas afetadas".
- **Pré-requisitos:** `PLAN.md` aprovado (Seção 10 sem pendências abertas).
- **Artefatos esperados:** tabela de mapeamento DP → fase → tarefas (documento do processo).
- **Validação:** nenhuma DP ausente; nenhuma DP sem fase/domínio associado; nenhuma DP resolvida.
- **Rastreabilidade:** `PLAN.md` §8, §7 Fase 0; SPEC §7.
- **Bloqueios:** `[Livre]`

#### T0.2 — Roteirizar a SPEC técnica que resolverá DP-01, DP-02 e DP-03

- **Fase / Domínio:** F0 / transversal
- **Descrição:** Definir o roteiro (escopo e seções) da SPEC técnica futura que definirá stack (DP-01), modelo físico (DP-02) e contratos de API (DP-03), sem escolher tecnologias.
- **Pré-requisitos:** T0.1.
- **Artefatos esperados:** roteiro/documento de escopo da SPEC técnica.
- **Validação:** o roteiro não contém nomes de linguagens, frameworks, bancos ou provedores; toda decisão técnica aparece como pendente.
- **Rastreabilidade:** `PLAN.md` §7 Fase 0, §8 DP-01–DP-03; SPEC §7.1–§7.3.
- **Bloqueios:** `[Livre]` (a resolução em si permanece bloqueada: DP-01–DP-03)

#### T0.3 — Roteirizar as SPECs de domínio necessárias por fase

- **Fase / Domínio:** F0 / transversal
- **Descrição:** Listar as SPECs de domínio D1–D17 exigidas antes do detalhe de cada fase, destacando as que carregam pendências explícitas (D4/DP-08, D5/DP-09, D7/DP-07, D11/DP-10, D15/DP-17, além de DP-18 e DP-19).
- **Pré-requisitos:** T0.1.
- **Artefatos esperados:** lista ordenada "fase → SPEC de domínio obrigatória".
- **Validação:** toda fase F1–F13 tem ao menos uma SPEC de domínio associada; toda DP aplicável aparece na SPEC responsável.
- **Rastreabilidade:** `PLAN.md` §7 Fase 0, §8, §9 item 2; SPEC §7.7.
- **Bloqueios:** `[Livre]`

#### T0.4 — Verificação documental do baseline antes de F1

- **Fase / Domínio:** F0 / transversal
- **Descrição:** Executar a verificação dos 10 critérios de conclusão do `PLAN.md` §10 e registrar o resultado, confirmando que SPEC e PLAN não foram alterados.
- **Pré-requisitos:** T0.1–T0.3.
- **Artefatos esperados:** registro de verificação (checklist preenchido).
- **Validação:** os 10 critérios de `PLAN.md` §10 marcados como atendidos; integridade da SPEC confirmada.
- **Rastreabilidade:** `PLAN.md` §10, §12; SPEC §8.
- **Bloqueios:** `[Livre]`

---

## F1 — Identidade, acesso e perfis

#### T1.1 — Elaborar SPEC do domínio D1 (identidade e acesso)

- **Fase / Domínio:** F1 / D1
- **Descrição:** Escrever a SPEC de D1 com critérios de aceitação derivados das regras da SPEC de visão geral: credencial única, senha protegida, sessão expira, acesso por papel, sem login não há ação de estudante.
- **Pré-requisitos:** T0.3.
- **Artefatos esperados:** `SPEC/` de D1 com critérios de aceitação verificáveis.
- **Validação:** cada regra de D1 da visão geral vira ao menos um critério objetivo; nenhuma decisão de DP-01–DP-03 resolvida ali.
- **Rastreabilidade:** `PLAN.md` §5.1, §7 F1, §9 item 2; SPEC §5 D1.
- **Bloqueios:** `[Livre]`

#### T1.2 — Implementar cadastro de contas

- **Fase / Domínio:** F1 / D1
- **Descrição:** Implementar o cadastro de estudante, professor e administrador com validação de unicidade de e-mail/credencial e armazenamento protegido de senha.
- **Pré-requisitos:** T1.1; pré-requisito global (DP-01–DP-03).
- **Artefatos esperados:** funcionalidade de cadastro disponível na aplicação; testes das regras de unicidade e proteção de senha.
- **Validação:** critérios de aceitação de D1 relacionados a cadastro passam; funcionalidade 1 da visão geral verificável.
- **Rastreabilidade:** `PLAN.md` §5.1, §7 F1, O1; SPEC §5 D1, §4 passo 1; funcionalidade 1.
- **Bloqueios:** `[Depende de SPEC D1]` + global DP-01–DP-03

#### T1.3 — Implementar login, logout, sessão e recuperação de senha

- **Fase / Domínio:** F1 / D1
- **Descrição:** Implementar autenticação (login/logout), ciclo de sessão com expiração e fluxo de recuperação de senha.
- **Pré-requisitos:** T1.2.
- **Artefatos esperados:** fluxo de autenticação funcional; testes de expiração de sessão e de recuperação de senha.
- **Validação:** sessão expira conforme critério de D1; passo 2 do fluxo principal executável.
- **Rastreabilidade:** `PLAN.md` §5.1, §7 F1, O1; SPEC §5 D1, §4 passo 2; funcionalidade 1.
- **Bloqueios:** `[Depende de SPEC D1]` + global DP-01–DP-03

#### T1.4 — Implementar papéis e controle de acesso

- **Fase / Domínio:** F1 / D1 (+base de D17)
- **Descrição:** Implementar os três papéis fixos (estudante, professor, administrador) e a determinação de acesso por papel em toda ação da aplicação.
- **Pré-requisitos:** T1.2.
- **Artefatos esperados:** mecanismo de papel ativo em todas as áreas; testes de negação de acesso cruzado.
- **Validação:** "acesso determinado por papel" verificado para cada papel; restrições de P1/P2/P3 da SPEC de visão observadas.
- **Rastreabilidade:** `PLAN.md` §5.1, §5.17 (base), §7 F1; SPEC §5 D1, §3, §6 (papéis fixos).
- **Bloqueios:** `[Depende de SPEC D1]` + global DP-01–DP-03

#### T1.5 — Implementar perfis de estudante e professor

- **Fase / Domínio:** F1 / D2
- **Descrição:** Implementar perfis (estudante e professor, com bio pública opcional no professor), edição restrita ao próprio titular e regras de visibilidade.
- **Pré-requisitos:** T1.1 (SPEC de D1 estendida a D2 ou SPEC de D2 — seguir `PLAN.md` T0.3), T1.2.
- **Artefatos esperados:** perfis editáveis pelo próprio usuário; testes de isolamento de edição.
- **Validação:** estudante edita apenas o próprio perfil; e-mail e notas nunca públicos; passo 1 do fluxo (criação de perfil junto ao cadastro) executável.
- **Rastreabilidade:** `PLAN.md` §5.2, §7 F1; SPEC §5 D2, §4 passo 1; funcionalidade 2.
- **Bloqueios:** `[Depende de SPEC D2]` + global DP-01–DP-03

#### T1.6 — Implementar exibição de nível, conquistas e inventário no perfil

- **Fase / Domínio:** F1 / D2
- **Descrição:** Implementar as áreas do perfil que exibem nível, conquistas e inventário, aceitando dados vazios até F5/F8.
- **Pré-requisitos:** T1.5.
- **Artefatos esperados:** seções do perfil renderizando os dados quando existirem e estado vazio quando não.
- **Validação:** perfil não quebra sem dados de gamificação; após F5/F8, exibição reflete os dados reais.
- **Rastreabilidade:** `PLAN.md` §5.2, §7 F1; SPEC §5 D2.
- **Bloqueios:** `[Livre]` (alimentação de dados depende de F5/T5.6 e F8/T8.5) + global DP-01–DP-03

#### T1.7 — Validar F1 (D1 e D2)

- **Fase / Domínio:** F1 / D1, D2
- **Descrição:** Executar a validação da fase: critérios de D1 e D2, fluxo passos 1–2 e permissões por persona (P1, P2, P3).
- **Pré-requisitos:** T1.2–T1.6.
- **Artefatos esperados:** relatório de validação da fase F1 (resultado de testes e revisão documental).
- **Validação:** todas as regras de D1/D2 cobertas por ao menos um teste/critério; passos 1–2 do fluxo percorridos sem violação de papel.
- **Rastreabilidade:** `PLAN.md` §7 F1, §9.
- **Bloqueios:** `[Livre]`

---

## F2 — Catálogo de aprendizagem

#### T2.1 — Elaborar SPEC do domínio D3 (catálogo)

- **Fase / Domínio:** F2 / D3
- **Descrição:** Escrever a SPEC de D3 com critérios de aceitação para hierarquia, publicação, autoria e conclusão de aula; registrar que formato de conteúdo/limites/embeddings dependem de DP-19.
- **Pré-requisitos:** F1 concluída; T0.3.
- **Artefatos esperados:** `SPEC/` de D3 com critérios de aceitação.
- **Validação:** regras de D3 da visão geral cobertas; DP-19 citada como pendência, não resolvida.
- **Rastreabilidade:** `PLAN.md` §5.3, §7 F2, §8 DP-19; SPEC §5 D3.
- **Bloqueios:** `[Livre]`

#### T2.2 — Implementar hierarquia curso > módulo > aula

- **Fase / Domínio:** F2 / D3
- **Descrição:** Implementar a criação e organização de cursos, módulos e aulas com a hierarquia fixa e estados de publicação.
- **Pré-requisitos:** T2.1; pré-requisito global (DP-01–DP-03).
- **Artefatos esperados:** estrutura navegável curso → módulo → aula; testes de hierarquia inválida rejeitada.
- **Validação:** hierarquia fixa preservada; aula só consumível quando publicada; funcionalidades 3–5 verificáveis.
- **Rastreabilidade:** `PLAN.md` §5.3, §7 F2; SPEC §5 D3; funcionalidades 3, 4, 5.
- **Bloqueios:** `[Depende de SPEC D3]` + global DP-01–DP-03

#### T2.3 — Implementar conteúdo de aula (texto, mídia embedada, material anexo)

- **Fase / Domínio:** F2 / D3
- **Descrição:** Implementar os tipos de conteúdo de aula declarados na visão geral: texto, mídia incorporada de provedor externo e material anexo — no formato e com os limites de `SPEC/2026-09-30-conteudo-aula.md` (DP-19): lista ordenada de 0–50 blocos com `posicao` (F2-12/F2-13 definitivos), upload de anexo em JSON+base64 (F2-15) e download (F2-16).
- **Pré-requisitos:** T2.2.
- **Artefatos esperados:** editor/exibição dos três tipos de conteúdo (formulário por tipo, sem JSON livre); suporte a embed externo sem armazenamento de vídeo próprio; migração (`posicao` em `conteudo_aula`, tabela `arquivo` com binário `BYTEA`); rotas F2-15/F2-16; testes TC-01–TC-20 da SPEC de conteúdo.
- **Validação:** nenhum armazenamento/transmissão de vídeo próprio (limite da visão; R-C9); critérios AC-01–AC-16 e TC-01–TC-20 de `SPEC/2026-09-30-conteudo-aula.md`.
- **Rastreabilidade:** `PLAN.md` §5.3, §7 F2, §8 DP-19, §11 item 9; SPEC §5 D3, §6 (não é host de vídeo); `SPEC/2026-09-30-conteudo-aula.md` §4–§8.
- **Bloqueios:** `[Livre]` — DP-19 resolvida em 2026-09-30 (`SPEC/2026-09-30-conteudo-aula.md`, aprovada); bloqueio removido nesta revisão formal. Pendências derivadas P-18–P-21 não bloqueiam (o que depende delas não é implementado) + global DP-01–DP-03

#### T2.4 — Implementar restrição de autoria (professor dono ou admin)

- **Fase / Domínio:** F2 / D3
- **Descrição:** Garantir que apenas o professor dono do curso (ou administrador) edite o conteúdo, aplicando a verificação em toda mutação do catálogo.
- **Pré-requisitos:** T2.2, T1.4 (papéis ativos).
- **Artefatos esperados:** verificação de autoria aplicada; testes de tentativa de edição por professor de outro curso negada.
- **Validação:** "apenas professor dono (ou admin) edita" verificado; restrição P2 da visão observada.
- **Rastreabilidade:** `PLAN.md` §5.3, §7 F2; SPEC §5 D3, §3 P2.
- **Bloqueios:** `[Depende de SPEC D3]` + global DP-01–DP-03

#### T2.5 — Implementar consumo autenticado e registro de conclusão de aula

- **Fase / Domínio:** F2 / D3
- **Descrição:** Permitir que o estudante autenticado consuma aulas publicadas e registrar a conclusão da aula como evento de progresso.
- **Pré-requisitos:** T2.2, T2.3, T1.3.
- **Artefatos esperados:** consumo de aula disponível; registro de conclusão por estudante; testes de conclusão duplicada conforme critério da SPEC D3.
- **Validação:** conclusão registrada por estudante; passos 3–4 do fluxo executáveis; evento alimenta F4.
- **Rastreabilidade:** `PLAN.md` §5.3, §6 item 3, §7 F2; SPEC §5 D3, §4 passos 3–4.
- **Bloqueios:** `[Depende de SPEC D3]` + global DP-01–DP-03

#### T2.6 — Validar F2 (D3)

- **Fase / Domínio:** F2 / D3
- **Descrição:** Executar a validação da fase: regras de D3 e passos 3–4 do fluxo, incluindo verificação de fronteira de vídeo.
- **Pré-requisitos:** T2.2–T2.5.
- **Artefatos esperados:** relatório de validação da fase F2.
- **Validação:** hierarquia, publicação, autoria e conclusão cobertas; nenhum recurso de vídeo próprio presente (R-C9 de `SPEC/2026-09-30-conteudo-aula.md`: F2-15 rejeita `video/*`, F2-12 não aceita binário).
- **Rastreabilidade:** `PLAN.md` §7 F2, §9; `SPEC/2026-09-30-conteudo-aula.md` §8 (TC-01–TC-20).
- **Bloqueios:** `[Livre]`

---

## F3 — Exercícios, questões e avaliações

#### T3.1 — Elaborar SPEC do domínio D4 (questões)

- **Fase / Domínio:** F3 / D4
- **Descrição:** Escrever a SPEC de D4 cobrindo gabarito, tentativas, resposta, acerto e feedback; definir nela o conjunto definitivo de tipos de questão (resolução de DP-08) — este TASKS não define tipos.
- **Pré-requisitos:** F2 concluída; T0.3.
- **Artefatos esperados:** `SPEC/` de D4 com critérios de aceitação e tipos de questão definidos.
- **Validação:** regras de D4 da visão cobertas; tipos de questão presentes apenas na SPEC D4, ausentes deste TASKS.
- **Rastreabilidade:** `PLAN.md` §5.4, §7 F3, §8 DP-08; SPEC §5 D4 ("a confirmar em SPEC própria").
- **Bloqueios:** `[Bloqueada: DP-08]` — a SPEC D4 é o veículo de resolução; DP-08 não pode ser resolvida aqui

#### T3.2 — Implementar questões e gabarito protegido

- **Fase / Domínio:** F3 / D4
- **Descrição:** Implementar a authoring e a entrega de questões conforme os tipos definidos na SPEC D4, mantendo o gabarito não exposto antes do envio.
- **Pré-requisitos:** T3.1.
- **Artefatos esperados:** questões publicadas em curso/módulo; testes de não exposição do gabarito antes do envio.
- **Validação:** "gabarito não exposto antes do envio" verificado; questão pertence a curso/módulo; funcionalidades 6–7 verificáveis.
- **Rastreabilidade:** `PLAN.md` §5.4, §7 F3; SPEC §5 D4; funcionalidades 6, 7.
- **Bloqueios:** `[Bloqueada: DP-08]` + global DP-01–DP-03

#### T3.3 — Implementar tentativas de exercício e feedback imediato

- **Fase / Domínio:** F3 / D4
- **Descrição:** Implementar o registro de tentativa com resposta e acerto e a emissão de feedback conforme a regra da questão.
- **Pré-requisitos:** T3.2.
- **Artefatos esperados:** tentativas persistidas com acerto; feedback emitido após envio; testes de fluxo de tentativa.
- **Validação:** "tentativa registrada com resposta e acerto"; passo 5 do fluxo executável; evento alimenta F4 e F5.
- **Rastreabilidade:** `PLAN.md` §5.4, §6 item 5, §7 F3; SPEC §5 D4, §4 passo 5.
- **Bloqueios:** `[Bloqueada: DP-08]` (correção depende dos tipos) + global DP-01–DP-03

#### T3.4 — Elaborar SPEC do domínio D5 (avaliações)

- **Fase / Domínio:** F3 / D5
- **Descrição:** Escrever a SPEC de D5 cobrindo composição, tentativas, janela, nota e resultado; registrar que a correção manual de dissertativas (DP-09) é decisão ali e não aqui.
- **Pré-requisitos:** T3.1.
- **Artefatos esperados:** `SPEC/` de D5 com critérios de aceitação.
- **Validação:** regras de D5 da visão cobertas; DP-09 citada como pendência, não resolvida.
- **Rastreabilidade:** `PLAN.md` §5.5, §7 F3, §8 DP-09; SPEC §5 D5 ("a confirmar em SPEC própria").
- **Bloqueios:** `[Bloqueada: DP-09]` para o item de correção manual

#### T3.5 — Implementar avaliações (composição, tentativas, prazo, nota no servidor)

- **Fase / Domínio:** F3 / D5
- **Descrição:** Implementar avaliações compostas por questões, com número de tentativas e janela definidos pelo professor, nota calculada no servidor e resultado encaminhado ao progresso.
- **Pré-requisitos:** T3.4, T3.2.
- **Artefatos esperados:** avaliação publicável; tentativa respeitando janela/limite; nota calculada servidor; testes de janela e limite de tentativas.
- **Validação:** "nota calculada servidor"; "professor define tentativas e janela"; passo 6 do fluxo executável; funcionalidade 8 verificável.
- **Rastreabilidade:** `PLAN.md` §5.5, §7 F3; SPEC §5 D5, §4 passo 6; funcionalidade 8.
- **Bloqueios:** `[Bloqueada: DP-08]` (composição/nota por tipo) e `[Bloqueada: DP-09]` (só para dissertativas) + global DP-01–DP-03

#### T3.6 — Validar F3 (D4 e D5)

- **Fase / Domínio:** F3 / D4, D5
- **Descrição:** Executar a validação da fase: proteção de gabarito, registro de tentativas, nota no servidor e passos 5–6 do fluxo.
- **Pré-requisitos:** T3.2, T3.3, T3.5.
- **Artefatos esperados:** relatório de validação da fase F3.
- **Validação:** todas as regras de D4/D5 cobertas por testes/critérios; nenhum tipo de questão usado fora do definido na SPEC D4.
- **Rastreabilidade:** `PLAN.md` §7 F3, §9.
- **Bloqueios:** `[Livre]` (após conclusão das tarefas não bloqueadas da fase)

---

## F4 — Progresso acadêmico

#### T4.1 — Elaborar SPEC do domínio D6 (progresso)

- **Fase / Domínio:** F4 / D6
- **Descrição:** Escrever a SPEC de D6 com critérios de aceitação para derivação a partir de conclusões, monotonicidade, reset explícito e papel de fonte única de verdade.
- **Pré-requisitos:** F2 e F3 concluídas; T0.3.
- **Artefatos esperados:** `SPEC/` de D6 com critérios de aceitação e fórmula de percentual definida ali (não aqui).
- **Validação:** regras de D6 da visão cobertas; cálculo de percentual não inventado neste TASKS.
- **Rastreabilidade:** `PLAN.md` §5.6, §7 F4; SPEC §5 D6.
- **Bloqueios:** `[Livre]`

#### T4.2 — Implementar registro de progresso de aula, módulo e curso

- **Fase / Domínio:** F4 / D6
- **Descrição:** Implementar o registro de progresso derivado exclusivamente das conclusões de aula e resultados de avaliação já registrados.
- **Pré-requisitos:** T4.1, T2.5, T3.5.
- **Artefatos esperados:** progresso de aula/módulo/curso atualizado por eventos; testes de derivação a partir de conclusões.
- **Validação:** "progresso deriva de conclusões registradas"; nenhum progresso criado sem atividade de aprendizagem correspondente.
- **Rastreabilidade:** `PLAN.md` §5.6, §4 princípios; SPEC §5 D6, §6 (não é um jogo); funcionalidade 9.
- **Bloqueios:** `[Depende de SPEC D6]` + global DP-01–DP-03

#### T4.3 — Implementar agregação percentual monotônica e reset explícito

- **Fase / Domínio:** F4 / D6
- **Descrição:** Implementar a agregação em percentuais por curso com monotonicidade crescente e suporte a reset explícito por professor/administrador.
- **Pré-requisitos:** T4.2.
- **Artefatos esperados:** percentuais por curso/módulo; fluxo de reset autorizado; testes de monotonicidade e de reset.
- **Validação:** percentuais nunca diminuem fora de reset explícito; reset negado a papéis não autorizados.
- **Rastreabilidade:** `PLAN.md` §5.6, §4 princípio 8; SPEC §5 D6; funcionalidade 9.
- **Bloqueios:** `[Depende de SPEC D6]` (fórmula fina) + global DP-01–DP-03

#### T4.4 — Implementar estatísticas pessoais do estudante

- **Fase / Domínio:** F4 / D6
- **Descrição:** Disponibilizar ao estudante as próprias estatísticas (módulos concluídos, cursos em andamento/concluídos, percentuais).
- **Pré-requisitos:** T4.3, T1.5.
- **Artefatos esperados:** visão de progresso do estudante; testes de isolamento (só os próprios dados).
- **Validação:** passo 7 do fluxo executável; estudante vê apenas o próprio progresso.
- **Rastreabilidade:** `PLAN.md` §5.6, §7 F4; SPEC §5 D6, §4 passo 7; funcionalidade 9.
- **Bloqueios:** `[Depende de SPEC D6]` + global DP-01–DP-03

#### T4.5 — Validar F4 (D6)

- **Fase / Domínio:** F4 / D6
- **Descrição:** Executar a validação da fase: derivação, monotonicidade, reset e passo 7; confirmar que D6 está apto a servir de fonte para D11 e D16.
- **Pré-requisitos:** T4.2–T4.4.
- **Artefatos esperados:** relatório de validação da fase F4.
- **Validação:** regras de D6 cobertas; consumo futuro por rankings/certificados viabilizado (sem implementá-los aqui).
- **Rastreabilidade:** `PLAN.md` §7 F4, §9, §6 item 9.
- **Bloqueios:** `[Livre]`

---

## F5 — XP, níveis e conquistas

#### T5.1 — Elaborar SPEC do domínio D7 (XP e níveis)

- **Fase / Domínio:** F5 / D7
- **Descrição:** Escrever a SPEC de D7 definindo a fórmula de XP, a fórmula/tabela de níveis (resolução de DP-07), escopos de configuração e a separação XP total × XP do período.
- **Pré-requisitos:** F4 concluída; T0.3.
- **Artefatos esperados:** `SPEC/` de D7 com fórmulas e tabela de níveis definidos ali.
- **Validação:** fórmulas ausentes deste TASKS e do `PLAN.md`; regras da visão cobertas.
- **Rastreabilidade:** `PLAN.md` §5.7, §7 F5, §8 DP-07; SPEC §5 D7, §7.7.
- **Bloqueios:** `[Bloqueada: DP-07]` — a SPEC D7 é o veículo de resolução

#### T5.2 — Implementar concessão de XP por ações verificadas (servidor)

- **Fase / Domínio:** F5 / D7
- **Descrição:** Implementar a concessão de XP no servidor, disparada apenas por ações verificadas (conclusão de aula, acerto, entrega de avaliação), conforme a fórmula da SPEC D7.
- **Pré-requisitos:** T5.1, T2.5, T3.3, T3.5.
- **Artefatos esperados:** eventos de XP emitidos exclusivamente no servidor; testes de que o cliente não concede XP; testes dos gatilhos autorizados.
- **Validação:** "XP concedido apenas por ações verificadas"; regra de ouro da visão verificada; XP não comprável/transferível; passo 8 executável.
- **Rastreabilidade:** `PLAN.md` §5.7, §4 princípio 2, §7 F5, O4; SPEC §5 D7, §1, §4 passo 8 e regra de ouro; funcionalidades 10 e 11.
- **Bloqueios:** `[Bloqueada: DP-07]` + global DP-01–DP-03

#### T5.3 — Implementar níveis monotônicos e métricas XP total × período

- **Fase / Domínio:** F5 / D7
- **Descrição:** Implementar a tradução de XP acumulado em níveis com monotonicidade (nunca diminui) e manter XP total e XP do período como métricas distintas.
- **Pré-requisitos:** T5.2.
- **Artefatos esperados:** cálculo de nível conforme tabela da SPEC D7; duas métricas de XP persistidas; testes de monotonicidade.
- **Validação:** nível nunca diminui; XP total ≠ XP do período; exibição no perfil (T1.6) reflete os valores.
- **Rastreabilidade:** `PLAN.md` §5.7, §4 princípio 8, §7 F5; SPEC §5 D7, §1 (níveis irreversíveis); funcionalidades 10 e 11.
- **Bloqueios:** `[Bloqueada: DP-07]` + global DP-01–DP-03

#### T5.4 — Implementar configuração de XP ajustável por escopo

- **Fase / Domínio:** F5 / D7 (+D17)
- **Descrição:** Implementar a configuração de XP ajustável por escopo (global via administrador; escopo do curso via professor), aplicando-a às concessões.
- **Pré-requisitos:** T5.2, T1.4.
- **Artefatos esperados:** parâmetros de XP configuráveis por papel autorizado; testes de aplicação por escopo.
- **Validação:** professor altera apenas o próprio escopo; administrador altera global; alteração não reescreve XP já concedido (salvo regra explícita da SPEC D7/D17).
- **Rastreabilidade:** `PLAN.md` §5.7, §5.17, §7 F5; SPEC §5 D7, §3 P2/P3.
- **Bloqueios:** `[Bloqueada: DP-07]` + global DP-01–DP-03

#### T5.5 — Elaborar SPEC do domínio D8 (conquistas)

- **Fase / Domínio:** F5 / D8
- **Descrição:** Escrever a SPEC de D8 com o catálogo inicial de conquistas e critérios (DP-18) e a semântica de desbloqueio permanente/idempotente.
- **Pré-requisitos:** T5.1.
- **Artefatos esperados:** `SPEC/` de D8 com catálogo e critérios.
- **Validação:** regras de D8 da visão cobertas; catálogo presente apenas na SPEC D8.
- **Rastreabilidade:** `PLAN.md` §5.8, §7 F5, §8 DP-18; SPEC §5 D8.
- **Bloqueios:** `[Bloqueada: DP-18]` para o catálogo

#### T5.6 — Implementar desbloqueio de conquistas

- **Fase / Domínio:** F5 / D8
- **Descrição:** Implementar a avaliação de critérios por eventos de progresso/gamificação e o desbloqueio permanente e idempotente de conquistas, com exibição no perfil.
- **Pré-requisitos:** T5.5, T5.2, T1.6.
- **Artefatos esperados:** conquistas desbloqueadas por evento; testes de idempotência (segundo evento não duplica); notificação enfileirada para F9.
- **Validação:** desbloqueio permanente e idempotente; passo 8 executável; funcionalidade 12 verificável.
- **Rastreabilidade:** `PLAN.md` §5.8, §7 F5; SPEC §5 D8, §1, §4 passo 8; funcionalidade 12.
- **Bloqueios:** `[Depende de SPEC D8]` + global DP-01–DP-03

#### T5.7 — Validar F5 (D7 e D8)

- **Fase / Domínio:** F5 / D7, D8
- **Descrição:** Executar a validação da fase: regra de ouro, monotonicidade de nível, idempotência de conquistas e passo 8 do fluxo.
- **Pré-requisitos:** T5.2–T5.6.
- **Artefatos esperados:** relatório de validação da fase F5.
- **Validação:** nenhuma recompensa calculada fora do servidor; nenhuma fórmula usada divergente da SPEC D7.
- **Rastreabilidade:** `PLAN.md` §7 F5, §9.
- **Bloqueios:** `[Livre]`

---

## F6 — Missões e desafios

#### T6.1 — Elaborar SPEC do domínio D9 (missões)

- **Fase / Domínio:** F6 / D9
- **Descrição:** Escrever a SPEC de D9 com tipos de missão, critérios de cumprimento e tabela de recompensas (DP-18).
- **Pré-requisitos:** F5 concluída; T0.3.
- **Artefatos esperados:** `SPEC/` de D9 com critérios de aceitação.
- **Validação:** regras de D9 da visão cobertas; tabela de recompensas presente apenas na SPEC D9.
- **Rastreabilidade:** `PLAN.md` §5.9, §7 F6, §8 DP-18; SPEC §5 D9.
- **Bloqueios:** `[Bloqueada: DP-18]` para catálogo/tabela

#### T6.2 — Implementar missões

- **Fase / Domínio:** F6 / D9
- **Descrição:** Implementar missões com início e fim, progresso rastreado, pagamento único da recompensa ao cumprimento e não pagamento após expiração.
- **Pré-requisitos:** T6.1, T5.6, T5.2.
- **Artefatos esperados:** ciclo completo de missão (criação, progresso, cumprimento, expiração); testes de pagamento único e de expirada sem pagamento.
- **Validação:** "recompensa paga uma única vez"; "missão expirada não paga"; passos 8 e 11 executáveis; funcionalidades 13 e 16 verificáveis.
- **Rastreabilidade:** `PLAN.md` §5.9, §7 F6; SPEC §5 D9, §4 passos 8 e 11; funcionalidades 13, 16.
- **Bloqueios:** `[Depende de SPEC D9]` + global DP-01–DP-03

#### T6.3 — Elaborar SPEC do domínio D10 (desafios)

- **Fase / Domínio:** F6 / D10
- **Descrição:** Escrever a SPEC de D10 com mecânica de pontuação, prazos, premiação por colocação (DP-18).
- **Pré-requisitos:** T6.1.
- **Artefatos esperados:** `SPEC/` de D10 com critérios de aceitação.
- **Validação:** regras de D10 da visão cobertas; mecânica presente apenas na SPEC D10.
- **Rastreabilidade:** `PLAN.md` §5.10, §7 F6, §8 DP-18; SPEC §5 D10.
- **Bloqueios:** `[Bloqueada: DP-18]` para mecânica/premiação

#### T6.4 — Implementar desafios

- **Fase / Domínio:** F6 / D10
- **Descrição:** Implementar desafios com regras próprias (prazo, pontuação), resultado por participante, colocação e recompensa por colocação conforme configuração.
- **Pré-requisitos:** T6.3, T3.3, T3.5.
- **Artefatos esperados:** ciclo de desafio (criação, participação, resultado, colocação, recompensa); testes de prazo e de premiação.
- **Validação:** "desafio tem regras próprias"; "gera colocação"; passo 8 executável; funcionalidades 14 e 16 verificáveis.
- **Rastreabilidade:** `PLAN.md` §5.10, §7 F6; SPEC §5 D10, §4 passo 8; funcionalidades 14, 16.
- **Bloqueios:** `[Depende de SPEC D10]` + global DP-01–DP-03

#### T6.5 — Configuração de gamificação do próprio escopo pelo professor

- **Fase / Domínio:** F6 / D9, D10 (+D17)
- **Descrição:** Permitir que o professor crie e ajuste missões e desafios exclusivamente dentro do próprio escopo (próprios cursos), conforme permissão P2.
- **Pré-requisitos:** T6.2, T6.4, T1.4.
- **Artefatos esperados:** criação/ajuste de missões e desafios pelo dono do curso; testes de negação para escopo alheio.
- **Validação:** professor não altera gamificação de curso de outro professor; não altera dados globais.
- **Rastreabilidade:** `PLAN.md` §5.9, §5.10, §7 F6; SPEC §3 P2.
- **Bloqueios:** `[Depende de SPEC D9/D10]` + global DP-01–DP-03

#### T6.6 — Validar F6 (D9 e D10)

- **Fase / Domínio:** F6 / D9, D10
- **Descrição:** Executar a validação da fase: janelas, pagamento único, expiração, colocação, premiação e escopo do professor.
- **Pré-requisitos:** T6.2, T6.4, T6.5.
- **Artefatos esperados:** relatório de validação da fase F6.
- **Validação:** todas as regras de D9/D10 cobertas; recompensas fluem para F8 sem duplicação.
- **Rastreabilidade:** `PLAN.md` §7 F6, §9.
- **Bloqueios:** `[Livre]`

---

## F7 — Rankings

#### T7.1 — Elaborar SPEC do domínio D11 (rankings)

- **Fase / Domínio:** F7 / D11
- **Descrição:** Escrever a SPEC de D11 definindo métricas, escopos, períodos, regra de empate (DP-10) e política de privacidade/pseudonimização.
- **Pré-requisitos:** F5 e F4 concluídas; T0.3.
- **Artefatos esperados:** `SPEC/` de D11 com critérios de aceitação.
- **Validação:** regras de D11 da visão cobertas; empate/privacidade definidos apenas na SPEC D11.
- **Rastreabilidade:** `PLAN.md` §5.11, §7 F7, §8 DP-10; SPEC §5 D11, §7.7.
- **Bloqueios:** `[Bloqueada: DP-10]` — a SPEC D11 é o veículo de resolução

#### T7.2 — Implementar definição e entrada de ranking

- **Fase / Domínio:** F7 / D11
- **Descrição:** Implementar rankings por métrica + escopo (curso, turma, global) + período (ex.: semana), com a métrica declarada na apresentação.
- **Pré-requisitos:** T7.1, T5.3, T4.3.
- **Artefatos esperados:** rankings gerados a partir das métricas existentes; testes de escopo e período.
- **Validação:** métrica claramente declarada; uso apenas de métricas de D6/D7; passo 9 do fluxo executável; funcionalidade 15 verificável.
- **Rastreabilidade:** `PLAN.md` §5.11, §7 F7; SPEC §5 D11, §4 passo 9; funcionalidade 15.
- **Bloqueios:** `[Bloqueada: DP-10]` (empate) + global DP-01–DP-03

#### T7.3 — Implementar cálculo servidor-side, empate e privacidade

- **Fase / Domínio:** F7 / D11
- **Descrição:** Implementar o cálculo do ranking no servidor, com tratamento de empate por regra fixa e privacidade (pseudônimos/ocultar) conforme configuração.
- **Pré-requisitos:** T7.2.
- **Artefatos esperados:** cálculo exclusivo servidor; aplicação da regra de empate; opções de privacidade; testes de empate e de exposição.
- **Validação:** empate tratado por regra fixa; nenhum dado privado exposto; "cálculo servidor-side" verificado.
- **Rastreabilidade:** `PLAN.md` §5.11, §4 princípio 2, §7 F7; SPEC §5 D11.
- **Bloqueios:** `[Bloqueada: DP-10]` + global DP-01–DP-03

#### T7.4 — Validar F7 (D11)

- **Fase / Domínio:** F7 / D11
- **Descrição:** Executar a validação da fase: métrica declarada, escopo/período, empate, privacidade e passo 9.
- **Pré-requisitos:** T7.2, T7.3.
- **Artefatos esperados:** relatório de validação da fase F7.
- **Validação:** todas as regras de D11 cobertas; ausência de dados privados em rankings públicos.
- **Rastreabilidade:** `PLAN.md` §7 F7, §9.
- **Bloqueios:** `[Livre]`

---

## F8 — Economia (recompensas, moedas, loja e inventário)

#### T8.1 — Elaborar SPEC do domínio D12 (economia)

- **Fase / Domínio:** F8 / D12
- **Descrição:** Escrever a SPEC de D12 com catálogo de itens, preços, estoque e efeitos de uso (DP-18), mantendo a economia fechada.
- **Pré-requisitos:** F5 e F6 concluídas; T0.3.
- **Artefatos esperados:** `SPEC/` de D12 com critérios de aceitação e catálogo.
- **Validação:** regras de D12 da visão cobertas; nenhuma moeda real; catálogo presente apenas na SPEC D12.
- **Rastreabilidade:** `PLAN.md` §5.12, §7 F8, §8 DP-18; SPEC §5 D12, §6.
- **Bloqueios:** `[Bloqueada: DP-18]` para catálogo/preços

#### T8.2 — Implementar saldo de moedas virtuais

- **Fase / Domínio:** F8 / D12
- **Descrição:** Implementar o saldo de moedas por estudante, com crédito apenas pelas fontes definidas (conquistas, missões, demais recompensas) e garantia de saldo nunca negativo.
- **Pré-requisitos:** T8.1, T5.6, T6.2.
- **Artefatos esperados:** saldos por estudante; testes de tentativa de saldo negativo rejeitada; testes das fontes de crédito.
- **Validação:** "saldo nunca fica negativo"; nenhuma origem de moeda fora dos mecanismos; funcionalidade 17 verificável.
- **Rastreabilidade:** `PLAN.md` §5.12, §7 F8; SPEC §5 D12, §1; funcionalidades 16, 17.
- **Bloqueios:** `[Depende de SPEC D12]` + global DP-01–DP-03

#### T8.3 — Implementar loja com compra atômica

- **Fase / Domínio:** F8 / D12
- **Descrição:** Implementar a vitrine da loja e a compra com atomicidade (débito do saldo ↔ crédito do item), respeitando preço e estoque configuráveis.
- **Pré-requisitos:** T8.2.
- **Artefatos esperados:** loja navegável; compra atômica com testes de concorrência/falha (débito sem crédito e vice-versa nunca persistem); testes de preço/estoque.
- **Validação:** "compra é atômica"; saldo debitado somente com item creditado; passo 10 executável; funcionalidades 16 e 18 verificáveis.
- **Rastreabilidade:** `PLAN.md` §5.12, §7 F8; SPEC §5 D12, §4 passo 10; funcionalidades 16, 18.
- **Bloqueios:** `[Depende de SPEC D12]` + global DP-01–DP-03

#### T8.4 — Implementar inventário e uso de item

- **Fase / Domínio:** F8 / D12
- **Descrição:** Implementar o inventário do estudante e o uso de item, com não transferibilidade por padrão.
- **Pré-requisitos:** T8.3.
- **Artefatos esperados:** inventário por estudante; fluxo de uso conforme efeito definido na SPEC D12; testes de não transferibilidade.
- **Validação:** "item é não transferível por padrão"; inventário consistente após compra/uso; funcionalidade 19 verificável.
- **Rastreabilidade:** `PLAN.md` §5.12, §7 F8; SPEC §5 D12; funcionalidades 19, 16.
- **Bloqueios:** `[Depende de SPEC D12]` + global DP-01–DP-03

#### T8.5 — Exibir inventário no perfil e conectar recompensas do fluxo

- **Fase / Domínio:** F8 / D12 (+D2)
- **Descrição:** Alimentar a área do perfil (T1.6) com o inventário real e garantir que recompensas de missões/desafios/conquistas entrem na economia sem duplicação.
- **Pré-requisitos:** T8.4, T6.2, T6.4, T5.6, T1.6.
- **Artefatos esperados:** inventário visível no perfil; testes de não duplicação de recompensa entre missões, desafios e conquistas.
- **Validação:** passo 10 executável de ponta a ponta; nenhuma recompensa creditada duas vezes.
- **Rastreabilidade:** `PLAN.md` §5.12, §7 F8; SPEC §4 passo 10.
- **Bloqueios:** `[Livre]` + global DP-01–DP-03

#### T8.6 — Validar F8 (D12)

- **Fase / Domínio:** F8 / D12
- **Descrição:** Executar a validação da fase: atomicidade, saldo não negativo, economia fechada, passo 10 e ausência de qualquer rota de pagamento real.
- **Pré-requisitos:** T8.2–T8.5.
- **Artefatos esperados:** relatório de validação da fase F8.
- **Validação:** regras de D12 cobertas; limite "não é sistema de pagamento" verificado.
- **Rastreabilidade:** `PLAN.md` §7 F8, §9; SPEC §6.
- **Bloqueios:** `[Livre]`

---

## F9 — Notificações

#### T9.1 — Elaborar SPEC do domínio D13 (notificações)

- **Fase / Domínio:** F9 / D13
- **Descrição:** Escrever a SPEC de D13 com a lista de eventos notificáveis, preferências e regras de frequência; registrar que canal de e-mail depende de DP-11.
- **Pré-requisitos:** eventos de F4–F8 existentes; T0.3.
- **Artefatos esperados:** `SPEC/` de D13 com critérios de aceitação.
- **Validação:** regras de D13 da visão cobertas; e-mail marcado como pendência (DP-11), não implementado.
- **Rastreabilidade:** `PLAN.md` §5.13, §7 F9, §8 DP-11; SPEC §5 D13.
- **Bloqueios:** `[Livre]` (in-app); `[Bloqueada: DP-11]` para e-mail

#### T9.2 — Implementar notificações in-app por eventos

- **Fase / Domínio:** F9 / D13
- **Descrição:** Implementar notificações in-app disparadas pelos eventos declarados: missão prestes a expirar, nova conquista, resultado de avaliação, resposta social.
- **Pré-requisitos:** T9.1, T6.2, T5.6, T3.5, T10.4 (pode ser entregue incrementalmente conforme eventos existirem).
- **Artefatos esperados:** notificações criadas nos quatro eventos; testes de disparo e de não-disparo fora da lista.
- **Validação:** "sem envio para eventos não permitidos"; passo 11 executável; funcionalidade 20 verificável.
- **Rastreabilidade:** `PLAN.md` §5.13, §7 F9; SPEC §5 D13, §4 passo 11; funcionalidade 20.
- **Bloqueios:** `[Depende de SPEC D13]` + global DP-01–DP-03

#### T9.3 — Implementar preferências, leitura e frequência

- **Fase / Domínio:** F9 / D13
- **Descrição:** Implementar preferências de notificação por usuário, registro de leitura e respeito à frequência configurada.
- **Pré-requisitos:** T9.2, T1.5.
- **Artefatos esperados:** preferências editáveis pelo usuário; leitura registrada; testes de supressão conforme preferência.
- **Validação:** "usuário controla quais notificações recebe"; "leitura é registrada"; "frequência respeita preferências".
- **Rastreabilidade:** `PLAN.md` §5.13, §7 F9; SPEC §5 D13; funcionalidade 20.
- **Bloqueios:** `[Depende de SPEC D13]` + global DP-01–DP-03

#### T9.4 — Registrar dependência do canal de e-mail (DP-11)

- **Fase / Domínio:** F9 / D13
- **Descrição:** Manter o canal de e-mail opcional como pendência explícita ligada à SPEC de integrações; não implementar integração de envio nesta fase.
- **Pré-requisitos:** T9.1.
- **Artefatos esperados:** registro de dependência DP-11 na documentação da fase.
- **Validação:** nenhum serviço de e-mail integrado; pendência visível para o planejamento futuro.
- **Rastreabilidade:** `PLAN.md` §5.13, §8 DP-11; SPEC §7.9.
- **Bloqueios:** `[Bloqueada: DP-11]`

#### T9.5 — Validar F9 (D13)

- **Fase / Domínio:** F9 / D13
- **Descrição:** Executar a validação da fase: disparo por evento, preferências, leitura, frequência e passo 11.
- **Pré-requisitos:** T9.2, T9.3.
- **Artefatos esperados:** relatório de validação da fase F9.
- **Validação:** todas as regras de D13 cobertas; nenhum envio fora das preferências.
- **Rastreabilidade:** `PLAN.md` §7 F9, §9.
- **Bloqueios:** `[Livre]`

---

## F10 — Recursos sociais

#### T10.1 — Elaborar SPEC do domínio D14 (recursos sociais)

- **Fase / Domínio:** F10 / D14
- **Descrição:** Escrever a SPEC de D14 definindo o formato das relações (amizade ou seguimento), tipos de interação permitidos e fluxo de denúncia/moderação.
- **Pré-requisitos:** F1 e F2 concluídas; T0.3.
- **Artefatos esperados:** `SPEC/` de D14 com critérios de aceitação.
- **Validação:** regras de D14 da visão cobertas; formato detalhado presente apenas na SPEC D14.
- **Rastreabilidade:** `PLAN.md` §5.14, §7 F10; SPEC §5 D14.
- **Bloqueios:** `[Livre]`

#### T10.2 — Implementar visibilidade pública permitida em perfis

- **Fase / Domínio:** F10 / D14 (+D2)
- **Descrição:** Expor nos perfis apenas os dados permitidos como públicos, preservando a privacidade de e-mail e notas.
- **Pré-requisitos:** T10.1, T1.5.
- **Artefatos esperados:** perfis públicos com campos permitidos; testes de ausência de dados privados.
- **Validação:** "apenas dados permitidos são públicos"; nenhum dado privado exposto.
- **Rastreabilidade:** `PLAN.md` §5.14, §5.2, §7 F10; SPEC §5 D14, D2, §4 passo 12.
- **Bloqueios:** `[Depende de SPEC D14]` + global DP-01–DP-03

#### T10.3 — Implementar relação social (amizade ou seguimento)

- **Fase / Domínio:** F10 / D14
- **Descrição:** Implementar a relação social entre estudantes no formato definido na SPEC D14.
- **Pré-requisitos:** T10.2.
- **Artefatos esperados:** criação/aceite/remoção de relação; testes de simetria conforme regra da SPEC.
- **Validação:** relação social funcional dentro do permitido; passo 12 executável; funcionalidade 21 verificável.
- **Rastreabilidade:** `PLAN.md` §5.14, §7 F10; SPEC §5 D14, §4 passo 12; funcionalidade 21.
- **Bloqueios:** `[Depende de SPEC D14]` + global DP-01–DP-03

#### T10.4 — Implementar interações permitidas com denúncia e moderação

- **Fase / Domínio:** F10 / D14
- **Descrição:** Implementar interações (comentários/curtidas ou equivalentes definidos na SPEC) sobre conteúdo permitido, com denúncia, ocultação e remoção.
- **Pré-requisitos:** T10.3, T2.5 (conteúdo alvo).
- **Artefatos esperados:** interações publicadas; fluxo de denúncia; ações de ocultar/remover; testes de remoção e de alvo permitido.
- **Validação:** "toda interação é moderável"; nenhum alvo fora do conteúdo permitido; passo 12 executável; funcionalidade 21 verificável.
- **Rastreabilidade:** `PLAN.md` §5.14, §7 F10; SPEC §5 D14, §4 passo 12; funcionalidade 21.
- **Bloqueios:** `[Depende de SPEC D14]` + global DP-01–DP-03

#### T10.5 — Implementar bloqueio de spam/abuso por administrador

- **Fase / Domínio:** F10 / D14 (+D17)
- **Descrição:** Disponibilizar ao administrador o bloqueio de contas por spam/abuso, ligando a moderação social à administração.
- **Pré-requisitos:** T10.4, T1.4.
- **Artefatos esperados:** ação de bloqueio restrita ao administrador; testes de negação a outros papéis.
- **Validação:** "spam/abuso são bloqueáveis por admin"; ação registrada para auditoria (F13).
- **Rastreabilidade:** `PLAN.md` §5.14, §5.17, §7 F10; SPEC §5 D14.
- **Bloqueios:** `[Depende de SPEC D14]` + global DP-01–DP-03

#### T10.6 — Validar F10 (D14)

- **Fase / Domínio:** F10 / D14
- **Descrição:** Executar a validação da fase: visibilidade, relações, interações, moderação, passo 12 e fronteira "não é rede social livre".
- **Pré-requisitos:** T10.2–T10.5.
- **Artefatos esperados:** relatório de validação da fase F10.
- **Validação:** moderabilidade total comprovada; nenhuma funcionalidade fora do escopo social mínimo da visão.
- **Rastreabilidade:** `PLAN.md` §7 F10, §9; SPEC §6.
- **Bloqueios:** `[Livre]`

---

## F11 — Analytics

#### T11.1 — Elaborar SPEC do domínio D15 (analytics)

- **Fase / Domínio:** F11 / D15
- **Descrição:** Escrever a SPEC de D15 com métricas e relatórios para professor (turma, curso, questão) e administrador (plataforma); registrar que o persona P4 e seus relatórios dependem de DP-17.
- **Pré-requisitos:** eventos de F2–F8 e F10; T0.3.
- **Artefatos esperados:** `SPEC/` de D15 com critérios de aceitação; lista de métricas.
- **Validação:** regras de D15 da visão cobertas; P4 marcado como pendência (DP-17).
- **Rastreabilidade:** `PLAN.md` §5.15, §7 F11, §8 DP-17; SPEC §5 D15, §3 P4.
- **Bloqueios:** `[Livre]` (professor/admin); `[Bloqueada: DP-17]` para P4

#### T11.2 — Implementar métricas e relatórios do professor

- **Fase / Domínio:** F11 / D15
- **Descrição:** Implementar métricas/relatórios por turma, curso e questão, restritos à turma do próprio professor.
- **Pré-requisitos:** T11.1, T1.4.
- **Artefatos esperados:** relatórios por turma/curso/questão; testes de isolamento entre professores.
- **Validação:** "professor vê apenas a própria turma"; funcionalidade 22 verificável.
- **Rastreabilidade:** `PLAN.md` §5.15, §7 F11; SPEC §5 D15, §2 item 4, §3 P2; funcionalidade 22.
- **Bloqueios:** `[Depende de SPEC D15]` + global DP-01–DP-03

#### T11.3 — Implementar métricas de plataforma para o administrador

- **Fase / Domínio:** F11 / D15 (+D17)
- **Descrição:** Implementar métricas agregadas de uso da plataforma acessíveis somente ao administrador.
- **Pré-requisitos:** T11.2, T1.4.
- **Artefatos esperados:** visão de plataforma para admin; testes de acesso restrito.
- **Validação:** administrador acompanha métricas de uso; outros papéis negados; funcionalidade 22 verificável.
- **Rastreabilidade:** `PLAN.md` §5.15, §5.17, §7 F11; SPEC §3 P3; funcionalidade 22.
- **Bloqueios:** `[Depende de SPEC D15]` + global DP-01–DP-03

#### T11.4 — Garantir fonte única de eventos e não exposição indevida

- **Fase / Domínio:** F11 / D15
- **Descrição:** Alimentar analytics exclusivamente dos mesmos eventos de progresso/gamificação já existentes e impedir exposição de indivíduo em agregados sem permissão.
- **Pré-requisitos:** T11.2.
- **Artefatos esperados:** métricas derivadas dos eventos de D6–D11/D14; testes de privacidade de agregados.
- **Validação:** "métricas derivam dos mesmos eventos (fonte única)"; "agregados não expõem indivíduo sem permissão".
- **Rastreabilidade:** `PLAN.md` §5.15, §6 item 13, §7 F11; SPEC §5 D15.
- **Bloqueios:** `[Depende de SPEC D15]` + global DP-01–DP-03

#### T11.5 — Registrar dependência dos relatórios de P4 (DP-17)

- **Fase / Domínio:** F11 / D15
- **Descrição:** Manter relatórios do persona observador/analista como pendência vinculada à SPEC de analytics; não implementá-los nesta fase.
- **Pré-requisitos:** T11.1.
- **Artefatos esperados:** registro de dependência DP-17 na documentação da fase.
- **Validação:** nenhum relatório de P4 implementado; pendência visível.
- **Rastreabilidade:** `PLAN.md` §5.15, §8 DP-17; SPEC §3 P4.
- **Bloqueios:** `[Bloqueada: DP-17]`

#### T11.6 — Validar F11 (D15)

- **Fase / Domínio:** F11 / D15
- **Descrição:** Executar a validação da fase: isolamento do professor, métricas de plataforma, fonte única e privacidade de agregados.
- **Pré-requisitos:** T11.2–T11.4.
- **Artefatos esperados:** relatório de validação da fase F11.
- **Validação:** todas as regras de D15 cobertas; nenhum dado de turma alheia acessível.
- **Rastreabilidade:** `PLAN.md` §7 F11, §9.
- **Bloqueios:** `[Livre]`

---

## F12 — Certificados

#### T12.1 — Elaborar SPEC do domínio D16 (certificados)

- **Fase / Domínio:** F12 / D16
- **Descrição:** Escrever a SPEC de D16 com requisitos de emissão, modelo de certificado e formato do código de verificação.
- **Pré-requisitos:** F4, F3, F2 concluídas; T0.3.
- **Artefatos esperados:** `SPEC/` de D16 com critérios de aceitação.
- **Validação:** regras de D16 da visão cobertas; modelo/formato definidos apenas na SPEC D16.
- **Rastreabilidade:** `PLAN.md` §5.16, §7 F12; SPEC §5 D16.
- **Bloqueios:** `[Livre]`

#### T12.2 — Implementar requisitos de emissão configuráveis

- **Fase / Domínio:** F12 / D16
- **Descrição:** Implementar a verificação dos requisitos de emissão (percentual mínimo do curso e nota mínima, quando exigida), configurados por professor/administrador.
- **Pré-requisitos:** T12.1, T4.3, T3.5.
- **Artefatos esperados:** configuração de requisitos por curso; verificação automática contra progresso/nota; testes de emissão negada quando requisito não cumprido.
- **Validação:** "requisitos definidos pelo professor/admin"; progresso e nota lidos da fonte única (D6/D5).
- **Rastreabilidade:** `PLAN.md` §5.16, §7 F12; SPEC §5 D16, §4 passo 13; funcionalidade 23.
- **Bloqueios:** `[Depende de SPEC D16]` + global DP-01–DP-03

#### T12.3 — Implementar emissão única, código de verificação e imutabilidade

- **Fase / Domínio:** F12 / D16
- **Descrição:** Implementar a emissão do certificado com uma única emissão por estudante por curso, código de verificação e imutabilidade dos dados após emissão.
- **Pré-requisitos:** T12.2.
- **Artefatos esperados:** certificado emitível uma vez; verificação por código; testes de segunda tentativa e de dados inalteráveis.
- **Validação:** "emissão única por estudante por curso"; "verificável por código"; "dados imutáveis após emissão"; passo 13 executável; funcionalidade 23 verificável.
- **Rastreabilidade:** `PLAN.md` §5.16, §7 F12; SPEC §5 D16, §4 passo 13, §6; funcionalidade 23.
- **Bloqueios:** `[Depende de SPEC D16]` + global DP-01–DP-03

#### T12.4 — Validar F12 (D16)

- **Fase / Domínio:** F12 / D16
- **Descrição:** Executar a validação da fase: requisitos, unicidade, verificabilidade, imutabilidade e passo 13.
- **Pré-requisitos:** T12.2, T12.3.
- **Artefatos esperados:** relatório de validação da fase F12.
- **Validação:** todas as regras de D16 cobertas; certificado derivado de D6/D5 sem divergência.
- **Rastreabilidade:** `PLAN.md` §7 F12, §9.
- **Bloqueios:** `[Livre]`

---

## F13 — Administração

#### T13.1 — Elaborar SPEC do domínio D17 (administração)

- **Fase / Domínio:** F13 / D17
- **Descrição:** Escrever a SPEC de D17 com o escopo do painel, fluxos de moderação, configuração global e requisitos de auditoria.
- **Pré-requisitos:** F1, F10, F5, F11 concluídas; T0.3.
- **Artefatos esperados:** `SPEC/` de D17 com critérios de aceitação.
- **Validação:** regras de D17 da visão cobertas; escopo do painel presente apenas na SPEC D17.
- **Rastreabilidade:** `PLAN.md` §5.17, §7 F13; SPEC §5 D17.
- **Bloqueios:** `[Livre]`

#### T13.2 — Implementar gestão de usuários e papéis

- **Fase / Domínio:** F13 / D17
- **Descrição:** Completar a gestão administrativa de contas e papéis (listagem, alteração de papel, suspensão), sobre a base entregue em F1.
- **Pré-requisitos:** T13.1, T1.4.
- **Artefatos esperados:** painel de usuários restrito ao administrador; testes de acesso e de alteração de papel.
- **Validação:** "apenas admin acessa"; funcionalidade 24 verificável.
- **Rastreabilidade:** `PLAN.md` §5.17, §7 F13; SPEC §5 D17, §3 P3; funcionalidade 24.
- **Bloqueios:** `[Depende de SPEC D17]` + global DP-01–DP-03

#### T13.3 — Implementar moderação com auditoria

- **Fase / Domínio:** F13 / D17 (+D14)
- **Descrição:** Implementar o atendimento a denúncias (ocultar, remover, bloquear) com registro auditável das ações destrutivas.
- **Pré-requisitos:** T13.2, T10.5.
- **Artefatos esperados:** fila de denúncias; ações de moderação; trilha de auditoria das ações; testes de registro.
- **Validação:** "ações destrutivas são auditáveis"; toda denúncia tratável; funcionalidade 24 verificável.
- **Rastreabilidade:** `PLAN.md` §5.17, §7 F13; SPEC §5 D17, D14, §3 P3; funcionalidade 24.
- **Bloqueios:** `[Depende de SPEC D17]` + global DP-01–DP-03

#### T13.4 — Implementar configuração global de gamificação

- **Fase / Domínio:** F13 / D17 (+D7)
- **Descrição:** Implementar a configuração global de parâmetros de gamificação, garantindo que alterações não reescrevam conquistas já desbloqueadas.
- **Pré-requisitos:** T13.2, T5.4, T5.6.
- **Artefatos esperados:** parâmetros globais editáveis pelo administrador; testes de que conquistas passadas permanecem intactas após alteração.
- **Validação:** "alteração de parâmetros não altera conquistas já desbloqueadas"; administrador ajusta regras sem afetar histórico; funcionalidade 24 verificável.
- **Rastreabilidade:** `PLAN.md` §5.17, §7 F13; SPEC §5 D17, §3 P3; funcionalidade 24.
- **Bloqueios:** `[Depende de SPEC D17]` + `[Bloqueada: DP-07]` para os parâmetros de XP/níveis + global DP-01–DP-03

#### T13.5 — Disponibilizar analytics de plataforma na administração

- **Fase / Domínio:** F13 / D17 (+D15)
- **Descrição:** Integrar ao painel administrativo as métricas de plataforma entregues em F11.
- **Pré-requisitos:** T13.2, T11.3.
- **Artefatos esperados:** visão de plataforma no painel; testes de acesso restrito.
- **Validação:** administrador lê métricas de uso; nenhum dado exposto a papéis não autorizados; funcionalidade 24 verificável.
- **Rastreabilidade:** `PLAN.md` §5.17, §5.15, §7 F13; SPEC §3 P3; funcionalidade 24.
- **Bloqueios:** `[Livre]` + global DP-01–DP-03

#### T13.6 — Validar F13 (D17) e fluxo administrador

- **Fase / Domínio:** F13 / D17
- **Descrição:** Executar a validação da fase: acesso exclusivo, auditoria, configuração global, métricas e o fluxo secundário do administrador (autenticação → gestão → moderação → configuração → leitura de analytics).
- **Pré-requisitos:** T13.2–T13.5.
- **Artefatos esperados:** relatório de validação da fase F13.
- **Validação:** todas as regras de D17 cobertas; fluxo do administrador percorrido; funcionalidade 24 verificável.
- **Rastreabilidade:** `PLAN.md` §7 F13, §9; SPEC §4 fluxos secundários.
- **Bloqueios:** `[Livre]`

---

## Verificação final (checklist desta etapa)

| Verificação exigida pelo prompt | Resultado |
|---|---|
| Todos os domínios D1–D17 aparecem? | **Sim** — D1 (T1.1–T1.4), D2 (T1.5–T1.7), D3 (T2.1–T2.6), D4/D5 (T3.1–T3.6), D6 (T4.1–T4.5), D7/D8 (T5.1–T5.7), D9/D10 (T6.1–T6.6), D11 (T7.1–T7.4), D12 (T8.1–T8.6), D13 (T9.1–T9.5), D14 (T10.1–T10.6), D15 (T11.1–T11.6), D16 (T12.1–T12.4), D17 (T13.1–T13.6). |
| Todas as 24 funcionalidades rastreáveis? | **Sim** — tabela "24 funcionalidades → tarefa(s)" nesta introdução (todas as 24 mapeadas). |
| Alguma decisão pendente foi resolvida? | **Não** — DP-01–DP-19 apenas referenciadas como bloqueios; DP-12–DP-16 tratadas como fora de escopo/dependentes de SPEC própria, sem tarefa que as resolva. |
| Alguma tecnologia foi escolhida? | **Sim? Não** — nenhuma: busca por nomes de linguagens/frameworks/bancos neste arquivo retorna 0 ocorrências; nenhum contrato de API ou modelo físico definido. |
| Alguma implementação foi realizada? | **Não** — apenas artefatos de processo; `src/` e `tests/` permanecem vazios; nenhum arquivo além deste `TASKS.md` foi criado ou alterado. |
| Fórmulas de XP/níveis, tipos de questão, regras de ranking definidos? | **Não** — todos remetidos às SPECs D7, D4 e D11 (DP-07, DP-08, DP-10). |
| Rastreabilidade por tarefa? | **Sim** — toda tarefa declara fase, domínio, referência ao `PLAN.md` e à SPEC, e bloqueios. |
| Dependências entre fases preservadas? | **Sim** — pré-requisito global de fase idêntico ao `PLAN.md` §7. |

**Conclusão:** `TASKS.md` está apto para a etapa de implementação, respeitando as pendências registradas em `PLAN.md` §8.
