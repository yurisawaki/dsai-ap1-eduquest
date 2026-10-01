# SPEC/2026-10-01-identidade-visual-frontend.md — Identidade visual e experiência do frontend (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-10-01-identidade-visual-frontend.md` (SPEC de apresentação do frontend) |
| Status | **Aprovada para implementação (2026-10-01)** |
| Data | 2026-10-01 |
| Escopo | Frontend web (`src/web/`): identidade visual, design system, layout, navegação, estados e responsividade das telas existentes |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` (§7.5–§7.6 UI/UX **fora de escopo da visão** → esta SPEC ocupa esse vazio; §6 "não é host de vídeo"); `SPEC/2026-09-30-catalogo-aprendizagem.md` (R-14/R-17 visibilidade, fluxos A–D); `SPEC/2026-09-30-conteudo-aula.md` (R-C8 renderização/edição no cliente); `SPEC/2026-10-01-questoes-exercicios.md` (P-30: superfície web de D4 não especificada); contratos da API em `src/server/rotas/` |
| Não resolve | Nenhuma regra funcional, contrato de API, schema ou migration; nenhum requisito de gamificação (XP/nível fórmulas permanecem na visão/D17) |
| Restrições desta etapa | Não alterar `src/server/`, `prisma/`, testes de API; não remover testes, SPECs ou funcionalidades; não inventar dados que a API não fornece |

---

## 1. Objetivo

Definir a **identidade visual e os critérios de experiência** das telas já existentes do EduQuest para que a aplicação tenha aparência de produto educacional moderno, consistente e acessível — **sem alterar regras de negócio, contratos, rotas ou comportamento funcional**.

A SPEC é **apresentação**: cada requisito aqui descreve como algo **já funcional** deve parecer, não o que ele faz. Onde a informação visual desejada não existe na API, a SPEC determina **não inventar** (§5).

## 2. Auditoria de partida (estado antes desta SPEC)

| Tela / componente | Estado auditado |
|---|---|
| Navbar (`App.tsx`) | `<strong>EduQuest</strong>` + botões crus; sem marca gráfica, sem estado ativo, sem landmark de navegação |
| Layout global (`estilo.css`) | `main` com `max-width: 40rem` fixo — catálogo, curso e aula forçados numa coluna estreita; paleta ad hoc sem tokens |
| Catálogo | `<ul>` com uma linha por curso (`titulo — Estado` + botão "Abrir"); loading e empty como parágrafos crudos |
| Detalhe do curso | listas aninhadas planas (módulo → aulas) com botões espremidos; sem hierarquia visual de trilha |
| Página da aula | breadcrumb `.trilha` simples; seções em `section` branco; leitura com `65ch` razoável; anexo como link inline; conclusão com botão simples |
| Auth (login/cadastro/recuperação) | form em `main` sem identidade; sem contexto de marca |
| Perfil | seções de gamificação como listas crudas; conquistas/inventário exibidos via `JSON.stringify` (dado objecto da API) |
| Estados | `Carregando…`/`Nenhum…` como texto puro; erro só com cor `#a4262c` |
| Questões/exercícios | **sem superfície web** — apenas API (P-30 registrada) |
| Progresso | **API não expõe progresso**: `GET /cursos` → `{id,titulo,publicado,donoId}`; `GET /cursos/:id` → estrutura (módulos/aulas publicados); só existe `POST /aulas/:id/conclusao` (F2-14), sem leitura agregada |

## 3. Design system

### 3.1 Tokens (propriedades customizadas de CSS)

Todo valor visual novo deve vir de um token definido em `:root`; **proibido espalhar hex/px ad hoc** fora da tabela de tokens.

**Cores** (paleta única, uso educacional — clareza e confiança):

