# PLAN — EduQuest

| Campo | Valor |
|---|---|
| Artefato | `PLAN.md` (2ª etapa do processo SDD) |
| Fonte única de requisitos | `SPEC/2026-09-30-visao-geral.md` (aprovada) |
| Processo | SPEC → PLAN → TASKS → implementação → testes → revisão |
| Próxima etapa | `TASKS.md` derivado exclusivamente deste PLAN |
| Restrições ativas desta etapa | Sem código, sem TASKS.md, sem stack tecnológica, sem contratos de API, sem modelo de dados físico, sem fórmulas de XP/níveis, sem alterar a SPEC |

---

## 1. Objetivo

Transformar a visão geral da SPEC em um plano de implementação executável para o EduQuest, organizando:

1. objetivos da implementação;
2. escopo herdado da SPEC;
3. decomposição dos domínios D1–D17;
4. dependências entre domínios;
5. ordem lógica de implementação;
6. fases de execução;
7. artefatos esperados em cada fase;
8. estratégia de validação;
9. decisões que ainda dependem de SPECs específicas;
10. critérios para considerar o plano concluído.

O PLAN **não** redefine requisitos: todo requisito funcional aqui listado é citação ou reorganização da SPEC. Toda decisão não tomada pela SPEC aparece como **decisão pendente** ou **dependência de SPEC futura** (Seção 8), nunca como escolha resolvida.

**Objetivos de implementação (derivados da SPEC §1, §2 e §4):**

- **O1** — Permitir que estudantes se cadastrem, se autentiquem e acessem perfis (fluxo passos 1–2).
- **O2** — Disponibilizar a camada de ensino: cursos, módulos, aulas, exercícios, questões e avaliações, autorada por professores (passos 3–6).
- **O3** — Registrar e expor progresso acadêmico como fonte única de verdade (passo 7).
- **O4** — Executar a camada de gamificação (XP, níveis, conquistas, missões, desafios, rankings, recompensas, moedas, loja, inventário) 100% no servidor, a partir de ações verificadas (passos 8–10; "regra de ouro" da SPEC §4).
- **O5** — Sustentar o engajamento com notificações e recursos sociais moderados (passos 11–12).
- **O6** — Entregar certificados verificáveis e analytics para professor/administrador (passos 13; fluxos secundários da SPEC §4).
- **O7** — Disponibilizar administração de usuários, papéis, moderação e configuração global (fluxo administrador da SPEC §4).

---

## 2. Fonte e rastreabilidade

**Fonte única:** `SPEC/2026-09-30-visao-geral.md`. Nenhum outro documento, prompt ou pressuposto externo é fonte de requisitos deste PLAN.

**Mapa SPEC → PLAN:**

| Seção da SPEC | Onde aparece no PLAN |
|---|---|
| §1 O que é o EduQuest (definições-chave) | §3 (escopo), §5 (vocabulário por domínio) |
| §2 Problema | §1 (objetivos O1–O7 refletem os problemas endereçados) |
| §3 Personas P1–P4 | §3 (escopo por papel), §7 (quem valida cada fase) |
| §4 Fluxo principal (14 passos) + fluxos secundários + regra de ouro | §4 (princípios), §7 (ordem das fases) |
| §5 Domínios D1–D17 (escopo, entidades, regras) | §5 (5.1–5.17), §6 (dependências), §7 (fases) |
| §6 Limites do sistema | §3 (dentro/fora), §11 (limites) |
| §7 Fora do escopo (14 itens) | §8 (decisões pendentes), §11 (não definidos) |
| §8 AC-01–AC-13 (aprovação da SPEC) | §10 (conclusão do PLAN) e §12 (autoverificação) |

**Mapa domínio → seção do PLAN → fase:**

| Domínio (SPEC §5) | Seção do PLAN | Fase |
|---|---|---|
| D1 Identidade e acesso | 5.1 | F1 |
| D2 Perfis | 5.2 | F1 |
| D3 Catálogo de aprendizagem | 5.3 | F2 |
| D4 Exercícios e questões | 5.4 | F3 |
| D5 Avaliações | 5.5 | F3 |
| D6 Progresso acadêmico | 5.6 | F4 |
| D7 Gamificação: XP e níveis | 5.7 | F5 |
| D8 Gamificação: conquistas | 5.8 | F5 |
| D9 Gamificação: missões | 5.9 | F6 |
| D10 Gamificação: desafios | 5.10 | F6 |
| D11 Rankings | 5.11 | F7 |
| D12 Recompensas, moedas, loja e inventário | 5.12 | F8 |
| D13 Notificações | 5.13 | F9 |
| D14 Recursos sociais | 5.14 | F10 |
| D15 Analytics | 5.15 | F11 |
| D16 Certificados | 5.16 | F12 |
| D17 Administração | 5.17 | F13 (base parcial em F1) |

**Mapa das 24 funcionalidades (SPEC §5, "Mapeamento obrigatório") → domínio → fase:**

| # | Funcionalidade | Domínio | Fase |
|---|---|---|---|
| 1 | cadastro e autenticação | D1 | F1 |
| 2 | perfis | D2 | F1 |
| 3 | cursos | D3 | F2 |
| 4 | módulos | D3 | F2 |
| 5 | aulas | D3 | F2 |
| 6 | exercícios | D4 | F3 |
| 7 | questões | D4 | F3 |
| 8 | avaliações | D5 | F3 |
| 9 | progresso acadêmico | D6 | F4 |
| 10 | XP | D7 | F5 |
| 11 | níveis | D7 | F5 |
| 12 | conquistas | D8 | F5 |
| 13 | missões | D9 | F6 |
| 14 | desafios | D10 | F6 |
| 15 | rankings | D11 | F7 |
| 16 | recompensas | D12 (também D9) | F8 |
| 17 | moedas virtuais | D12 | F8 |
| 18 | loja | D12 | F8 |
| 19 | inventário | D12 | F8 |
| 20 | notificações | D13 | F9 |
| 21 | recursos sociais | D14 | F10 |
| 22 | analytics | D15 | F11 |
| 23 | certificados | D16 | F12 |
| 24 | administração | D17 | F13 (base em F1) |

---

## 3. Escopo herdado da SPEC

