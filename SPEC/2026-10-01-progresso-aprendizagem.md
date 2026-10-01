# SPEC/2026-10-01-progresso-aprendizagem.md — SPEC do domínio D6: Progresso acadêmico (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-10-01-progresso-aprendizagem.md` (SPEC de D6 — progresso acadêmico) |
| Status | **Proposta — aguardando aprovação (2026-10-01)** |
| Data | 2026-10-01 |
| Tarefas | **T4.1** (elaboração — este artefato); base para **T4.2** (registro/exposição de progresso) |
| Escopo | Persistência e exposição do progresso derivado de conclusões: flag de conclusão na aula, percentual de módulo/curso, idempotência com unicidade no banco, integração web |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` §5 D6, §4 passo 7, §4 princípio 8; `PLAN.md` §5.6, §7 F4, O3; `TASKS.md` T4.1–T4.4; `SPEC/2026-09-30-catalogo-aprendizagem.md` (D3: evento `conclusao_aula`, R-15, P-14–P-16); código de `src/server/servicos/catalogo.ts` e `prisma/schema.prisma` |
| Resolve | **P-14** (semântica de conclusão repetida → idempotente com unicidade); **P-15** e **P-16** apenas na parcela *progresso* (efeitos sobre certificados/gamificação permanecem em P-16) |
| Não resolve | P-34 (resultado de avaliação → progresso), reset (T4.3), estatísticas globais (T4.4), gamificação (D7/D8) |
| Restrição da etapa | Especificação primeiro: **nesta etapa não se implementa código** |

---

## 1. Auditoria do estado anterior (2026-10-01)

### 1.1 O que já existe

| Camada | Estado |
|---|---|
| Banco | Tabela `conclusao_aula` (migration `20260930195608_f2_catalogo_aprendizagem`): `id`, `aula_id` (FK CASCADE), `usuario_id` (FK CASCADE), `concluida_em`, `criado_em`, `atualizado_em`; índices em `aula_id`, `usuario_id` e `@@index([aula_id, usuario_id])` — **índice não-únicos**; nenhuma outra estrutura de progresso |
| Escrita | `POST /api/v1/aulas/{id}/conclusao` (F2-14, R-15) → `201 {aulaId, concluidaEm}`; `concluirAula()` valida visibilidade da cadeia (`404`), exige papel estudante (`403`), aplica idempotência via `findFirst` (**aplicacional — corrida pode duplicar**) |
| Leitura | **Inexistente.** `GET /aulas/{id}` devolve `{id, titulo, publicado, conteudo}`; `GET /cursos/{id}` devolve estrutura sem qualquer contagem; nenhum endpoint/serviço de progresso |
| Frontend | `DetalheAula` mantém `concluida` em `useState(false)` — **nunca populado da API**; botão com estados de envio/erro/sucesso já existentes; sem barra de progresso; sem contagem de aulas concluídas |

### 1.2 Fluxo real e ponto de perda

```
estudante abre aula  → GET /aulas/{id}  → sem flag de conclusão
                     → useState(false) sempre inicia "não concluída"