| Token | Valor | Uso |
|---|---|---|
| `--fundo` | `#f4f6fb` | fundo da aplicação |
| `--superficie` | `#ffffff` | cards, forms, seções |
| `--superficie-alt` | `#f8fafc` | áreas internas, zebra de listas |
| `--texto` | `#0f172a` | texto principal (contraste ≥ 14:1 no fundo) |
| `--texto-sec` | `#475569` | texto secundário (≥ 7:1 na superfície) |
| `--borda` | `#e2e8f0` | bordas de card/input |
| `--primaria` | `#2563eb` | ação principal, links, foco |
| `--primaria-escura` | `#1d4ed8` | hover da ação principal |
| `--primaria-suave` | `#eff6ff` | badges/realces de marca |
| `--sucesso` / `--sucesso-suave` | `#15803d` / `#dcfce7` | estado concluído/publicado |
| `--aviso` / `--aviso-suave` | `#b45309` / `#fffbeb` | rascunho, atenção |
| `--erro` / `--erro-suave` | `#b91c1c` / `#fef2f2` | mensagens de erro |
| `--texto-invertido` | `#ffffff` | texto sobre ações primárias |

**Tipografia** (hierarquia obrigatória):

| Nível | Ajuste |
|---|---|
| fonte-base | `system-ui, -apple-system, 'Segoe UI', sans-serif`; `16px`; `line-height: 1.5` |
| `h1` | `1.75rem` / `700` / `1.2` — um por tela |
| `h2` | `1.25rem` / `700` — títulos de seção |
| `h3` | `1.05rem` / `600` — módulos, títulos de card |
| texto de leitura (conteúdo de aula) | `1.0625rem` / `line-height: 1.7` / medida ≤ `65ch` |
| texto secundário/labels | `0.875rem`; labels `600` |
| botões | `0.9375rem` / `600` |

**Espaçamento** (escala única, múltiplos de `0.25rem`): `--esp-1: .25rem` … `--esp-2: .5rem` … `--esp-3: .75rem` … `--esp-4: 1rem` … `--esp-6: 1.5rem` … `--esp-8: 2rem` … `--esp-12: 3rem`. Nenhuma margem/padding fora dessa escala.

**Raios**: inputs/botões `--raio-s: 8px`; cards/seções `--raio-m: 12px`; badges `999px`.

**Sombras**: duas apenas — `--sombra-1` (cards em repouso, `0 1px 2px rgb(15 23 42 / .06)`) e `--sombra-2` (hover/elevação, `0 6px 16px rgb(15 23 42 / .10)`). Nada além.

### 3.2 Componentes padronizados

| Componente | Regra visual |
|---|---|
| **Card** | superfície, `--raio-m`, `--sombra-1`, borda `--borda`; hover eleva para `--sombra-2` apenas em cards clicáveis |
| **Botão primário** | fundo `--primaria`, texto invertido, `--raio-s`, altura mínima `2.5rem`; hover `--primaria-escura`; `:active` escurece; `:disabled` reduz opacidade e `cursor: default`; `:focus-visible` anel `2px --primaria` com `offset 2px` |
| **Botão secundário** | superfície, borda `--borda`, texto `--texto`; hover `--superficie-alt` |
| **Botão perigo** | apenas ações destrutivas (excluir); texto `--erro`, borda `--erro` em repouso sutil |
| **Botão sucesso** | fundo `--sucesso` — **exclusivo** do estado "aula concluída" |
| **Badge** | `999px`, `0.75rem/600`; publicado → `--sucesso-suave`/`--sucesso`; rascunho → `--aviso-suave`/`--aviso` |
| **Input/textarea/select** | fundo branco, borda `1px --borda`, `--raio-s`, altura ≥ `2.5rem`; focus borda `--primaria` + anel suave |
| **Alerta (erro/sucesso)** | `role="alert"` mantido no JSX; visual: borda esquerda `3px`, fundo `--erro-suave`/`--sucesso-suave`, raio `--raio-s` |
| **Skeleton** | blocos `--superficie-alt` com pulso `1.2s` (`prefers-reduced-motion` desliga); sempre acompanhados de texto acessível (`sr-only` ou `role="status"`) |
| **sr-only** | utilitário de leitores de tela; não remove semântica existente |

## 4. Requisitos visuais