**Dentro do escopo (SPEC §6 — "Dentro dos limites"):**

- Plataforma web responsiva (desktop e mobile), acessada via navegador.
- Três papéis fixos: estudante, professor, administrador.
- Conteúdo autoral dentro da plataforma, na hierarquia curso > módulo > aula.
- Execução e correção automática de questões; correção de dissertativas conforme regra definida em SPEC própria.
- Gamificação calculada no servidor, a partir de ações verificadas (cliente apenas exibe).
- Economia interna fechada (moedas e itens apenas dentro da plataforma).
- Persistência própria dos dados (contas, conteúdo, progresso, gamificação).
- Analytics derivado dos eventos gerados pela própria plataforma.
- Certificados com verificação por código próprio.

**Fora do escopo (SPEC §6 fronteiras + §7 — resumo; detalhamento na Seção 11):**

- Sem host de vídeo próprio (apenas embed externo); sem pagamentos ou moedas reais; sem app nativo; sem videoconferência/aula ao vivo; sem LTI/SCORM; sem rede social livre; sem autoria de conteúdo pela plataforma; sem gamificação sem atividade de aprendizagem correspondente.
- Sem stack, modelo de dados físico, contratos de API, NFRs quantificados, design de UI/UX, acessibilidade/i18n detalhadas, integrações externas, multi-tenancy, IA/LLM, testes de carga/backup e aspectos legais completos.

**Escopo por papel (SPEC §3):**

- **P1 Estudante (primária):** consome conteúdo; executa exercícios/avaliações; vê próprio progresso, perfil, inventário, loja, rankings e notificações; publica em recursos sociais dentro da moderação. Não edita cursos; não vê dados privados além do que rankings/social permitem.
- **P2 Professor:** CRUD dos próprios cursos/conteúdo; publica e corrige avaliações; lê analytics e progresso da própria turma; configura gamificação do próprio escopo. Não edita cursos de outros; não altera dados globais; não manipula XP/moedas fora dos mecanismos definidos (salvo administração delegada).
- **P3 Administrador:** usuários, papéis, moderação, configuração global de gamificação, analytics de plataforma. Não autoria pedagógica.
- **P4 Observador/analista:** mencionado; requisitos ficam para SPEC de analytics.

---

## 4. Princípios e restrições

1. **Derivação estrita** — todo requisito do PLAN remete à SPEC (Seção 2). Requisito novo = erro; requisito faltante = pendência registrada na Seção 8.
2. **Regra de ouro (SPEC §4)** — toda recompensa (XP, nível, conquista, moeda, item) é calculada pelo servidor a partir de ações verificadas; o cliente apenas exibe. Aplica-se transversalmente a todas as fases.
3. **Fronteiras preservadas** — decisão explicitamente fora da SPEC ou marcada "a confirmar" permanece pendente; não é preenchida por hipótese.
4. **Sem stack** — linguagem, framework, banco de dados e infraestrutura **não** são escolhidos neste PLAN (restrição do prompt que originou este artefato; a SPEC §7.1 até admite delegar a escolha ao PLAN, mas a restrição vigente desta etapa prevalece e a escolha fica registrada como decisão pendente — ver Seção 8).
5. **Sem artefatos proibidos** — este PLAN não contém código, contratos de API, modelo de dados físico, fórmulas de XP/níveis, tipos definitivos de questões ou regras detalhadas de ranking.
6. **Gamificação não substitui aprendizado** — nenhuma fase pode conceder progresso acadêmico sem atividade de aprendizagem correspondente (SPEC §6, "Não é um jogo").
7. **Privacidade por padrão** — dados privados (e-mail, notas) nunca públicos; acessos determinados por papel (SPEC D1, D2, D11, D14, D15).
8. **Progresso monotônico** — percentuais crescentes por curso, exceto reset explícito; nível nunca diminui; conquista nunca duplica (SPEC D6, D7, D8).
9. **Ordem por dependência** — fases seguem as dependências lógicas da Seção 6; ordem de implementação é decisão do PLAN permitida pela SPEC (§7.8 delega roadmap/ordem ao PLAN/TASKS).
10. **Derivabilidade** — cada fase deve ser passível de decomposição em `TASKS.md` sem inventar requisitos: basta expandir escopo/entidades/regras já declarados.

---

## 5. Decomposição do sistema

Cada subseção declara: **escopo de implementação**, **entidades** (herdadas da SPEC), **regras a preservar** (herdadas da SPEC), **dependências** e **pendências** (decisões remetidas a SPEC futura). Nenhuma entidade ou regra lista aqui é nova em relação à SPEC.

### 5.1 Identidade e acesso (D1)

- **Escopo de implementação:** cadastro, login, logout, sessão, recuperação de senha, papéis e permissões.
- **Entidades:** usuário, credencial, sessão, papel (estudante, professor, administrador).
- **Regras a preservar:** e-mail/credencial únicos; senha protegida; sessão expira; acesso determinado por papel; sem login não há ação de estudante.
- **Dependências:** nenhuma (é a base do sistema).
- **Pendências:** mecanismo técnico de sessão/autenticação é decisão de SPEC técnica (SPEC §7.3); nada de API é definido aqui.

### 5.2 Perfis (D2)

- **Escopo de implementação:** perfil de estudante e de professor; informações visíveis; exibição de nível, conquistas e inventário.
- **Entidades:** perfil de estudante, perfil de professor, preferências, visibilidade.
- **Regras a preservar:** estudante edita apenas o próprio perfil; dados privados (e-mail, notas) nunca públicos; professor pode ter bio pública.
- **Dependências:** D1 (conta e papel); exibição de nível/conquistas/inventário depende de D7, D8, D12 (pode ser entregue com dados vazios até lá).
- **Pendências:** definição de quais campos são públicos em detalhe — SPEC de perfis.

### 5.3 Catálogo de aprendizagem (D3)