marca concluída      → POST /conclusao  → persiste em conclusao_aula ✅
fecha/recarrega      → estado local volta a false — parece "não salvo"
reabre (login novo)  → GET continua sem flag — o sistema sabe, mas não diz
```

**Diagnóstico:** a informação **não se perde no banco** — perde-se na **falta de contrato de leitura**. O registro é durável; a API nunca o devolve.

### 1.3 Lacunas confirmadas

1. Leitura do estado de conclusão (causa raiz do sintoma).
2. Agregação percentual por módulo/curso (fórmula é pendência do `PLAN.md` §5.6).
3. Unicidade `(usuario_id, aula_id)` no banco (P-14; idempotência só aplicacional).
4. UI: estado local como fonte definitiva; sem progresso no curso.

## 2. O que significa progresso no EduQuest

Definição alinhada à visão §5 D6 e §4 passo 7 ("sistema consolida conclusões em métricas"):

| Nível | Significado | Forma |
|---|---|---|
| **Aula** | aula concluída pelo estudante (binário) | estado persistido — existe registro em `conclusao_aula` |
| **Módulo** | quantas aulas visíveis do módulo estão concluídas | **derivado** no servidor: contagem + percentual |
| **Curso** | quantas aulas visíveis do curso estão concluídas | **derivado** no servidor: contagem + percentual |
| Retomada / estatísticas globais / reset | — | **fora de escopo** desta SPEC (§11) |

**Princípio:** progresso **não é armazenado** — é calculado sob demanda a partir das conclusões (fonte única). Não existe tabela de progresso materializada.

## 3. Regras

| ID | Regra | Origem |
|---|---|---|
| **R-D6-1** | Progresso deriva **exclusivamente** de conclusões registradas; nenhuma contagem é criada sem atividade de aprendizagem correspondente | visão §5 D6; `TASKS.md` T4.2 |
| **R-D6-2** | A conclusão é um evento por `(estudante, aula)`; a **repetição é idempotente**: mesmo `POST` devolve `200` preservando a primeira `concluidaEm`, e o banco permite **no máximo um registro** por par | decisão de D6 sobre **P-14**; comportamento já implementado em D3 (E-23) |
| **R-D6-3** | **Fórmula:** `percentual = floor(aulasConcluidas × 100 ÷ aulasTotal)` (0–100); `aulasTotal = 0` → `percentual = 0` (nunca divisão por zero). Arredondamento **para baixo**: `100%` só quando todas estão concluídas | decisão desta SPEC (pendência do `PLAN.md` §5.6) |
| **R-D6-4** | Denominador = **aulas visíveis ao estudante** na estrutura vigente (módulos publicados de curso publicado, aulas publicadas). Rascunhos e módulos não publicados **não contam**; conclusões **não são apagadas** por despublicação e voltam a contar quando a aula voltar a ser visível | visão §5 D6; D3 R-14/R-17; decisão sobre P-15 |
| **R-D6-5** | **Monotonicidade:** ações do estudante nunca diminuem o percentual (não existe remoção de conclusão). O percentual acompanha mudanças **editoriais** do professor (adição/publicação/exclusão de aulas altera o denominador) — isso não é reset e não é bloqueado | visão §4 princípio 8 + §5 D6 (interpretação registrada em §12) |
| **R-D6-6** | **Segurança:** o dono do progresso é sempre o usuário da **sessão** (`req.usuario`); nenhum campo de corpo define `usuarioId`; progresso alheio nunca é exposto (não há listagem por usuário) | técnica §2.3.1; `TASKS.md` T4.4 ("só os próprios dados") |
| **R-D6-7** | O campo `progresso` do curso é devolvido **somente ao papel estudante**; professores/admins não recebem o campo (não concluem aulas e veriam denominador com rascunhos) | decisão desta SPEC (§12) |
| **R-D6-8** | Escrever progresso exige papel `estudante` (`403`) e cadeia da aula visível (`404`) — herda D3 R-15/R-14 inalteradas | D3 §4 R-15, §6.4 |
| **R-D6-9** | **Fonte única:** o servidor calcula; o cliente apenas exibe. Nenhum percentual é montado no cliente a partir de estado local | visão §4; `PLAN.md` O3 |

## 4. Modelo físico

### 4.1 `conclusao_aula` (entidade existente — mudança mínima)

Mantém-se a tabela de D3 (SPEC D3 §5.5) **com uma correção de integridade**:

```prisma
model ConclusaoAula {
  id            String   @id @db.Uuid
  aula_id       String   @db.Uuid
  usuario_id    String   @db.Uuid
  concluida_em  DateTime
  criado_em     DateTime @default(now())
  atualizado_em DateTime @updatedAt
  // … relações inalteradas
  @@unique([aula_id, usuario_id])   // NOVO — substitui o índice simples
  @@index([usuario_id])
  @@map("conclusao_aula")
}
```

- **Única mudança:** `@@index([aula_id, usuario_id])` → `@@unique([aula_id, usuario_id])` (a unique já cobre o índice como prefixo; `@@index([aula_id])` e `@@index([usuario_id])` permanecem).
- **Migration nova:** deduplicação prévia (mantém o registro mais antigo) e então `CREATE UNIQUE INDEX`. Nenhuma migration histórica é editada.
- **Idempotência robusta:** a escrita usa `createMany({ skipDuplicates: true })` seguida de leitura do registro existente (ou equivalente) — corrida entre dois `POST` nunca cria duplicata nem erro 5xx.

### 4.2 Progresso derivado (sem nova entidade)

Não há tabela `progresso_*`. Os valores são calculados por consulta:

- **Aula:** `concluida = existe conclusao_aula (aula_id = aula, usuario_id = sessão)`.
- **Módulo/curso:** `aulasConcluidas = COUNT(aulas visíveis que possuem conclusão do usuário)`; `aulasTotal = COUNT(aulas visíveis)`; `percentual` conforme R-D6-3.

Justificativa: sem materialização não há dessincronização entre evento e agregado, a monotonicidade (R-D6-5) vale por construção e o volume de aulas por curso é pequeno o suficiente para cálculo por leitura. Se um dia o custo exigir, a materialização vira pendência própria (§12, P-43).

## 5. Contratos F4 (parcela mínima — sem rotas novas)

Reutilizam-se os endpoints existentes; as mudanças são **aditivas**.

### 5.1 `GET /api/v1/aulas/{id}` — flag de conclusão

| | |
|---|---|
| Sucesso | `200 {id, titulo, publicado, conteudo, concluida}` — **`concluida: boolean`** (novo) = existe conclusão do **usuário autenticado** naquela aula (`false` para papéis que não concluem) |
| Autorização | inalterada (sessão + visibilidade da cadeia; `404`) |
| Efeito | resolve a causa raiz da §1.2: a tela passa a refletir o banco após refresh/relogin |

### 5.2 `GET /api/v1/cursos/{id}` — progresso do curso

| | |
|---|---|
| Sucesso | `200 {…estrutura inalterada…, progresso}` — **`progresso`** (novo, **somente papel estudante**, R-D6-7): `{aulasConcluidas, aulasTotal, percentual, modulos: [{moduloId, aulasConcluidas, aulasTotal, percentual}]}` |
| `modulos` | na mesma ordem da estrutura, cobrindo **todos os módulos visíveis** (inclusive os com `aulasTotal: 0` → `percentual: 0`) |
| Papéis demais | campo **ausente** (contrato de dono/admin inalterado) |
| Denominador | aulas visíveis ao estudante (R-D6-4) |

### 5.3 `POST /api/v1/aulas/{id}/conclusao` — sem mudança de contrato

| | |
|---|---|
| Primeira vez | `201 {aulaId, concluidaEm}` (inalterado) |
| Repetição | **`200 {aulaId, concluidaEm}`** com a **primeira** `concluidaEm` — semântica idempotente **fixada** (resolve P-14; era comportamento provisório de E-23) |
| Corrida | dois `POST` simultâneos → um `201`, outro `200`; nunca dois registros (R-D6-2) |

## 6. Critérios de aceitação

### 6.1 Documentais

| ID | Critério |
|---|---|
| AC-D6-1 | Regras R-D6-1..9 cobrem derivação, fórmula, monotonicidade, segurança e fonte única da visão §5 D6 e de `TASKS.md` T4.2 |
| AC-D6-2 | Fórmula de percentual definida **na SPEC** (fecha a pendência do `PLAN.md` §5.6) |
| AC-D6-3 | P-14 registrada como **resolvida** (idempotente + unicidade); P-15/P-16 cobertas na parcela progresso |
| AC-D6-4 | Modelo sem entidade nova além da correção de unicidade; nenhuma migration histórica alterada |
| AC-D6-5 | Fora de escopo e pendências explícitos (§11/§12); contrato aditivo sem quebrar papéis que não consomem progresso |

### 6.2 Testáveis

| ID | Critério |
|---|---|
| AC-D6-6 | Estudante conclui a aula → fecha o navegador → login novo → `GET /aulas/{id}` devolve `concluida: true` |
| AC-D6-7 | Segundo `POST /conclusao` → `200` com a primeira `concluidaEm`; **1 linha** no banco para o par; corrida simulada não duplica |
| AC-D6-8 | Progresso do curso: `0/N` antes; ao concluir 1 de 2 → `50%`; 1 de 3 → `33%` (floor); N de N → `100%`; `N=0` → `0%` |
| AC-D6-9 | Progresso conta **somente** aulas visíveis (rascunho e módulo não publicado fora do denominador) |
| AC-D6-10 | Isolamento: conclusões do estudante B **não** aparecem no progresso de A; `POST` com corpo contendo `usuarioId` alheio é ignorado (usuário vem da sessão) |
| AC-D6-11 | Aula inexistente/rascunho/fora da cadeia → `404` e **nenhum** registro criado; professor/admin no `POST` → `403` |
| AC-D6-12 | `GET /cursos/{id}` como professor dono → **sem** campo `progresso`; como estudante → campo presente |
| AC-D6-13 | Frontend: aula aberta mostra `✓ Aula concluída` vindo da API sem novo clique; antes de concluir, botão habilitado; durante envio `Salvando…`/`aria-busy` sem cliques repetidos; erro mantém o estado visual anterior e permite nova tentativa; curso exibe `percentual` e `aulasConcluidas de aulasTotal` calculados pelo servidor |
| AC-D6-14 | Suíte inteira verde (107 testes existentes preservados + novos), typecheck sem erros, `prisma validate/generate` ok |

## 7. Erros (inalterados — sem rota nova)

| Status | Situação |
|---|---|
| `400` | corpo malformado no `POST /conclusao` (semântica de D3/E-24) |
| `401` | sem sessão (leituras e escrita) |
| `403` | `POST /conclusao` por professor/admin (R-D6-8) |
| `404` | aula inexistente ou cadeia não visível (R-D6-8) |
| — | repetição de conclusão **não é erro** (idempotente, §5.3) |

## 8. Frontend e UX

### 8.1 Aula (`DetalheAula`)

| Estado | Comportamento |
|---|---|
| Carga | `GET /aulas/{id}` popula `concluida` — **a API é a fonte de verdade**; sem chamada extra |
| Não concluída | botão `Marcar como concluída` habilitado |
| Enviando | `Salvando…` + `aria-busy` + `disabled` (já existente — mantido) |
| Sucesso | `✓ Aula concluída` + `Conclusao registrada.` (existente) |
| Erro | `Não foi possível salvar seu progresso. Tente novamente.` com **estado visual anterior preservado** (botão volta a habilitado) |
| Refresh/relogin | estado vem da API — persiste |

### 8.2 Curso (`DetalheCurso`) — somente papel estudante

Exibição do bloco `progresso` do servidor (R-D6-9 — nada calculado no cliente):

```
Seu progresso
████████░░ 80%
16 de 20 aulas concluídas
```

- Barra (`role="progressbar"`, `aria-valuenow/min/max`) + texto com contagem — nunca só cor/percentual.
- Por módulo: contagem `N de M aulas` no cabeçalho do módulo (dados de `progresso.modulos`).
- `aulasTotal: 0` → estado vazio amigável, sem percentual inventado.

## 9. Testes (adicionar, nunca remover)

**API (`tests/api/progresso.test.ts` novo + ajustes mínimos):**
1. flag `concluida` false → true após `POST`; persiste após "nova sessão" (nova requisição autenticada);
2. idempotência: `201` seguido de `200`, mesma `concluidaEm`, 1 registro; corrida (dois `POST` concorrentes) sem duplicata;
3. cálculo do progresso do curso: 0, meio, floor (1 de 3 → 33), completo (100), curso sem aulas (0);
4. denominador: rascunho e módulo não publicado fora da conta; aula despublicada sai do cálculo sem apagar conclusão;
5. isolamento: progresso de A não soma B; `usuarioId` no corpo é ignorado;
6. erros: `404` (inexistente/rascunho), `403` (professor), `401`, `400`;
7. contrato: professor dono **sem** `progresso`; estudante **com** `progresso`.

**Ajustes em testes existentes (intenção preservada):** `tests/api/catalogo.test.ts:221` (`toEqual` do estudante ganha `progresso`); demais `toEqual` de dono inalterados.

**Web (`tests/web/progresso.test.tsx` novo + ajustes em mocks):**
1. aula já concluída carregada da API → `✓ Aula concluída` desabilitada;
2. não concluída → clique → `Salvando…` → sucesso;
3. erro no envio → mensagem de erro + botão reabilitado, estado anterior preservado;
4. curso exibe barra e contagem vindas do mock (`progresso` presente);
5. professor (sem `progresso`) não renderiza o bloco.

## 10. Migração, segurança e qualidade

- **Migration:** `prisma/migrations/<timestamp>_f4_progresso_unicidade/` — dedup (mantém `criado_em`/`concluida_em` mais antigo) + `DROP INDEX` + `CREATE UNIQUE INDEX`; `prisma validate` e `prisma generate` na sequência; testes rodam `migrate deploy` em banco limpo (`tests/configuracao/global.ts`).
- **Segurança (R-D6-6):** usuário sempre de `req.usuario`; corpo do `POST` segue sendo ignorado para dono do progresso; não há rota que leia progresso de terceiros; aulas de cadeia invisível → `404` (não revela rascunho).
- **Qualidade:** sem `TODO/FIXME/console.log` no código novo; sem N+1 (contagens por uma consulta `GROUP BY`/`count` por curso); tratamento de erro no padrão `{"erro": {codigo, mensagem}}`; `git diff --check` limpo.

## 11. Fora de escopo (não implementar nesta SPEC)

- Tracking por segundos assistidos, percentual de vídeo, retomada de posição do vídeo;
- Analytics, histórico detalhado de navegação, estatísticas agregadas de turma;
- Gamificação: XP, níveis, conquistas, moedas (D7/D8 — regra de ouro: nada aqui concede recompensa);
- Reset explícito de progresso por professor/admin (T4.3 → P-39);
- Estatísticas pessoais globais do estudante (cursos em andamento/concluídos — T4.4 → P-40);
- Retomada ("última aula estudada") → P-41;
- Componente de resultado de avaliação no percentual (P-34/P-42);
- Matrícula, certificados, rankings (consomem D6 depois, não aqui);
- Desmarcar conclusão (não existe na visão; a monotonicidade R-D6-5 depende disso).

## 12. Pendências

| ID | Pendência | Origem |
|---|---|---|
| ~~P-14~~ | **Resolvida:** conclusão repetida é idempotente (`200`, primeira `concluidaEm`) com `@@unique([aula_id, usuario_id])` | D3 §10.2 → esta SPEC |
| ~~P-15~~ | **Resolvida na parcela progresso:** despublicação tira a aula do cálculo sem apagar a conclusão | D3 §10.2 → R-D6-4 |
| ~~P-16~~ | **Resolvida na parcela progresso:** exclusão em cascata remove conclusões (banco) e o percentual recalcula; efeitos sobre certificados/gamificação permanecem | D3 §10.2 → R-D6-4 |
| P-34 | Resultado de avaliação alimentando progresso (fórmula de combinação não existe em nenhuma fonte) | SPEC D5 §10 → P-42 |
| **P-39** | Reset explícito de progresso (professor/admin), monotonicidade com reset | `TASKS.md` T4.3 |
| **P-40** | Estatísticas pessoais agregadas (cursos em andamento/concluídos) | `TASKS.md` T4.4 |
| **P-41** | Retomada / "onde eu parou" (última aula concluída e sugestão de navegação) | objetivo O3 |
| **P-42** | Percentual de curso considerando resultados de avaliação (vincula P-34) | `TASKS.md` T4.2 |
| **P-43** | Materialização do progresso se houver custo relevante de leitura | decisão de §4.2 |

## 13. Rastreabilidade e revisões

### 13.1 Fontes

- `SPEC/2026-09-30-visao-geral.md` §4 passo 7, §4 princípio 8, §5 D6 (regras de D6), §6;
- `PLAN.md` §5.6 (escopo, entidades, pendência da fórmula), §7 F4, O3;
- `TASKS.md` T4.1–T4.5;
- `SPEC/2026-09-30-catalogo-aprendizagem.md` §3.4 (fluxo de conclusão), §4 R-15, §5.5 (`conclusao_aula`), §7.2, §10 (P-14–P-16);
- `SPEC/2026-09-30-tecnica-fundacoes.md` §2.2 (convenções), §2.3.1 (transporte/erros);
- Auditoria de código desta data (§1): `src/server/{rotas,servicos}/catalogo.ts`, `src/web/paginas/Catalogo.tsx`, `prisma/schema.prisma`.

### 13.2 Revisões

| Data | Mudança | Status |
|---|---|---|
| 2026-10-01 | Versão inicial (T4.1) | **Aguardando aprovação do usuário** |