| ID | Requisito |
|---|---|
| **R-V1** | A navbar é landmark `<header>` + `<nav aria-label="Navegação principal">`, exibe a marca **EduQuest** (monograma textual, sem imagem externa), indica a vista atual com `aria-current="page"` e mantém todos os itens funcionais atuais (Perfil, Catálogo, Sair / Entrar, Criar conta, Recuperar senha) com os **mesmos rótulos textuais** |
| **R-V2** | O layout usa container: catálogo/estrutura até `72rem`; páginas de leitura (aula) até `48rem`; autenticação/perfil em card ≤ `28rem` centralizado. Nada de UI esticada além de `72rem` |
| **R-V3** | O catálogo é um **grid responsivo** de cards de curso (≥3 colunas em 1280px+, 2 em ~768–1024px, 1 em ≤ ~600px). Cada card exibe: título (`h3`), badge de estado (Publicado/Rascunho) e CTA "Abrir". **Sem descrição nem progresso** (a API não os fornece — §5) |
| **R-V4** | O detalhe do curso apresenta a hierarquia **curso → módulo → aula** como trilha visual: módulos numerados com título (`h3`) + badge de estado + contagem derivada da estrutura recebida (`n` módulos · `m` aulas), aulas como linhas clicáveis com CTA "Abrir aula" e badge de estado. Contagens são **derivadas** dos dados retornados, nunca inventadas |
| **R-V5** | A página da aula estrutura visualmente: breadcrumb (Curso › Módulo › Aula) → título da aula → estado → conteúdo → conclusão. O botão "voltar" é acionável, visível e com foco claro |
| **R-V6** | Texto de conteúdo: medida ≤ `65ch`, `line-height ≥ 1.6`, parágrafos com espaçamento ≥ `1rem`, `white-space: pre-wrap` preservado (R-C8: texto simples sem marcação) |
| **R-V7** | Mídia: moldura `aspect-ratio 16/9`, `--raio-m`, `--sombra-1`, fundo escuro; link "Abrir em nova aba" `rel="noopener"` visível abaixo (R-C8). Sem alteração de `sandbox` |
| **R-V8** | Anexo: card/linha identificável com ícone inline (`aria-hidden`), nome do arquivo, tamanho quando presente e ação "Baixar" — o texto do link permanece `Baixar <nome>` (contrato de teste) |
| **R-V9** | O botão "Marcar como concluída" é ação primária de destaque; durante envio fica `disabled` + `aria-busy`; ao concluir muda para o **estado sucesso** ("✓ Aula concluída", fundo `--sucesso`); falha volta ao estado normal com alerta `role="alert"` |
| **R-V10** | Loading: toda tela que hoje mostra `Carregando…` exibe indicador visual (spinner/skeleton) **mantendo texto acessível**; empty states (`Nenhum curso disponível.`, `Sem conteudo.`, estados vazios de gamificação) ganham composição de card vazio com frase existente + apoio curto; erros são alertas visuais — **nunca stack trace** (o contrato `{"erro":{codigo,mensagem}}` já garante mensagem amigável) |
| **R-V11** | Responsividade verificada conceitualmente em `1440/1280/1024/768/390px`: navbar quebra linha sem cortar; grid reduz colunas; conteúdo de aula e moldura de mídia não transbordam (`min-width: 0`, `overflow-wrap: break-word`); botões de ação atingem ≥ `44px` de área em `touch` |
| **R-V12** | Acessibilidade: contraste mínimo WCAG AA em texto/botões; todo controle interativo é `<button>`/`<a>`/input real (nada de `div` clicável); `:focus-visible` global visível; labels associadas preservadas; `aria-label` onde o rótulo visual for só ícone; nenhuma semântica existente removida |
| **R-V13** | Nenhuma mudança visual altera: textos funcionais usados por testes (rótulos de nav, labels de form, mensagens de conclusão/erro, títulos de blocos), ordem/estrutura de `.conteudo-aula` (1 elemento por bloco), `role`/`aria-*` existentes ou contratos da API |

## 5. Fronteiras de dados (o que NÃO exibir)

| Informação desejada | Disponibilidade | Decisão |
|---|---|---|
| % de progresso do estudante por curso | **Inexistente na API** (sem leitura de conclusões agregadas) | **Não exibir barras/percentuais**; exibir apenas contagens derivadas da estrutura (R-V4). Registrar pendência (§10) |
| Descrição do curso no card | Inexistente em `ResumoCurso` | Não inventar texto descritivo |
| Superfície web de questões/exercícios | API existe (F3-01–F3-06), UI não (P-30) | Fora do escopo desta SPEC — não criar tela |
| Nível/conquistas/inventário | Existem em `GET /perfis/:id` (`nivel`, arrays) | Exibir como cards; formato objecto continua exibido como hoje (não é escopo desta SPEC) |