- **Escopo de implementação:** criação, organização e consumo de cursos → módulos → aulas, incluindo conteúdo de aula (texto, mídia embedada, material anexo) e estado de publicação.
- **Entidades:** curso, módulo, aula, conteúdo de aula, publicação.
- **Regras a preservar:** hierarquia fixa curso > módulo > aula; apenas professor dono (ou admin) edita; aula só é consumível quando publicada; conclusão de aula registrada por estudante.
- **Dependências:** D1/D2 (autor e consumo autenticado); conclusão de aula alimenta D6 e D7.
- **Pendências:** ~~formato exato de conteúdo/mídia e limites de upload — SPEC de conteúdo~~ **resolvida (DP-19, 2026-09-30 — `SPEC/2026-09-30-conteudo-aula.md`)**; embed de vídeo externo é limite fixo (SPEC §6); pendências derivadas P-18–P-21 (provedores de embed, expurgo de órfãos, texto enriquecido, revisão de limites) seguem abertas naquela SPEC.

### 5.4 Exercícios e questões (D4)

- **Escopo de implementação:** questões, gabarito, tentativas de exercício e feedback imediato.
- **Entidades:** questão (tipos **a confirmar em SPEC própria**), alternativa, tentativa, resposta, feedback.
- **Regras a preservar:** questão pertence a um curso/módulo; tentativa registrada com resposta e acerto; gabarito não exposto antes do envio; feedback emitido conforme regra da questão.
- **Dependências:** D3 (questão vive em curso/módulo); alimenta D6 (progresso) e D7 (XP por acerto).
- **Pendências (explícitas na SPEC):** conjunto definitivo de tipos de questão está "a confirmar em SPEC própria" (SPEC D4); tipos citados na SPEC são exemplos, não requisito fechado.

### 5.5 Avaliações (D5)

- **Escopo de implementação:** avaliações compostas por questões; regras de tentativa; prazo; nota e resultado.
- **Entidades:** avaliação, composição (questões), tentativa de avaliação, nota, prazo.
- **Regras a preservar:** professor define número de tentativas e janela; nota calculada no servidor; resultado atualiza progresso acadêmico.
- **Dependências:** D4 (composição); D6 (atualiza progresso); D7 (pode conceder XP/recompensa — SPEC §4 passo 6).
- **Pendências (explícitas na SPEC):** correção manual de dissertativas está "a confirmar em SPEC própria" (SPEC D5); SPEC §6 remete a correção de dissertativas a SPEC própria.

### 5.6 Progresso acadêmico (D6)

- **Escopo de implementação:** registro e agregação do avance do estudante; estatísticas pessoais; consolidação em métricas (%, módulos concluídos, cursos em andamento/concluídos — SPEC §4 passo 7).
- **Entidades:** progresso de aula, de módulo, de curso; estatísticas pessoais.
- **Regras a preservar:** progresso deriva de conclusões registradas; percentuais monotonicamente crescentes por curso (exceto reset explícito do professor/admin); fonte única de verdade para rankings (D11) e certificados (D16).
- **Dependências:** D3, D4, D5 (eventos de conclusão/resultado).
- **Pendências:** fórmula exata de percentual por módulo/curso — SPEC de progresso.

### 5.7 Gamificação: XP e níveis (D7)

- **Escopo de implementação:** concessão de XP por ações verificadas e tradução de XP acumulado em níveis; separação entre XP total e XP do período.
- **Entidades:** regra de XP, evento de XP, saldo de XP, faixa de nível.
- **Regras a preservar:** XP concedido apenas por ações verificadas; configuração de XP ajustável por escopo (global do professor/admin); nível monotônico (nunca diminui); XP total ≠ XP do período.
- **Dependências:** ações de D3–D6 (alvo da concessão); D17 (configuração global); alimenta D11 (métrica de ranking) e D2 (exibição de nível).
- **Pendências (explícitas na SPEC):** fórmula exata de XP, fórmula de níveis e tabela de níveis estão fora da SPEC de visão geral (SPEC §7.7) — **não definidas neste PLAN**.
- **Restrições herdadas:** XP não pode ser comprado nem transferido (SPEC §1).

### 5.8 Gamificação: conquistas (D8)

- **Escopo de implementação:** definição, avaliação e desbloqueio permanente de conquistas.
- **Entidades:** conquista, critério, desbloqueio.
- **Regras a preservar:** desbloqueio permanente e idempotente (nunca duplica); critérios avaliados por eventos de progresso/gamificação; alteração de parâmetros globais não altera conquistas já desbloqueadas (SPEC D17).
- **Dependências:** eventos de D6/D7; alimenta D12 (conquistas pagam moedas/recompensas — SPEC §1) e D13 (notificação de nova conquista — SPEC §4 passo 11).
- **Pendências:** catálogo inicial de conquistas e critérios — SPEC de conquistas.

### 5.9 Gamificação: missões (D9)

- **Escopo de implementação:** objetivos com janela de cumprimento e recompensa.
- **Entidades:** missão, critério de cumprimento, progresso de missão, recompensa da missão.
- **Regras a preservar:** missão tem início e fim; progresso rastreado; recompensa paga uma única vez ao cumprir; missão expirada não paga.
- **Dependências:** eventos de D6/D7 (critérios); D12 (paga recompensa); D13 (missão prestes a expirar — SPEC §4 passo 11); D17 (configuração; professor configura gamificação do próprio escopo — SPEC P2).
- **Pendências:** tipos de missão e tabela de recompensas — SPEC de missões.

### 5.10 Gamificação: desafios (D10)

- **Escopo de implementação:** atividades competitivas/de alta dificuldade com classificação e recompensa diferenciada.
- **Entidades:** desafio, participante, resultado do desafio.
- **Regras a preservar:** desafio tem regras próprias (prazo, pontuação); gera colocação; recompensa por colocação conforme configuração.
- **Dependências:** D4/D5 (questões/avaliações como material); D7 (pontuação/XP); D12 (recompensa); D17 (configuração por escopo).
- **Pendências:** mecânica exata de pontuação e prêmios — SPEC de desafios.

### 5.11 Rankings (D11)

- **Escopo de implementação:** ordenação de estudantes por métrica, escopo (curso, turma, global) e período (ex.: semana).
- **Entidades:** definição de ranking (métrica + escopo + período), entrada de ranking.
- **Regras a preservar:** métrica claramente declarada; empates tratados por regra fixa; respeito a privacidade (pseudônimos/ocultar conforme configuração); cálculo servidor-side.
- **Dependências:** métricas de D7 (XP/período), D6 (progresso), níveis; D17 (configuração de privacidade); D2 (exibição).
- **Pendências (explícitas na SPEC):** regras detalhadas de ranking (incluindo empate) estão fora da visão geral (SPEC §7.7) — **não definidas neste PLAN**.

