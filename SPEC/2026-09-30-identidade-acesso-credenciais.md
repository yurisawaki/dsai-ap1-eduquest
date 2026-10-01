# SPEC/2026-09-30-identidade-acesso-credenciais.md — SPEC do domínio D1: Identidade, acesso e credenciais (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-09-30-identidade-acesso-credenciais.md` (T1.1 — SPEC do domínio D1) |
| Status | **Revisada — correções da auditoria F-01–F-06 aplicadas; aguardando re-auditoria** |
| Data | 2026-09-30 |
| Domínio / Fase | **D1 — Identidade e acesso** · Fase **F1** (`PLAN.md` §7) |
| Tarefa de origem | **T1.1** (`TASKS.md` — "Elaborar SPEC do domínio D1") |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` → `PLAN.md` → `TASKS.md` → `SPEC/2026-09-30-decisoes-pendentes.md`; decisões técnicas vinculantes: `SPEC/2026-09-30-tecnica-fundacoes.md` (DP-01/02/03, aprovada) |
| Desbloqueia (conteúdo) | T1.2 (cadastro), T1.3 (login/logout/sessão/recuperação), T1.4 (papéis e controle de acesso); condições de conteúdo de T1.7 (validação de F1) |
| Não resolve | DP-04–DP-19 (nenhuma); pendências P-01–P-04, P-11–P-13 (§10); nada pertencente a D2, D13 ou D17 |
| Restrições desta etapa | Sem código; sem alterar `PLAN.md`, `TASKS.md`, SPEC de visão, SPEC técnica ou `decisoes-pendentes.md`; sem inventar requisitos — informação não especificada vira pendência (§10) |

---

## 1. Objetivo

Transformar em **critérios verificáveis** tudo o que já foi definido para **D1 — Identidade e acesso** nos artefatos anteriores, cobrindo: cadastro, login, logout, sessão, recuperação de senha, papéis e permissões (`SPEC/2026-09-30-visao-geral.md` §5 D1), conforme a tarefa T1.1 do `TASKS.md`.

Esta SPEC **não cria requisitos funcionais**: toda regra aqui declarada é citação, detalhamento ou decomposição rastreável da SPEC de visão geral, do `PLAN.md` ou das decisões já aprovadas na SPEC técnica de fundações. Toda informação necessária **não especificada** nessas fontes é registrada como **pendência** em §10, em vez de escolhida arbitrariamente. Nenhum código é escrito aqui.

Esta SPEC **consome, não redefine**: as decisões técnicas da SPEC técnica de fundações (stack, modelo físico de D1, contratos 1–6, autenticação por sessão com cookie, hash bcrypt, matriz de sessão/papel) são vinculantes e não são reabertas (§2.4). Nenhuma decisão pertencente a D2 ou às fases posteriores é resolvida aqui.

---

## 2. Escopo de D1

### 2.1 Áreas cobertas (fonte: SPEC visão §5 D1)

> **D1 — Identidade e acesso.** Escopo: cadastro, login, logout, sessão, recuperação de senha, papéis e permissões. Entidades: usuário, credencial, sessão, papel (estudante, professor, administrador). Regras: e-mail/credencial únicos; senha protegida; sessão expira; acesso determinado por papel; sem login não há ação de estudante.

| # | Área de D1 | Conteúdo nesta SPEC | Tarefa `TASKS.md` | Contrato (SPEC técnica §2.3.3) |
|---|---|---|---|---|
| 1 | Cadastro | Fluxo A (§3.1), regras R-01/R-02/R-09 (§4), dados (§5) | T1.2 | 1 |
| 2 | Login | Fluxo B (§3.2), regras R-02/R-06 (§4) | T1.3 (com T1.2) | 2 |
| 3 | Logout | Fluxo D (§3.4), regra R-07 (§4) | T1.3 | 3 |
| 4 | Sessão | Fluxo C (§3.3), regras R-03/R-06/R-11 (§4), estados (§7.1) | T1.3 | 4 |
| 5 | Recuperação de senha | Fluxo E (§3.5), regra R-08 (§4) | T1.3 | 5, 6 |
| 6 | Papéis e permissões | Regras R-04/R-05/R-10 (§4), matriz (§4.2) | T1.4 | base de autorização |

**Entidades de D1** (SPEC visão §5 D1): **usuário, credencial, sessão, papel** — materializadas conforme o modelo aprovado da SPEC técnica §2.2 (tabelas `usuario`, `credencial`, `sessao`; papel como ENUM dos 3 valores fixos, decisão justificada na técnica §2.2.2).

**Também entregue em F1 sobre a base de D1:** os três papéis fixos e o mecanismo de determinação de acesso por papel são a **base de D17 (administração)** — `PLAN.md` §5.17 ("base (usuários, papéis, permissões) em F1") e T1.4. O painel administrativo (gestão de usuários, moderação, auditoria) **não** é D1 → §8.

### 2.2 Fluxo do qual D1 participa

SPEC visão §4, passos 1–2 (início do fluxo principal):

1. **Cadastro** — visitante informa credenciais e cria conta; sistema valida e cria o perfil.
2. **Autenticação** — estudante faz login e obtém sessão autenticada; papéis determinam o que é visível.

`PLAN.md` §7 F1: "cadastro, login, logout, sessão, recuperação de senha; três papéis com acesso determinado por papel"; objetivo **O1**.

### 2.3 Fronteiras do escopo (D1 × vizinhos)

| Item | Pertence a | Referência |
|---|---|---|
| Campos editáveis de perfil, visibilidade, bio, preferências | **D2** (pendências P-05/P-06/P-07) | SPEC visão §5 D2; técnica §6.4 |
| Criação da linha de perfil junto ao cadastro | regra do **fluxo de cadastro** (D1 executa); estrutura e conteúdo do perfil são **D2** | SPEC visão §4 passo 1; técnica §2.2.3 regra 2 |
| Exibição de nível/conquistas/inventário | **D2** (+ D7/D8/D12) | `PLAN.md` §5.2 |
| Gestão administrativa de contas/papéis (listagem, alteração, suspensão) | **D17** (T13.2) | SPEC visão §5 D17; `PLAN.md` §5.17 |
| Preferências de notificação (tabela `preferencias`) | **D2/D13** — D1 não a gerencia | técnica §2.2.2; `PLAN.md` §5.13 |
| E-mail transacional (entrega de token) | **DP-11** (integrações) — pendência P-04 | SPEC visão §7.9; técnica §6.4 |

### 2.4 Decisões técnicas consumidas (vinculantes, da SPEC técnica de fundações)

Registradas aqui apenas como base de execução — **não são redecididas nem contraditas**:

| Decisão | Onde (SPEC técnica) | Uso em D1 |
|---|---|---|
| Stack (TypeScript, Node.js, Express, React/Vite, PostgreSQL, Prisma, Vitest, JSON/HTTP) | §2.1.2 | meios de T1.2–T1.4 (sem efeito em critérios funcionais) |
| Modelo físico de D1: `usuario` (id UUID, email UNIQUE, papel ENUM), `credencial` (hash_senha), `sessao` (expira_em INDEX, revogada_em) | §2.2.2 | §5 desta SPEC |
| Regras de integridade: UNIQUE de e-mail; criação de perfil em transação; papéis restritos aos 3 valores; FKs ON DELETE CASCADE | §2.2.3 | R-01, R-09, R-10 (§4) |
| Contratos de F1 1–6 (rotas `/api/v1/auth/*`) e seus códigos de sucesso/erro | §2.3.3 | §3, §7 |
| Autenticação: sessão servidor-side + cookie `eduquest_session` (HttpOnly, SameSite=Lax; Secure quando HTTPS); logout via `revogada_em`; hash **bcrypt** com custo por variável de ambiente; duração de sessão **não fixada** (P-03) | §2.3.2 | R-02, R-03, R-06, R-07, R-08 |
| Erro padrão `{"erro": {...}}` e códigos 400/401/403/404/409/500 | §2.3.1 | §7 |
| Resposta única e neutra na recuperação de senha (não revela existência do e-mail) | §2.3.3 contrato 5 | Fluxo E (§3.5) |
| Sem sessão automática no cadastro (passos 1 e 2 distintos) | §2.3.3 contrato 1 | Fluxo A (§3.1) |
| Matriz de sessão e papel por rota | §2.3.4 | §4.2 |
| Configuração operacional por variáveis de ambiente | §2.1.3 | duração de sessão como parâmetro (valor: P-03) |

---

## 3. Fluxos de cadastro, login, sessão, logout e recuperação de acesso

Todos os fluxos são o detalhamento dos passos 1–2 da SPEC visão §4 e das tarefas T1.2/T1.3. As respostas HTTP são as já definidas na SPEC técnica §2.3.3 (contratos 1–6) — aqui se descrevem passos, decisões do usuário e contrafluxos.

Os **nomes exatos das chaves JSON** de requisição/resposta não estão fixados em nenhuma fonte e não são requisito funcional: esta SPEC os **delega à implementação técnica** (escolha técnica, não de produto), mantendo vinculados os campos de sucesso já fixados na técnica §2.3.3 (ex.: `201 {usuarioId, papel}` do contrato 1, `200 {usuarioId, papel, expiraEm}` do contrato 4) e o formato de erro `{"erro": {...}}` (técnica §2.3.1).

### 3.1 Fluxo A — Cadastro (passo 1; contrato 1; T1.2)

**Ator:** visitante (sem sessão — rota pública, técnica §2.3.4).

1. Visitante informa **e-mail** e **senha**. O **papel não é escolha do cliente**: o servidor cria a conta sempre como `estudante` e **ignora** qualquer campo de privilégio enviado (`papel`, `perfil`, `role`, `isAdmin`…). Política de atribuição de papel: **P-01 resolvida** (§10.1) — regra **R-12**.
2. O servidor **valida** os dados: unicidade de e-mail é obrigatória (R-01); formato e tamanho mínimo de e-mail/senha **não estão especificados** nas fontes → **P-02** (§10); a **normalização/caixa** do e-mail aplicada à unicidade e à comparação no login também **não está especificada** → **P-02** (§10).
3. Em **transação**, o servidor cria: registro em `usuario` (id opaco, e-mail, papel, timestamps); registro em `credencial` com **apenas hash** da senha (R-02); a **linha de perfil correspondente** ao papel (SPEC visão §4 passo 1: "sistema valida e cria o perfil") — `perfil_estudante` ou `perfil_professor` conforme técnica §2.2.3 regra 2. *O papel administrador não possui tabela de perfil no modelo aprovado (nenhuma fonte declara perfil de administrador — técnica §2.2.2); nenhuma decisão nova é criada aqui.*
4. **Sucesso:** `201 {usuarioId, papel}` — **sem sessão automática**: os passos 1 e 2 do fluxo principal são distintos (SPEC visão §4; técnica §2.3.3 contrato 1).
5. O usuário segue para o **login** (Fluxo B).

**Contrafluxos:** e-mail já existente → `409` (credencial duplicada — D1: unicidade); dados inválidos → `400` (critério de "válido" depende de P-02).

### 3.2 Fluxo B — Login (passo 2; contrato 2; T1.2/T1.3)

**Ator:** usuário com conta, sem sessão (rota pública).

1. Usuário informa e-mail e senha.
2. O servidor confronta a senha com o **hash** armazenado (bcrypt — R-02) e, em caso positivo, **cria o registro de sessão** em `sessao` (com `expira_em`) e devolve o **cookie `eduquest_session`** (HttpOnly, SameSite=Lax; Secure quando HTTPS) — técnica §2.3.2.
3. **Sucesso:** `200` + cookie de sessão; a partir daqui vale "sem login não há ação de estudante" (R-05).
4. O estado da sessão passa a ser consultável pelo Fluxo C.

**Contrafluxos:** credenciais inválidas (e-mail sem credencial correspondente ou senha incorreta) → `401`; dados malformados → `400`. *A SPEC técnica define `401` "credenciais inválidas" sem distinguir o motivo e nenhuma fonte exige distinção — **nenhuma distinção é criada aqui** (evita também revelar existência de conta, coerente com a resposta neutra já decidida no contrato 5).*

### 3.3 Fluxo C — Sessão: ciclo de vida (contrato 4; T1.3)

**Ator:** usuário autenticado (ou cliente verificando estado).

1. A sessão é criada no login (Fluxo B) com `criado_em` e `expira_em`.
2. **A cada requisição autenticada**, o servidor valida o cookie contra a tabela `sessao`: existe, não está revogada (`revogada_em` nulo) e não expirou (`expira_em` no futuro) — técnica §2.3.2.
3. `GET /api/v1/auth/sessao` retorna `200 {usuarioId, papel, expiraEm}` enquanto a sessão for válida.
4. **Expiração:** a regra "sessão expira" é da SPEC visão §5 D1. A **duração padrão não está especificada** em nenhuma fonte → **P-03** (§10); o valor é parâmetro **configurável** por variável de ambiente (mecanismo já decidido na técnica §2.1.3/§2.3.2), sem valor fixado nesta SPEC.
5. Sessão inválida (expirada ou revogada) → `401` (contrato 4); o cliente perde acesso a rotas protegidas (R-05).

**Estados possíveis:** ativa, expirada, revogada — detalhamento em §7.1.

### 3.4 Fluxo D — Logout (contrato 3; T1.3)

**Ator:** usuário autenticado.

1. Usuário solicita logout.
2. O servidor marca `sessao.revogada_em` (encerramento explícito — técnica §2.2.2) e **descarta o cookie** (técnica §2.3.2).
3. **Sucesso:** `204` — **idempotente** (repetir logout não é erro de estado; técnica §2.3.3 contrato 3).
4. Sessões futuras com o mesmo cookie antigo → `401` (revogada, §7.1).

**Contrafluxos:** logout sem sessão válida → `401`.

### 3.5 Fluxo E — Recuperação de acesso / redefinição de senha (contratos 5 e 6; T1.3)

**Ator:** usuário (potencial) sem sessão — rotas públicas.

1. Usuário informa o e-mail da conta em `POST /api/v1/auth/recuperacao-senha`.
2. O servidor responde **`202` com resposta única e neutra** — a mesma para e-mail existente e inexistente, **não revelando existência da conta** (decisão registrada na técnica §2.3.3 contrato 5).
3. **Entrega, prazo e número de usos (reutilização)** do token de recuperação: **não especificados** nas fontes (o e-mail é integração externa, **DP-11** pendente) → **P-04** (§10). Nesta SPEC, o fluxo só declara que um **token** liga a solicitação à redefinição (contrato 6), sem definir canal, formato ou prazo. **Enquanto P-04/DP-11 estiverem abertas, T1.3 permanece desbloqueada para os contratos 5 e 6:** a geração e a validação do token acontecem no servidor (comportamento do contrato 6); canal de entrega de e-mail não é exigível nem implementável nesta fase (§8).
4. Usuário envia token + nova senha em `POST /api/v1/auth/redefinicao-senha`.
5. Token válido → o servidor **substitui o hash** da senha (apenas hash, R-02) e responde `204`. Token inválido/expirado → `400` (validade depende de P-04).
6. **Efeito sobre sessões ativas após a redefinição** (encerrar ou não sessões existentes): **não especificado** em nenhuma fonte → **P-13** (§10).

**Contrafluxos:** `400` na solicitação (dados malformados) e `400` na redefinição (token inválido/expirado — contrato 6).

---

## 4. Regras de autenticação e autorização pertencentes a D1

Toda regra tem rastreabilidade obrigatória. As 5 primeiras são literalmente as regras de D1 da SPEC visão §5 (cada uma vira ≥1 AC em §6).

| ID | Regra | Detalhe (derivado das fontes) | Rastreabilidade |
|---|---|---|---|
| R-01 | **E-mail/credencial únicos** | Nenhum e-mail pode pertencer a duas contas; unicidade imposta pelo banco (UNIQUE) e verificada no cadastro; violação → `409`. Cada usuário tem exatamente 1 credencial (relação 1:1) | SPEC visão §5 D1; técnica §2.2.2 (`email UNIQUE`), §2.2.3 regra 1, §2.3.3 contrato 1; `PLAN.md` §5.1 |
| R-02 | **Senha protegida** | A senha **nunca** é armazenada nem exposta: persiste **apenas hash bcrypt** (custo por variável de ambiente); a senha em claro só existe no transporte da requisição de login/recuperação e não é devolvida em nenhuma resposta | SPEC visão §5 D1 ("senha protegida"); técnica §2.2.2 (`hash_senha`), §2.3.2 (bcrypt); `PLAN.md` §5.1 |
| R-03 | **Sessão expira** | Toda sessão tem `expira_em`; validada a cada requisição autenticada; expirada → `401`. Valor da duração: parâmetro configurável, **não fixado** → P-03 | SPEC visão §5 D1; técnica §2.2.2, §2.3.2; `PLAN.md` §5.1 |
| R-04 | **Acesso determinado por papel** | Todo usuário tem exatamente um dos 3 papéis fixos (ENUM: estudante, professor, administrador); rota protegida sem sessão → `401`; sessão com papel não permitido → `403`; papéis determinam o que é visível/acessível nos demais domínios | SPEC visão §5 D1, §6 ("Papéis fixos"), §4 passo 2; técnica §2.2.2, §2.3.2, §2.3.1; `PLAN.md` §5.1 |
| R-05 | **Sem login não há ação de estudante** | Operações sobre perfis (leitura/edição) exigem sessão autenticada (`401` sem); as rotas de D1 são as de autenticação (contratos 1–6, públicas na matriz §4.2; logout e consulta de sessão retornam `401` sem sessão pelos contratos 3 e 4 — reconciliação §4.2) | SPEC visão §5 D1; técnica §2.3.2, §2.3.4; `PLAN.md` §6 item 1 |
| R-06 | **Sessão é no servidor** (meio decidido) | Identidade autenticada vive no registro `sessao` + cookie `eduquest_session` (HttpOnly, SameSite=Lax; Secure quando HTTPS); cliente não decide autenticação (regra de ouro) | técnica §2.3.2; SPEC visão §4 (regra de ouro); `PLAN.md` §4 princípio 2 |
| R-07 | **Logout revoga a sessão** | Define `revogada_em` e descarta o cookie; operação idempotente (`204`) | `TASKS.md` T1.3; técnica §2.2.2, §2.3.2, §2.3.3 contrato 3 |
| R-08 | **Recuperação de senha com resposta neutra** | Solicitação responde `202` única e neutra (não revela existência do e-mail); conclusão por token com `204`/`400` | SPEC visão §5 D1 (escopo "recuperação de senha"); técnica §2.3.3 contratos 5 e 6 |
| R-09 | **Cadastro cria credencial e perfil em transação** | Usuário + credencial + linha de perfil correspondente ao papel são criados de forma atômica no cadastro | SPEC visão §4 passo 1; técnica §2.2.3 regra 2; `PLAN.md` §5.1 |
| R-10 | **Papel restrito aos 3 valores** | Fora de `{estudante, professor, administrador}` não existe conta; ENUM no banco (também cobre integridade dos futuros testes de T1.4) | SPEC visão §6; técnica §2.2.2, §2.2.3 regra 3 |
| R-11 | **Sessão pertence ao usuário; revogação explícita** | `sessao.usuario_id` com FK; encerramento é evento explícito (`revogada_em`), nunca inferido | técnica §2.2.2 (`sessao`); `TASKS.md` T1.3 |
| R-12 | **Cadastro público sempre cria estudante** | O **papel é definido pelo servidor**: `POST /auth/registro` cria a conta sempre com `estudante` e **ignora** qualquer campo de privilégio enviado pelo cliente (`papel`, `perfil`, `role`, `isAdmin`, `administrador`, `tipo`…); professor e administrador são atribuídos pela operação (seed/provisionamento), nunca pelo cliente | decisão de produto registrada nesta SPEC (P-01, §10.1) em 2026-10-01 — correção de segurança da AP1 |

### 4.2 Matriz de sessão e papel por rota (transcrição literal da técnica §2.3.4 + reconciliação declarada)

| Rotas | Sessão exigida | Papel exigido | Base |
|---|---|---|---|
| Contratos 1–6 (`/api/v1/auth/*`) — cadastro, login, logout, sessão, recuperação, redefinição | **Não** (acesso público) | nenhum | técnica §2.3.4 (linha transcrita literalmente); visitante executa os passos 1–2 (SPEC visão §4); sem sessão prévia possível por circularidade |
| `GET /perfis/{id}` (contrato 7 — fronteira D2) | **Sim** | qualquer papel autenticado | D1: "sem login não há ação de estudante" |
| `PATCH /perfis/{id}` (contrato 8 — fronteira D2) | **Sim** | **titular do perfil** | regra de D2 (SPEC visão §5 D2) — aplicada por D1 via `401`/`403` |

**Reconciliação declarada (não altera a matriz):** os contratos 3 (logout) e 4 (consulta de sessão) respondem `401` quando não há sessão válida — comportamento de negócio fixado na técnica §2.3.3. Isso **não muda** a coluna "Sessão exigida" da matriz, que permanece "**Não** (acesso público)", idêntica à técnica §2.3.4: a rota pode ser invocada sem sessão e é o próprio contrato quem a rejeita com `401`. Esta formulação substitui a anterior ("público, exceto as marcadas" / "logout e consulta de sessão: Sim"), que divergia da transcrição literal.

**Notas herdadas (técnica §2.3.4, preservadas):** (a) nenhuma rota de F1 exige um papel específico (estudante vs. professor vs. administrador) — a mecânica de `403` por papel existe (R-04) mas nenhum domínio de F1 a dispara; (b) a política de papéis no cadastro permanece P-01; (c) permissões detalhadas por persona (SPEC visão §3 P1/P2/P3) tornam-se restritos por rota quando os domínios correspondentes existirem — em D1, "papel" é o mecanismo, não o catálogo de permissões.

---

## 5. Dados de credenciais e identidade necessários para D1

Exatamente os dados das entidades de D1 no modelo aprovado (técnica §2.2.2) — **nenhum campo novo é criado nesta SPEC**.

### 5.1 Identidade — tabela `usuario`

| Dado | Tipo/restrução | Papel em D1 | Rastreabilidade |
|---|---|---|---|
| `id` | UUID (PK, gerado pela aplicação) | identificador opaco do usuário; usado em respostas (`usuarioId`) e rotas | técnica §2.2.1, §2.2.2 |
| `email` | VARCHAR(255) **UNIQUE, NOT NULL** | credencial de identificação (R-01); dado **privado** — nunca exposto a terceiros | SPEC visão §5 D1; §5 D2 (e-mail nunca público); técnica §2.2.2, §2.3.3 contrato 7 |
| `papel` | ENUM(`estudante`,`professor`,`administrador`), NOT NULL | base do acesso (R-04, R-10) | SPEC visão §5 D1, §6; técnica §2.2.2 |
| `criado_em` / `atualizado_em` | TIMESTAMP NOT NULL | timestamps da entidade | técnica §2.2.1 |

### 5.2 Credencial — tabela `credencial` (1:1 com `usuario`)

| Dado | Tipo/restrição | Papel em D1 | Rastreabilidade |
|---|---|---|---|
| `usuario_id` | PK, FK → `usuario.id` (ON DELETE CASCADE) | credencial única por usuário (R-01) | técnica §2.2.2 |
| `hash_senha` | TEXT NOT NULL | **único** representante da senha armazenada (R-02); bcrypt, custo por variável de ambiente | SPEC visão §5 D1; técnica §2.2.2, §2.3.2 |
| `atualizada_em` | TIMESTAMP | momento da última alteração (ex.: redefinição de senha) | técnica §2.2.1, §2.2.2 |

**Dado que não existe:** a senha em claro **não é persistida em nenhuma tabela** (R-02).

### 5.3 Sessão — tabela `sessao`

| Dado | Tipo/restrução | Papel em D1 | Rastreabilidade |
|---|---|---|---|
| `id` | UUID (PK) | ID opaco transmitido no cookie `eduquest_session` | técnica §2.2.1, §2.3.2 |
| `usuario_id` | FK → `usuario.id` (ON DELETE CASCADE), INDEX | dono da sessão (R-11) | técnica §2.2.2 |
| `criado_em` | TIMESTAMP | início da sessão | técnica §2.2.1 |
| `expira_em` | TIMESTAMP NOT NULL, INDEX | fim da sessão (R-03) | SPEC visão §5 D1; técnica §2.2.2 |
| `revogada_em` | TIMESTAMP NULL | logout/revogação explícita (R-07) | técnica §2.2.2; T1.3 |

### 5.4 Papel

Conjunto **fixo** de 3 valores (SPEC visão §6), representado como ENUM na tabela `usuario` — decisão da técnica §2.2.2 ("entidade *papel*" da visão materializada como ENUM, não tabela de lookup). Nenhum papel novo é criado aqui.

### 5.5 Dados que D1 **não** gerencia

Atributos de perfil (bio, nome, campos editáveis → D2/P-05), preferências (`preferencias` → D2/D13/P-07), visibilidade (`visibilidade` → D2/P-06), qualquer dado de gamificação (D7/D8/D12), conteúdo de aula/progresso (D3–D6). D1 persiste apenas identidade, credencial e sessão.

---

## 6. Critérios de aceitação verificáveis

### 6.1 Mapa regra da visão → critério (exigência da T1.1: "cada regra de D1 da visão geral vira ao menos um critério objetivo")

| Regra de D1 (SPEC visão §5) | Critérios |
|---|---|
| E-mail/credencial únicos | AC-05, AC-06 |
| Senha protegida | AC-07 |
| Sessão expira | AC-08, AC-09 |
| Acesso determinado por papel | AC-10 |
| Sem login não há ação de estudante | AC-11 |

### 6.2 Critérios

| ID | Critério | Método de verificação |
|---|---|---|
| AC-01 | O arquivo existe e contém as 10 seções numeradas: 1 Objetivo, 2 Escopo de D1, 3 Fluxos, 4 Regras de autenticação e autorização, 5 Dados de credenciais e identidade, 6 Critérios de aceitação, 7 Casos de erro e estados, 8 Fora de escopo, 9 Dependências e rastreabilidade, 10 Pendências | `ls` + leitura das seções `## 1.` a `## 10.` |
| AC-02 | O escopo cobre as **6 áreas de D1** da visão (cadastro, login, logout, sessão, recuperação de senha, papéis e permissões), cada uma ligada a tarefa e contrato (§2.1) | cruzamento §2.1 × SPEC visão §5 D1 × `TASKS.md` T1.2–T1.4 |
| AC-03 | Os **5 fluxos** (A–E) detalham os passos 1–2 do fluxo da SPEC visão §4, incluindo contrafluxos e contrato correspondente; cadastro e login são passos distintos (sem sessão automática) | leitura de §3 × SPEC visão §4 × técnica §2.3.3 |
| AC-04 | Toda decisão técnica consumida é citada com a seção da SPEC técnica; **nenhuma decisão técnica é reaberta ou contradita** (cookie, bcrypt, rotas, códigos; matriz **transcrita literalmente**, com a reconciliação dos contratos 3/4 declarada em §4.2) | revisão cruzada §2.4/§4.2 × técnica §2.1–§2.3, comparando a matriz linha a linha |
| AC-05 | **Unicidade:** um segundo cadastro com e-mail já existente é rejeitado (`409`) e não gera conta duplicada; cada usuário tem exatamente uma credencial | teste em T1.2 (unicidade); técnica §2.2.3 regra 1 |
| AC-06 | **Unicidade persistida:** a restrição UNIQUE existe no modelo físico de `usuario.email` e a criação de usuário+credencial+perfil ocorre em transação única | leitura do modelo (técnica §2.2.2/§2.2.3) + teste de integração em T1.2 |
| AC-07 | **Senha protegida:** nenhuma senha em claro é persistida (apenas `hash_senha`) nem devolvida em qualquer resposta; login válido só com verificação de hash | teste em T1.2 (armazenamento) e T1.3 (login); leitura de §5.2 |
| AC-08 | **Sessão expira (mecanismo):** sessão com `expira_em` no passado é rejeitada (`401`) em requisição autenticada e em `GET /auth/sessao` | teste de expiração em T1.3 (critério de T1.3) |
| AC-09 | **Sessão expira (parâmetro):** a duração é configurável por variável de ambiente; **nenhum valor padrão é fixado nesta SPEC** (permanece P-03) | leitura de §3.3 e §10; conferência de ausência de valor numérico de duração |
| AC-10 | **Acesso por papel:** toda conta tem um e só um dos 3 papéis fixos; rota protegida sem sessão → `401`; a distinção `401` (sem sessão) / `403` (sessão sem permissão) existe conforme técnica §2.3.2; nenhuma rota de F1 exige papel específico (matriz) | teste em T1.4 (negação de acesso); leitura de §4.2 |
| AC-11 | **Sem login não há ação de estudante:** leitura/edição de perfil exige sessão (`401` sem); as únicas rotas públicas de F1 são as de autenticação (contratos 1–6, matriz §4.2 transcrita da técnica §2.3.4), observada a reconciliação §4.2: logout e consulta de sessão respondem `401` sem sessão (contratos 3 e 4) | teste de rota protegida sem sessão (T1.4); matriz §4.2 × técnica §2.3.4 |
| AC-12 | **Fluxo passos 1–2 executável:** cadastro cria conta e perfil sem sessão automática; login em seguida cria sessão; os dois passos são verificáveis sequencialmente | percurso do fluxo em T1.7; contratos 1 e 2 |
| AC-13 | **Logout e recuperação:** logout revoga a sessão e descarta o cookie (idempotente `204`; sessão antiga → `401`); recuperação responde `202` neutra igual para e-mail existente/inexistente; redefinição com token válido → `204`, inválido/expirado → `400` | teste em T1.3 (expiração e recuperação — critério de T1.3) |
| AC-14 | Os casos de erro E-01–E-13 (§7) estão todos contemplados, cada um com resposta já definida na técnica §2.3.3 | cruzamento §7 × técnica §2.3.3 |
| AC-15 | Toda regra funcional desta SPEC é rastreável a SPEC visão, `PLAN.md`, `TASKS.md` ou SPEC técnica (coluna "Rastreabilidade" completa em §4; referências em §3/§5) | leitura de colunas de rastreabilidade |
| AC-16 | **Nenhuma decisão pertencente a D2 ou fases posteriores é resolvida**: P-05/P-06/P-07 citadas apenas como fronteira; DP-04–DP-19 não recebem decisão; campos de perfil/visibilidade não definidos | busca por `DP-04`…`DP-19` (só como não-resolução) e por campos de perfil em §8/§10 |
| AC-17 | Toda informação não especificada está registrada como pendência em §10 (P-01–P-04 herdadas; P-11–P-13 novas), cada uma com motivo e destino — **nenhum valor arbitrário escolhido** | leitura de §10; conferência de ausência de valores inventados (duração, tamanho de senha, prazo de token) |
| AC-18 | Nenhum código foi criado e nenhum outro artefato foi alterado (`src/` e `tests/` sem código; `PLAN.md`, `TASKS.md`, SPEC de visão e SPEC técnica inalterados) | `ls src tests`; `git status` / `git diff` |

---

## 7. Casos de erro e estados relevantes

### 7.1 Estados de sessão (derivados de `sessao` — técnica §2.2.2)

| Estado | Condição | Efeito |
|---|---|---|
| **Ativa** | `revogada_em` nulo **e** `expira_em` > agora | requisições autenticadas aceitas; `GET /auth/sessao` → `200` |
| **Expirada** | `expira_em` ≤ agora | `401` (R-03); nova tentativa exige novo login |
| **Revogada** | `revogada_em` preenchido (logout — R-07) | `401`; cookie antigo inutilizável |

### 7.2 Estados de conta (derivados do fluxo de cadastro)

| Estado | Condição | Efeito |
|---|---|---|
| **Conta criada, sem sessão** | após `201` do cadastro (passos 1 e 2 distintos) | login necessário para qualquer ação autenticada |
| **Com credencial ativa** | `credencial` com hash vigente | login possível; **nos fluxos de D1 (F1)**, alteração de hash ocorre apenas na redefinição (efeito em sessões: P-13) |

### 7.3 Casos de erro (respostas conforme técnica §2.3.1–§2.3.3 — nenhuma resposta nova é inventada)

| ID | Contexto | Comportamento esperado | Rastreabilidade |
|---|---|---|---|
| E-01 | Cadastro com e-mail já existente | `409` conflito; nenhuma conta criada (R-01) | visão §5 D1; técnica contrato 1; AC-05 |
| E-02 | Cadastro com dados inválidos (formato/tamanho) | `400` validação — **o que é "válido" é pendência P-02** | técnica contrato 1; §10 |
| E-03 | Cadastro bem-sucedido | `201 {usuarioId, papel}`; **sem sessão** (estado "conta criada, sem sessão") | visão §4 passo 1; técnica contrato 1; AC-12 |
| E-04 | Login com credenciais inválidas (e-mail sem conta ou senha incorreta — sem distinção de motivo) | `401` | técnica contrato 2; §3.2 |
| E-05 | Login com dados malformados | `400` | técnica contrato 2 |
| E-06 | Rota protegida sem cookie/sessão | `401` (R-05) | visão §5 D1; técnica §2.3.2; AC-11 |
| E-07 | Sessão expirada | `401` (estado expirada — §7.1) | visão §5 D1; técnica contrato 4; AC-08 |
| E-08 | Sessão revogada (após logout) com cookie antigo | `401` (estado revogada) | técnica §2.2.2/§2.3.2; AC-13 |
| E-09 | Logout sem sessão válida | `401` | técnica contrato 3 |
| E-10 | Logout com sessão válida | `204` idempotente; cookie descartado (R-07) | técnica contrato 3; AC-13 |
| E-11 | Recuperação de senha com e-mail existente **ou** inexistente | **mesma** resposta `202` neutra (não revela existência — R-08) | técnica contrato 5; AC-13 |
| E-12 | Redefinição de senha com token inválido/expirado | `400` — validade do token é pendência **P-04** | técnica contrato 6; §10 |
| E-13 | Rota exige papel não permitido pela regra da rota | `403` (mecanismo previsto — R-04); **em F1 nenhuma rota de D1 dispara este caso** (matriz §4.2, nota (a)) | técnica §2.3.1/§2.3.2/§2.3.4; AC-10 |

**Não especificados (sem comportamento inventado):** limite de tentativas de login/lockout (**P-12**); efeito da redefinição de senha em sessões ativas (**P-13**); política de sessões simultâneas por usuário (**P-11**). Ver §10.

---

## 8. Fora de escopo

- **D2 — Perfis:** campos de perfil, bio, edição (corpo do PATCH), visibilidade, preferências — pendências P-05/P-06/P-07, todas destinadas à SPEC de D2 (técnica §6.4).
- **D13 — Notificações** (catálogo de preferências, P-07) e **canal de e-mail** (DP-11) — a entrega do token de recuperação por e-mail não é implementada aqui (P-04).
- **D17 — Administração:** painel de gestão de usuários e papéis (listagem, alteração de papel, suspensão, exclusão), moderação e auditoria — T13.2+ (`PLAN.md` §5.17). A **base** de papéis/permissões em F1 pertence a D1 (T1.4); o catálogo de permissões por rota dos demais domínios é aplicado quando esses domínios existirem.
- **DP-04–DP-19: nenhuma é resolvida por este documento** — NFRs (DP-04), UI/UX (DP-05), acessibilidade/i18n (DP-06), fórmulas de XP/níveis (DP-07), tipos de questão (DP-08), dissertativas (DP-09), ranking (DP-10), integrações (DP-11), pagamentos (DP-12), IA/LLM (DP-13), multi-tenancy (DP-14), carga/backup/DR (DP-15), legais/LGPD (DP-16), analytics P4 (DP-17), catálogos de gamificação (DP-18), conteúdo de aula (DP-19).
- **Decisões técnicas:** nenhuma é tomada ou revisada aqui (§2.4) — stack, modelo físico, contratos e mecanismos de sessão/cookie/bcrypt vêm da SPEC técnica aprovada.
- **Requisitos funcionais novos:** nenhum; sem valores de validação, duração ou prazo (são pendências, §10).
- **Código, migrações, testes executáveis** — etapa de implementação (T1.2–T1.4).
- **Alterações** em `PLAN.md`, `TASKS.md`, SPEC de visão, SPEC técnica ou `decisoes-pendentes.md` — a remoção dos bloqueios do `TASKS.md` é revisão formal posterior (§9.4).

---

## 9. Dependências e rastreabilidade para as SPECs anteriores

### 9.1 Fontes (anteriores)

| Fonte | Seções usadas | Uso |
|---|---|---|
| `SPEC/2026-09-30-visao-geral.md` | §5 D1 (escopo, entidades, 5 regras); §4 passos 1–2 e regra de ouro; §3 P1–P3; §6 (papéis fixos, persistência própria); §5 D2 (fronteiras); §7 (o que está fora) | §2, §3, §4, §5, §6, §8 |
| `PLAN.md` | §5.1 (escopo/entidades/regras/pendências de D1), §5.17 (base em F1), §6 itens 1 e 15, §7 F1 (objetivo O1, resultado, validação), §9 item 2 (critérios na SPEC do domínio), §8 (DP-01–DP-03) | §1, §2, §6, §9 |
| `TASKS.md` | T1.1 (origem), T1.2, T1.3, T1.4, T1.7; preâmbulo (bloqueios) | §2.1, §3, §6, §9.3 |
| `SPEC/2026-09-30-tecnica-fundacoes.md` | §2.1 (stack/ambiente), §2.2 (modelo de D1), §2.3 (contratos 1–6, autenticação, matriz), §6.4 (P-01–P-04) | §2.4, §3, §4, §5, §7, §10 |
| `SPEC/2026-09-30-decisoes-pendentes.md` | §2 (status DPs), §5 (ordem), §6 (critério documental) | §8, §10.4 |

### 9.2 Posteriores (dependem deste artefato)

- **T1.2** (cadastro) — critérios AC-05, AC-06, AC-07, AC-12; casos E-01–E-03.
- **T1.3** (login, logout, sessão, recuperação) — critérios AC-07–AC-09, AC-13; fluxos B–E; casos E-04–E-12.
- **T1.4** (papéis e controle de acesso) — critérios AC-10, AC-11; matriz §4.2; caso E-13.
- **T1.7** (validação de F1) — percurso dos passos 1–2 (AC-12) e das regras via §6.1.
- **SPEC de D2** (T1.5 pré-requisito) — recebe P-05/P-06/P-07; a criação de perfil no cadastro é a interface D1→D2 (R-09).

### 9.3 Mapa tarefa ↔ seções desta SPEC

| Tarefa | Seções principais | Critérios |
|---|---|---|
| T1.2 | §3.1, §3.2, §5.1–§5.2, E-01–E-05 | AC-05, AC-06, AC-07, AC-12 |
| T1.3 | §3.2–§3.5, §5.3, §7.1, E-04, E-07–E-12 (recuperação validável nos contratos 5–6 sem canal de entrega — §3.5) | AC-07, AC-08, AC-09, AC-13 |
| T1.4 | §4 (R-04, R-05, R-10), §4.2, E-06, E-13 | AC-10, AC-11 |
| T1.7 | §3 (fluxos), §6.1 (mapa regra→AC) | AC-01–AC-14 |

### 9.4 Pós-requisito de processo (não executado nesta etapa)

O `TASKS.md` ainda marca T1.2–T1.4 como `[Depende de SPEC D1]` + pré-requisito global DP-01–DP-03. Esta SPEC fornece o **conteúdo** exigido por esse bloqueio; a **remoção formal** dos estados de bloqueio e a marcação de DP-01/DP-02/DP-03 como resolvidas em `PLAN.md` §8/`TASKS.md` dependem da **revisão formal posterior** já registrada na SPEC técnica §5 (itens 5–6 do critério de `decisoes-pendentes` §6). Até lá, nenhum desses arquivos é alterado.

---

## 10. Pendências

Série **P-xx** iniciada na SPEC técnica (P-01–P-10 usados; P-10 já resolvida — técnica §2.1.3). Nenhuma informação abaixo é escolhida arbitrariamente: onde a fonte não define, o valor fica em aberto.

### 10.1 Pendências herdadas da SPEC técnica, destinadas a D1

A técnica §6.4 designou esta SPEC como "artefato responsável" por P-01–P-04.

> **P-01 — RESOLVIDA em 2026-10-01** (decisão de produto — correção de segurança da AP1): a política de atribuição de papel no cadastro é **"cadastro público sempre cria `estudante`"**. O servidor ignora qualquer campo de privilégio enviado pelo cliente; professor e administrador são atribuídos pela operação (seed/provisionamento), nunca pelo cadastro público. Registrada como **R-12** e no fluxo §3.1 passo 1.

As demais (P-02–P-04) **não puderam ser decididas aqui sem inventar requisito**, pois nenhuma fonte (visão, PLAN, TASKS) contém a informação. Permanecem abertas:

| ID | Pendência | Por que permanece aberta | Condição para fechar |
|---|---|---|---|
| **P-02** | Validação de **e-mail e senha** (formato, tamanho mínimo) **e normalização/caixa do e-mail** aplicada à unicidade e à comparação no login | "senha protegida/credencial única" não define política de formato; o `email UNIQUE` da técnica §2.2.2 é literal no banco e nenhuma fonte define caixa/normalização — adotar caixa-sensível ou normalizar seria decisão de produto sem fonte | decisão registrada nesta SPEC com rastreabilidade; a implementação de T1.2 cobre desde já a unicidade (R-01), enquanto a respeito de caixa/normalização nenhum comportamento é assumido enquanto a pendência estiver aberta |
| **P-03** | **Valor padrão** de expiração de sessão | D1 diz "sessão expira", sem valor; a técnica §2.3.2 explicitamente não o fixa | valor definido aqui; o **mecanismo** (configurável por variável de ambiente) já é decisão da técnica §2.1.3 — T1.3 pode implementar o mecanismo sem o valor |
| **P-04** | **Entrega, prazo e número de usos (reutilização)** do token de recuperação de senha — escopo do texto "entrega e validade" da técnica §6.4, explicitado aqui | mecanismo de canal depende de **DP-11** (e-mail é integração externa, ainda pendente); formato, prazo e reutilização não especificados | SPEC de D1 com insumo de DP-11/SPEC de integrações |

### 10.2 Pendências novas abertas por esta SPEC

| ID | Pendência | Por que não foi decidida aqui | Artefato responsável |
|---|---|---|---|
| **P-11** | Política de **sessões simultâneas** por usuário (uma por vez vs. múltiplas; revogação em novo login) | nenhuma fonte especifica; o modelo aprovado (técnica §2.2.2) não restringe — adotar restrição ou permissão livre seria escolha arbitrária | SPEC de D1 (ou NFR/DP-04 se tratada como segurança operacional) |
| **P-12** | **Proteção contra tentativas repetidas** de autenticação (limite de tentativas/bloqueio temporário/rate limit) | não especificada nas fontes; pode ser regra funcional (D1) ou requisito não funcional (DP-04) — classificação e valor indecidíveis sem fonte | SPEC de D1 (regra funcional) ou SPEC de NFRs (DP-04) |
| **P-13** | **Efeito da redefinição de senha sobre sessões ativas** (encerrar todas ou manter) | não especificado em nenhuma fonte; ambos os comportamentos são plausíveis | SPEC de D1 |

### 10.3 Pendências de outras SPECs (não tratadas aqui — apenas fronteira citada)

- **P-05, P-06, P-07** → SPEC de **D2** (e D13 no caso de P-07) — técnica §6.4.
- **P-08, P-09** → modelos e contratos de **D3–D17** (técnicas §6.4) — fora de D1.
- Toda a série de decisões de domínio: DP-07 (D7), DP-08/DP-09 (D4/D5), DP-10 (D11), DP-11 (integrações/e-mail), DP-17 (analytics), DP-18 (catálogos), DP-19 (conteúdo) — conforme `PLAN.md` §8 e `decisoes-pendentes.md`.

### 10.4 Confirmação de não-resolução

- **DP-04–DP-19: nenhuma é resolvida por este documento** — ocorrências apenas como lista de não-resolução (§8, §10.3).
- **DP-01, DP-02, DP-03:** resolvidas pela SPEC técnica (aprovada) — aqui são apenas **consumidas** (§2.4); nenhuma é reaberta nem alterada.
- **Nenhum valor arbitrário foi escolhido:** não há nesta SPEC duração de sessão, tamanho mínimo de senha, formato de e-mail, normalização/caixa de e-mail, prazo/entrega/reutilização de token, limite de tentativas ou política de sessões simultâneas — todos registrados como pendência acima (AC-17).