## 6. Estados e feedback

| Estado | Exigência |
|---|---|
| Carregando | indicador visual + texto acessível; nunca tela branca sem sinal |
| Vazio | frase funcional existente + explicação curta; CTA quando a ação existir (ex.: professor cria o primeiro curso) |
| Erro | alerta `role="alert"` com `--erro`; mensagem da API; botão permanece acionável |
| Sucesso | mensagens existentes (`Curso criado.`, `Conclusao registrada.`…) em alerta `--sucesso` |
| Ação destrutiva | botão perigo; comportamento inalterado (sem confirmação nova — seria mudança funcional) |

## 7. Critérios de aceitação

| AC | Critério | Verificação |
|---|---|---|
| AC-V1 | `npm test` permanece **verde sem remoção de testes**; qualquer ajuste de query é coerente com o novo DOM e mantém a intenção original | executar `npm test`; revisar diff de `tests/` |
| AC-V2 | `grep -RniE 'JSON.stringify\|<pre' src/web` não apresenta serialização de `bloco.dados` exibida ao usuário no fluxo de aula | grep + leitura do fluxo `ConteudoAula` |
| AC-V3 | Todos os valores de cor/raio/sombra/espacamento novos vêm de tokens `:root` (sem hex solto fora da seção de tokens) | revisão de `estilo.css` |
| AC-V4 | A navbar declara `nav[aria-label]` e item atual com `aria-current` | leitura de `App.tsx`/DOM |
| AC-V5 | A tela de catálogo usa grid responsivo e cards com badge + CTA; empty/loading/error seguem R-V10 | inspeção de `Catalogo.tsx` + build |
| AC-V6 | O botão de conclusão apresenta os 3 estados visuais (normal/envio/sucesso) descritos em R-V9 | leitura de código + teste existente |
| AC-V7 | Nenhum arquivo de `src/server/`, `prisma/` ou `tests/api/` é alterado por esta SPEC | `git diff --stat` |
| AC-V8 | `docker compose build && docker compose up -d` sobem sem erro e a aplicação responde `200` | build + `curl` |
| AC-V9 | A paleta e a hierarquia tipográfica atendem contraste AA nos pares texto/fundo declarados em §3.1 | revisão dos pares de tokens |
| AC-V10 | Responsividade conceitual revisada para 1440/1280/1024/768/390px (breakpoints declarados no CSS) | leitura das media queries |

## 8. Pendências registradas

| ID | Pendência |
|---|---|
| **P-V1** | Progresso do estudante (% por curso/aula) exige leitura agregada de conclusões na API (hoje só `POST /aulas/:id/conclusao`) — quando especificada, esta SPEC ganha a seção de exibição de progresso |
| **P-V2** | Superfície web de questões/exercícios permanece não especificada (P-30 da SPEC de D4) — UI de questões é escopo futuro, não desta SPEC |
| **P-V3** | Descrição/imagem de curso exige extensão de `ResumoCurso` na API — cards permanecem sem descrição até lá |

## 9. Rastreabilidade

| De/para | Relação |
|---|---|
| `SPEC/2026-09-30-visao-geral.md` §7 (item 5 "Design de UI/UX" fora de escopo da visão) | Esta SPEC **ocupa** aquele vazio para o frontend já implementado |
| `SPEC/2026-09-30-conteudo-aula.md` R-C8 | Mantém: texto simples, iframe sandbox, link "abrir em nova aba", editor por tipo — esta SPEC apenas **veste** esses elementos (§4 R-V6–R-V8) |
| `SPEC/2026-09-30-catalogo-aprendizagem.md` R-14/R-17 | Mantém visibilidade; badges de estado refletem `publicado` sem alterar regra |
| `SPEC/2026-10-01-questoes-exercicios.md` P-30 | Confirmada como fora de escopo (§5) |
| Contratos F2-01–F2-16, F3-01–F3-06 | Intocados — AC-V7 |