### 5.12 Recompensas, moedas, loja e inventário (D12)

- **Escopo de implementação:** economia interna — ganho de moedas, compra na loja, posse e uso de itens.
- **Entidades:** moeda (saldo), item de loja, compra, inventário, uso de item.
- **Regras a preservar:** saldo nunca negativo; compra atômica (débito ↔ crédito); item não transferível por padrão; estoque/preço configuráveis; recompensas podem ser moedas, XP bônus ou itens.
- **Dependências:** D8/D9 (fontes de moeda/recompensa — SPEC §1, §4 passos 8 e 10); D2 (inventário exibido no perfil); D13 (notificação de compra/conquista — se permitido pelas preferências).
- **Restrição herdada:** economia fechada; sem compra com dinheiro real (SPEC §6).
- **Pendências:** catálogo de itens, preços e efeitos de uso — SPEC da loja/economia.

### 5.13 Notificações (D13)

- **Escopo de implementação:** notificações in-app (e-mail opcional) disparadas por eventos; preferências do usuário.
- **Entidades:** notificação, preferência de notificação, evento disparador.
- **Regras a preservar:** usuário controla quais notificações recebe; sem envio para eventos não permitidos; leitura registrada; frequência respeita preferências.
- **Dependências:** D1 (destinatário autenticado); eventos de D6–D12 e interações sociais (SPEC §4 passo 11 lista: missão a expirar, nova conquista, resultado de avaliação, resposta social).
- **Pendências:** canal de e-mail é integração externa (SPEC §7.9) — entrega inicial é in-app; canal opcional depende de SPEC de integrações.

### 5.14 Recursos sociais (D14)

- **Escopo de implementação:** dimensão social mínima — perfis públicos, listas/amizades ou seguimento, interações (comentários/curtidas ou equivalentes) sobre conteúdo permitido; denúncia/moderação.
- **Entidades:** relação social, interação, denúncia/moderação.
- **Regras a preservar:** apenas dados permitidos são públicos; toda interação é moderável (denunciar, ocultar, remover); spam/abuso bloqueáveis por admin.
- **Dependências:** D1, D2 (identidade/visibilidade); D17 (moderação); alimenta D13 (resposta social) e D15 (eventos).
- **Restrição herdada:** não é rede social livre; é funcional ao estudo (SPEC §6).
- **Pendências:** formato exato de interações — SPEC de recursos sociais.

### 5.15 Analytics (D15)

- **Escopo de implementação:** métricas e agregados para professor (turma, curso, questão) e administrador (plataforma).
- **Entidades:** evento de análise, métrica agregada, relatório.
- **Regras a preservar:** professor vê apenas a própria turma; agregados não expõem indivíduo sem permissão; métricas derivam dos mesmos eventos de progresso/gamificação (fonte única).
- **Dependências:** eventos de D3–D11 e D14; D1 (papéis); D17 (analytics de plataforma).
- **Pendências:** P4 (observador/analista) não está detalhado — SPEC de analytics (SPEC §3 P4); relatórios e métricas exatas não definidos.

### 5.16 Certificados (D16)

- **Escopo de implementação:** emissão de certificado ao estudante cumprir requisitos de um curso; verificação por código.
- **Entidades:** certificado, requisito de emissão, código de verificação.
- **Regras a preservar:** requisitos definidos pelo professor/admin (ex.: ≥X% do curso e nota mínima); emissão única por estudante por curso; verificável por código; dados imutáveis após emissão.
- **Dependências:** D6 (progresso — fonte única de verdade), D5 (nota, quando exigida); D3 (curso).
- **Pendências:** modelo de layout/geração do certificado e formato do código — SPEC de certificados.

### 5.17 Administração (D17)

- **Escopo de implementação:** gestão de usuários e papéis, moderação, configuração global (inclui parâmetros de gamificação), suporte operacional, auditoria.
- **Entidades:** configuração global, ação de moderação, auditoria.
- **Regras a preservar:** apenas admin acessa; ações destrutivas auditáveis; alterar parâmetros de gamificação não altera conquistas já desbloqueadas.
- **Dependências:** D1 (usuários e papéis — base já entregue em F1); D14 (denúncias); D7 (parâmetros globais); D15 (métricas de plataforma).
- **Entrega dividida:** base (usuários, papéis, permissões) em F1; painel completo (moderação, configuração global, auditoria) em F13.
- **Pendências:** escopo exato do painel e trilha de auditoria — SPEC de administração.

---

## 6. Dependências entre domínios

Dependências lógicas **validadas contra a SPEC** (as do prompt de origem foram checadas; apenas as confirmadas foram mantidas):

1. **D1 precede tudo** — "sem login não há ação de estudante" (SPEC D1); todos os domínios exigem autenticação e papel.
2. **D2 depende de D1**; sua exibição rica (nível, conquistas, inventário) depende de D7, D8, D12.
3. **D3 depende de D1/D2** (autor dono e consumo autenticado).
4. **D4 e D5 dependem de D3** (questão pertence a curso/módulo; avaliação compõe questões).
5. **D6 depende de D3, D4, D5** (conclusões e resultados geram progresso) — "progresso deriva de conclusões registradas" (SPEC D6).
6. **D7 depende de ações verificadas de D3–D6** — "XP é concedido apenas por ações verificadas" (SPEC D7).
7. **D8 e D9 dependem de eventos de D6/D7** — critérios avaliados por eventos de progresso/gamificação (SPEC D8).
8. **D10 depende de D4/D5** (material), **D7** (pontuação) e **D12** (recompensa).
9. **D11 depende de métricas previamente existentes de D6 e D7** — ranking ordena por métrica já produzida (SPEC D11, §1).
10. **D12 depende de D8/D9** (fontes de moedas/recompensas) e alimenta D2 (inventário exibido).
11. **D13 depende de eventos de D6–D12** e de D1 (destinatário) — notificações disparam por eventos (SPEC D13).
12. **D14 depende de D1/D2** e de D17 (moderação); gera eventos para D13/D15.
13. **D15 depende dos eventos produzidos pelos demais domínios** — "métricas derivam dos mesmos eventos de progresso/gamificação" (SPEC D15); depende também de D1 (papel de leitura).
14. **D16 depende de D6 (e D5)** — "fonte única de verdade para rankings e certificados" (SPEC D6).
15. **D17 depende de D1** (usuários/papéis) e consome D14 (denúncias), D7 (parâmetros), D15 (métricas).
16. **Ciclo de retorno** — D12/D13/D11 realimentam o estudante no passo 14 do fluxo (SPEC §4): o loop pressupõe F1–F8 operacionais.

**Grafo resumido (→ = "alimenta/depende de eventos de"):**

```
D1 → D2 → D3 → D4 → D5 → D6 → D7 → {D8, D9, D10} → D12
                     └──────────────┘        │
D6/D7 ───────────────────────────────────────┼→ D11
D6/D5 ───────────────────────────────────────┼→ D16
{D6..D12, D14} ──────────────────────────────┼→ D13
{D3..D11, D14} ──────────────────────────────┼→ D15
D1 ──────────────────────────────────────────┴→ D17 (base F1; painel F13)
```

---

## 7. Fases de implementação

Ordem lógica derivada das dependências da Seção 6. Cada fase: objetivo, domínios, pré-requisitos, resultado esperado, validação. As fases são unidades de planejamento; a decomposição fina em tarefas ocorre no `TASKS.md` posterior.

> **Nota de escopo:** a SPEC (§7.8) delega roadmap e ordem de implementação ao PLAN/TASKS — portanto a ordem abaixo é uma decisão do PLAN, não um requisito novo de produto. Nenhuma fase altera regras da SPEC.

### Fase 0 — Habilitadores (sem domínio funcional)

- **Objetivo:** desbloquear a execução do plano sem inventar decisões.
- **Domínios:** nenhum (preparatória).
- **Pré-requisitos:** SPEC de visão geral aprovada (AC-01–AC-13).
- **Resultado esperado:** registro formal das decisões pendentes da Seção 8; definição do caminho para SPECs técnicas (stack) conforme processo SDD; leitura das SPECs de domínio que já existirem.
- **Validação:** Seção 8 completa — nenhuma decisão necessária sem tratamento como pendência.
- **Rastreabilidade:** SPEC §7.1, §7.7; restrição "sem stack" deste PLAN.

### Fase 1 — Identidade, acesso e perfis

- **Objetivo:** O1 — estudante/professor/administrador existem, autenticam-se e têm perfis.
- **Domínios:** **D1, D2** (e base de D17: papéis/permissões).
- **Pré-requisitos:** Fase 0.
- **Resultado esperado:** cadastro, login, logout, sessão, recuperação de senha; três papéis com acesso determinado por papel; perfis de estudante e professor com regras de visibilidade; exibição de nível/conquistas/inventário pronta (dados preenchidos a partir de F5/F8).
- **Validação:** critérios das regras de D1/D2 (unicidade de credencial, expiração de sessão, isolamento de edição de perfil, privacidade de e-mail/notas); fluxo passos 1–2 do fluxo principal.
- **Rastreabilidade:** SPEC §5 D1/D2; §4 passos 1–2; §3 P1–P3; funcionalidades 1–2 (Seção 2).

### Fase 2 — Catálogo de aprendizagem

- **Objetivo:** O2 (parte 1) — professor publica e estudante consome cursos/módulos/aulas.
- **Domínios:** **D3**.
- **Pré-requisitos:** F1 (autor dono, papel, consumo autenticado).
- **Resultado esperado:** hierarquia curso > módulo > aula com publicação; conteúdo de aula (texto, mídia embedada, material anexo); edição restrita a professor dono ou admin; registro de conclusão de aula por estudante.
- **Validação:** regras de D3 (hierarquia, dono, publicação, conclusão registrada); passos 3–4 do fluxo.
- **Rastreabilidade:** SPEC §5 D3; §4 passos 3–4; funcionalidades 3–5.
- **Pendência vinculada:** formato de conteúdo/mídia (SPEC de conteúdo) — **resolvida** (DP-19, `SPEC/2026-09-30-conteudo-aula.md`, 2026-09-30).

### Fase 3 — Exercícios, questões e avaliações

- **Objetivo:** O2 (parte 2) — estudante pratica e é avaliado.
- **Domínios:** **D4, D5**.
- **Pré-requisitos:** F2 (questão em curso/módulo; avaliação compõe questões).
- **Resultado esperado:** questões com gabarito protegido; tentativas com resposta, acerto e feedback imediato; avaliações com número de tentativas e janela definidos pelo professor; nota calculada no servidor; resultado disponível para progresso.
- **Validação:** regras de D4/D5 (gabarito não exposto antes do envio; tentativa registrada; nota servidor); passo 5–6 do fluxo.
- **Rastreabilidade:** SPEC §5 D4/D5; §4 passos 5–6; funcionalidades 6–8.
- **Pendências vinculadas (bloqueiam detalhe):** tipos definitivos de questão (D4, "a confirmar"); correção manual de dissertativas (D5, "a confirmar").

### Fase 4 — Progresso acadêmico

- **Objetivo:** O3 — visível e confiável "onde eu parou".
- **Domínios:** **D6**.
- **Pré-requisitos:** F2 (conclusão de aula), F3 (resultados de avaliação).
- **Resultado esperado:** consolidação de progresso de aula/módulo/curso; percentuais monotônicos por curso (exceto reset explícito); estatísticas pessoais; progresso servindo de fonte única para fases posteriores.
- **Validação:** regras de D6 (deriva de conclusões; monotonicidade; fonte única); passo 7 do fluxo.
- **Rastreabilidade:** SPEC §5 D6; §4 passo 7; funcionalidade 9.

### Fase 5 — Gamificação base: XP, níveis e conquistas

- **Objetivo:** O4 (parte 1) — retorno imediato do esforço.
- **Domínios:** **D7, D8**.
- **Pré-requisitos:** F4 (ações verificadas de progresso); F3 (acerto/entrega como gatilho).
- **Resultado esperado:** concessão de XP apenas por ações verificadas, no servidor; configuração de XP ajustável por escopo; níveis monotônicos; separação XP total × XP do período; desbloqueio de conquistas permanente e idempotente; nível e conquistas exibidos no perfil (D2).
- **Validação:** regras de D7/D8 (monotonicidade; idempotência; sem XP sem ação verificada; XP não comprável/transferível); passo 8 do fluxo; verificação da regra de ouro.
- **Rastreabilidade:** SPEC §5 D7/D8; §1 definições de XP/Nível/Conquista; §4 passo 8; funcionalidades 10–12.
- **Pendências vinculadas (bloqueiam detalhe):** fórmula de XP, fórmula/tabela de níveis, catálogo de conquistas (SPEC §7.7).

### Fase 6 — Missões e desafios

- **Objetivo:** O4 (parte 2) — constância e competição.
- **Domínios:** **D9, D10**.
- **Pré-requisitos:** F5 (eventos/gatilhos de gamificação); F3 (material de desafio).
- **Resultado esperado:** missões com janela, progresso rastreado, pagamento único, expiração sem pagamento; desafios com regras próprias, colocação e recompensa por colocação; professor configura gamificação do próprio escopo; recompensas fluem para D12.
- **Validação:** regras de D9/D10 (pagamento único; expirada não paga; colocação conforme configuração).
- **Rastreabilidade:** SPEC §5 D9/D10; §1 definições de Missão/Desafio; §4 passos 8 e 11 (missão a expirar); funcionalidades 13–14.
- **Pendências vinculadas:** tipos de missão/recompensas; mecânica de pontuação de desafios.

### Fase 7 — Rankings

- **Objetivo:** O4 (parte 3) — referência de comparação saudável.
- **Domínios:** **D11**.
- **Pré-requisitos:** F5 (XP e níveis), F4 (progresso) — métricas previamente existentes.
- **Resultado esperado:** ordenação por métrica claramente declarada, com escopo (curso/turma/global) e período (ex.: semana); empate por regra fixa; privacidade conforme configuração; cálculo servidor-side.
- **Validação:** regras de D11; passo 9 do fluxo; ausência de exposição de dados privados.
- **Rastreabilidade:** SPEC §5 D11; §1 definição de Ranking; §4 passo 9; funcionalidade 15.
- **Pendências vinculadas (bloqueiam detalhe):** regras detalhadas de ranking/empate (SPEC §7.7).

### Fase 8 — Economia: recompensas, moedas, loja e inventário

- **Objetivo:** O4 (parte 4) — retorno tangível.
- **Domínios:** **D12**.
- **Pré-requisitos:** F5 (conquistas como fonte), F6 (missão paga recompensa).
- **Resultado esperado:** saldos nunca negativos; compra atômica; item não transferível por padrão; estoque/preço configuráveis; inventário exibido no perfil; economia fechada (sem dinheiro real).
- **Validação:** regras de D12 (atomicidade, saldo não negativo, não transferibilidade); passo 10 do fluxo; verificação de que nenhuma rota de pagamento real existe (limite SPEC §6).
- **Rastreabilidade:** SPEC §5 D12; §1 definições; §4 passo 10; funcionalidades 16–19.
- **Pendências vinculadas:** catálogo/preços/efeitos de itens.

### Fase 9 — Notificações

- **Objetivo:** O5 (parte 1) — gatilhos de retorno.
- **Domínios:** **D13**.
- **Pré-requisitos:** F1 (destinatário); eventos de F4–F8; F10 parcial (resposta social) — pode ser entregue incrementalmente conforme eventos existirem.
- **Resultado esperado:** notificações in-app por eventos (missão a expirar, nova conquista, resultado de avaliação, resposta social); preferências do usuário; registro de leitura; frequência conforme preferências.
- **Validação:** regras de D13 (sem envio fora das preferências; leitura registrada); passo 11 do fluxo.
- **Rastreabilidade:** SPEC §5 D13; §4 passo 11; funcionalidade 20.
- **Pendências vinculadas:** e-mail é integração externa (SPEC §7.9) — entrega in-app primeiro.

### Fase 10 — Recursos sociais

- **Objetivo:** O5 (parte 2) — estímulo social ao estudo.
- **Domínios:** **D14**.
- **Pré-requisitos:** F1 (identidade), F2 (perfis/conteúdo alvo de interação); D17 mínimo para moderação (podendo iniciar com capacidade de admin já existente desde F1).
- **Resultado esperado:** perfis públicos dentro do permitido; relação social (amizade ou seguimento); interações permitidas; denúncia/ocultação/remoção; bloqueio de spam/abuso por admin.
- **Validação:** regras de D14 (moderabilidade total; dados permitidos apenas); passo 12 do fluxo; fronteira "não é rede social livre" (SPEC §6).
- **Rastreabilidade:** SPEC §5 D14; §4 passo 12; funcionalidade 21.

### Fase 11 — Analytics

- **Objetivo:** O6 (parte 1) — visão para professor e administrador.
- **Domínios:** **D15**.
- **Pré-requisitos:** eventos de F2–F8 e F10; D1 (papéis de leitura).
- **Resultado esperado:** métricas/relatórios por turma, curso e questão para o professor (apenas a própria turma); métricas de plataforma para o administrador; agregados sem exposição indevida de indivíduos; mesma fonte de eventos de progresso/gamificação.
- **Validação:** regras de D15 (escopo de visão do professor; fonte única); fluxo secundário do professor e do administrador (SPEC §4).
- **Rastreabilidade:** SPEC §5 D15; §2 item 4; funcionalidade 22.
- **Pendências vinculadas:** P4 e relatórios detalhados (SPEC de analytics).

### Fase 12 — Certificados

- **Objetivo:** O6 (parte 2) — comprovação do concluído.
- **Domínios:** **D16**.
- **Pré-requisitos:** F4 (progresso — fonte única), F3 (nota, quando exigida), F2 (curso).
- **Resultado esperado:** requisitos configurados por professor/admin (ex.: ≥X% e nota mínima); emissão única por estudante por curso; código de verificação; dados imutáveis pós-emissão.
- **Validação:** regras de D16 (unicidade, imutabilidade, verificabilidade); passo 13 do fluxo.
- **Rastreabilidade:** SPEC §5 D16; §4 passo 13; funcionalidade 23.

### Fase 13 — Administração completa

- **Objetivo:** O7 — operação e moderação da plataforma.
- **Domínios:** **D17** (completude; base entregue em F1).
- **Pré-requisitos:** F1 (usuários/papéis), F10 (denúncias), F5 (parâmetros de gamificação), F11 (métricas de plataforma).
- **Resultado esperado:** gestão de usuários e papéis; moderação com ações auditáveis; configuração global de gamificação cuja alteração não reescreve conquistas já desbloqueadas; leitura de analytics de plataforma.
- **Validação:** regras de D17 (apenas admin; auditoria; não altera conquistas passadas); fluxo secundário do administrador (SPEC §4).
- **Rastreabilidade:** SPEC §5 D17; §3 P3; §4 fluxo administrador; funcionalidade 24.

**Cobertura por fase:** F1→D1,D2 | F2→D3 | F3→D4,D5 | F4→D6 | F5→D7,D8 | F6→D9,D10 | F7→D11 | F8→D12 | F9→D13 | F10→D14 | F11→D15 | F12→D16 | F13→D17. **Todos os 17 domínios cobertos; as 24 funcionalidades rastreadas na Seção 2.**

---

## 8. Artefatos e decisões pendentes

**Artefatos que este PLAN gera ou consumirá:**

| Artefato | Situação |
|---|---|
| `SPEC/2026-09-30-visao-geral.md` | existe, aprovada (fonte) |
| `PLAN.md` | este artefato |
| `TASKS.md` | próxima etapa — derivar deste PLAN por fase (Seção 7) |
| SPECs por domínio (D1–D17) | pendentes (SPEC §7.7) |
| Código, testes | etapas posteriores do SDD (não existem; `src/` e `tests/` vazios) |

**Decisões pendentes — NÃO resolvidas neste PLAN (registradas, não inventadas):**

| # | Decisão pendente | Origem na SPEC | Tratamento |
|---|---|---|---|
| DP-01 | Stack tecnológica: linguagem, framework, banco, infraestrutura | SPEC §7.1 (admite delegar ao PLAN, mas a restrição desta etapa proíbe escolher) | Definir em etapa/fase própria ou SPEC técnica antes de F1 detalhada |
| DP-02 | Modelo de dados físico (esquema, migrations, índices, IDs) | SPEC §7.2 | SPEC técnica própria |
| DP-03 | Contratos de API (endpoints, payloads, autenticação técnica, versionamento) | SPEC §7.3 | SPEC técnica própria |
| DP-04 | Requisitos não funcionais quantificados (performance, disponibilidade, escalabilidade, carga) | SPEC §7.4 | SPEC de NFRs própria |
| DP-05 | Design de UI/UX (wireframes, paleta, componentes) | SPEC §7.5 | SPEC de UI/UX própria |
| DP-06 | Acessibilidade e internacionalização (níveis, idiomas, fuso) | SPEC §7.6 | SPEC própria |
| DP-07 | Fórmula exata de XP, fórmula/tabela de níveis | SPEC §7.7 (D7) | SPEC de D7 antes do detalhe de F5 |
| DP-08 | Conjunto definitivo de tipos de questão | SPEC D4 — "a confirmar em SPEC própria" | SPEC de D4 antes do detalhe de F3 |
| DP-09 | Correção manual de dissertativas | SPEC D5 — "a confirmar em SPEC própria"; SPEC §6 | SPEC de D5 antes do detalhe de F3 |
| DP-10 | Regras detalhadas de ranking (empate, privacidade fina) | SPEC §7.7 (D11) | SPEC de D11 antes do detalhe de F7 |
| DP-11 | Integrações externas (LTI/SCORM, OAuth social, e-mail transacional, CDN, vídeo, analytics de terceiros) | SPEC §7.9 | SPEC de integrações; e-mail opcional — D13 |
| DP-12 | Pagamentos, moedas reais, marketplace | SPEC §7.10, §6 | **Fora de escopo do produto nesta visão** (não pendência de implementação) |
| DP-13 | Moderação por IA, recomendação, LLM | SPEC §7.11 | Fora de escopo desta visão |
| DP-14 | Multi-tenancy | SPEC §7.12 | Fora de escopo desta visão |
| DP-15 | Testes de carga, backup, disaster recovery | SPEC §7.13 | SPEC de NFRs (DP-04) |
| DP-16 | Aspectos legais (termos de uso, LGPD/GDPR, consentimentos) | SPEC §7.14 | Consideração futura própria |
| DP-17 | Persona P4 (observador/analista) e relatórios de analytics | SPEC §3 P4 | SPEC de analytics antes/F11 |
| DP-18 | Catálogos e tabelas de gamificação (conquistas, missões, itens/preços, desafios) | SPEC D8, D9, D10, D12 (escopos citados sem catálogo) | SPECs de cada domínio correspondente |
| DP-19 | Formato de conteúdo de aula, limites de upload, embeds | SPEC D3 (entidades citadas sem detalhe) | SPEC de conteúdo — **Resolvida em 2026-09-30** (ver `SPEC/2026-09-30-conteudo-aula.md`, aprovada; pendências derivadas P-18–P-21 abertas) |

**Regra:** se uma tarefa futura exigir uma decisão listada acima, ela deve ser resolvida pela SPEC correspondente **antes** da execução detalhada da fase vinculada — nunca improvisada na tarefa.

---

## 9. Estratégia de validação

Validação em quatro níveis, todos derivados do processo SDD e da SPEC (sem inventar métricas numéricas novas):

1. **Validação documental por fase (durante a execução):**
   - toda tarefa rastreável a um domínio D1–D17 e a uma funcionalidade da Seção 2;
   - regras de negócio da fase conferidas textualmente contra a SPEC §5;
   - nenhuma decisão da Seção 8 aplicada sem resolução prévia.

2. **Validação de domínio (ao final de cada fase):**
   - critérios de aceitação do domínio, a serem escritos na SPEC própria do domínio (SPEC §7.7) — este PLAN não os antecipa;
   - conferência das regras declaradas em 5.x (ex.: idempotência de conquista em F5; atomicidade de compra em F8; saldo não negativo em F8; monotonicidade de progresso em F4 e de nível em F5).

3. **Validação de fluxo (integração entre fases):**
   - percorrer o fluxo principal da SPEC §4 passos 1–14 com as fases concluídas correspondentes;
   - verificar a **regra de ouro** (SPEC §4): toda recompensa calculada no servidor, cliente apenas exibe;
   - verificar fronteiras da SPEC §6 (sem pagamento real, sem app nativo, sem vídeo próprio, sem LTI/SCORM, gamificação exige atividade de aprendizagem).

4. **Validação por personas (SPEC §3):**
   - P1 percorre o loop completo; P2 edita apenas o próprio escopo e lê apenas a própria turma; P3 acessa exclusivamente administração.
   - P4 fica pendente até SPEC de analytics (DP-17).

**Etapa de testes** ocorre após a implementação, conforme o processo (SPEC → PLAN → TASKS → implementação → **testes** → revisão); os casos de teste serão derivados das tarefas do `TASKS.md` e dos critérios da SPEC de cada domínio. Este PLAN não define framework nem tipo de teste (DP-01, DP-04).

---

## 10. Critérios de conclusão do PLAN

O PLAN pode ser considerado concluído (e apto a gerar `TASKS.md`) quando:

1. os 17 domínios D1–D17 possuem subseção própria em §5 com escopo, entidades e regras herdadas da SPEC;
2. as 24 funcionalidades estão mapeadas a domínio e fase (§2);
3. o mapa de rastreabilidade SPEC → PLAN está completo (§2);
4. as dependências de §6 estão validadas contra a SPEC (nenhuma dependência inventada);
5. as fases de §7 cobrem todos os domínios com objetivo, pré-requisito, resultado e validação;
6. toda decisão não tomada pela SPEC aparece em §8 como pendência, com origem citada;
7. nenhuma stack, API, modelo de dados físico, fórmula de XP/nível, tipo definitivo de questão ou regra detalhada de ranking foi definido;
8. nenhuma SPEC existente foi alterada e nenhum outro artefato além deste `PLAN.md` foi criado/alterado;
9. um leitor consegue derivar `TASKS.md` por fase sem inventar requisitos fundamentais (basta expandir 5.x + 7 + pendências vinculadas);
10. a autoverificação da Seção 12 está executada sem pendências abertas.

---

## 11. Limites e itens explicitamente não definidos

**Este PLAN não define (espelho da SPEC §7 + restrições da etapa):**

1. Stack tecnológica (DP-01) — não escolhida aqui, apesar de a SPEC §7.1 admitir delegação; prevalece a restrição da etapa.
2. Modelo de dados físico (DP-02) — apenas entidades conceituais herdadas da SPEC.
3. Contratos de API (DP-03).
4. Requisitos não funcionais quantificados (DP-04, DP-15).
5. Design de UI/UX (DP-05), acessibilidade e internacionalização (DP-06).
6. Fórmulas de XP/níveis, tipos definitivos de questão, regras detalhadas de ranking (DP-07, DP-08, DP-10).
7. Correção manual de dissertativas (DP-09).
8. Integrações externas (DP-11), pagamentos/moedas reais (DP-12), IA/LLM (DP-13), multi-tenancy (DP-14), aspectos legais (DP-16).
9. Catálogos de gamificação e detalhes finos de conteúdo (DP-17, DP-18, DP-19). *Revisão 2026-09-30:* DP-19 resolvida por `SPEC/2026-09-30-conteudo-aula.md`; permanecem não definidos aqui os itens P-18–P-21 daquela SPEC.
10. Estimativas de esforço, duração e alocação de pessoas (não são requisitos da SPEC).

**Limites de produto herdados e mantidos (SPEC §6):** apenas web responsiva; papéis fixos; conteúdo autoral; correção automática de questões (dissertativas conforme SPEC própria); gamificação server-side; economia fechada; persistência própria; analytics dos próprios eventos; certificados verificáveis por código próprio; **não** é host de vídeo, sistema de pagamento, LMS institucional, app nativo, videoconferência, rede social livre, autor de conteúdo nem jogo.

---

## 12. Revisão de qualidade do PLAN (autoverificação)

| Verificação pedida | Resultado |
|---|---|
| Todo D1–D17 aparece no plano? | **Sim** — §5.1–§5.17, mapa §2 e cobertura de fases §7 (F1–F13). |
| As 24 funcionalidades continuam rastreáveis? | **Sim** — tabela "24 funcionalidades → domínio → fase" em §2 (todas as 24). |
| Algum requisito novo foi inventado? | **Não** — escopo/entidades/regras de §5 são transcrições da SPEC §5; dependências de §6 foram validadas contra a SPEC antes da inclusão. |
| Alguma decisão deixada para SPEC futura foi tomada indevidamente? | **Não** — 19 pendências registradas em §8 com origem citada (DP-01–DP-19). |
| O plano permite derivar TASKS.md posteriormente? | **Sim** — cada fase (§7) indica objetivo, domínios, pré-requisitos, resultado, validação e pendências vinculadas; §10 item 9 formaliza esse critério. |
| Stack tecnológica foi evitada? | **Sim** — nenhuma linguagem/framework/banco/infra escolhido; DP-01 registra a pendência. Verificação documental: busca por nomes de tecnologias neste arquivo retorna 0 ocorrências. |
| Código foi evitado? | **Sim** — apenas diagrama de dependências em texto (§6); nenhum artefato de código. |
| O PLAN respeita os limites da SPEC? | **Sim** — §3 e §11 reproduzem as fronteiras da SPEC §6/§7; regra de ouro e restrições por papel mantidas. |
| Fronteiras "a confirmar" preservadas? | **Sim** — D4 (tipos de questão) e D5 (correção de dissertativas) mantidos como pendência em §8 (DP-08, DP-09), sem definição aqui. |
| Nenhum outro arquivo alterado? | **Sim** — esta etapa cria somente `PLAN.md`; SPEC, prompt e demais arquivos permanecem intactos; `TASKS.md` não foi criado. |

**Conclusão:** o PLAN atende aos 10 critérios da Seção 10 e está apto para a etapa `TASKS.md`.
