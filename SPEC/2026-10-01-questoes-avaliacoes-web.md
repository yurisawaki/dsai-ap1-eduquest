# SPEC/2026-10-01-questoes-avaliacoes-web.md — Interface web de questões (exercício) e avaliações

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-10-01-questoes-avaliacoes-web.md` (SPEC de apresentação — UI de D4/D5) |
| Status | **Aprovada para implementação (2026-10-01)** |
| Data | 2026-10-01 |
| Escopo | `src/web/` — experiência do **estudante**: ver questões, responder, receber feedback, realizar avaliação, ver resultado/desempenho |
| Fontes de verdade | `SPEC/2026-10-01-questoes-exercicios.md` (D4, F3-01–F3-06, R-Q*, P-30); `SPEC/2026-10-01-avaliacoes.md` (D5, F3-07–F3-15, R-A*, P-37); `SPEC/2026-10-01-identidade-visual-frontend.md` (design system, R-V*, P-V2); código-fonte de `src/server/servicos/{questoes,avaliacoes}.ts` e `tests/api/{questoes,avaliacoes}.test.ts` |
| Resolve | **P-30** (superfície web de D4), **P-37** (superfície web de D5) e **P-V2** (UI de questões na SPEC visual) |
| Não altera | Nenhum contrato de API, schema, migration ou `src/server/` — a SPEC consome a API como está |
| Restrição da etapa | Especificação primeiro: **nesta sessão não se implementa UI** |

---

## 1. Auditoria do contrato (o que a API realmente faz)

### 1.1 Questões (D4)

| Item | Contrato verificado |
|---|---|
| Tipos | `multipla_escolha`, `verdadeiro_falso`, `numerica`, `dissertativa` |
| Listagem | `GET /modulos/{id}/questoes` (F3-02) → `[questão]` só do módulo, para leitor somente `publicado: true` com módulo **e** curso publicados (senão `404`); ordenação `criado_em, id` |
| Leitura | `GET /questoes/{id}` (F3-03); forma: `{id, moduloId, tipo, enunciado, publicado, alternativas?}` — para não-dono/não-admin **sem** `correta`, **sem** `gabarito` e **sem** `explicacao` (R-Q5; `explicacao` só aparece no feedback de F3-06) |
| Resposta | `POST /questoes/{id}/tentativas` (F3-06) — **somente papel estudante** (`403` para professor/admin); corpo por tipo: MC `{"alternativas": [ids]}` (≥1, distintos, todos da questão); V/F `{"valor": boolean}`; numérica `{"valor": number}` (correção por tolerância do gabarito); dissertativa `{"texto": string}` (1–20.000 chars). Chaves extras → `400` |
| Retorno | `201 {tentativaId, acerto: boolean\|null, feedback: {explicacao: string\|null}}` — **nunca o gabarito** (TQ-14); `acerto: null` só na dissertativa |
| Reenvio | **Sem limite**: cada envio cria nova tentativa; não há endpoint de histórico de tentativas por questão/usuário |
| Publicação | Questão nasce em rascunho (`publicado: false`); leitor não vê rascunho (`404`) |

### 1.2 Avaliações (D5)

| Item | Contrato verificado |
|---|---|
| Listagem | `GET /cursos/{id}/avaliacoes` (F3-08) → `[{id, cursoId, titulo, tentativasMax, abreEm, fechaEm, publicado}]` — **sem** questões; leitor só vê publicadas com curso publicado (senão `404`) |
| Detalhe | `GET /avaliacoes/{id}` (F3-09) → + `questoes: [{questao, peso}]` **apenas dentro da janela** `abreEm ≤ agora ≤ fechaEm`; fora da janela, só metadados (R-A4/R-A11) |
| Realizar | `POST /avaliacoes/{id}/tentativas` (F3-12) — **somente estudante**; corpo `{"respostas": [{questaoId, resposta}]}` com **envio único de todas** (cada `questaoId` no máximo uma vez; questão omitida vale 0 ponto — F-3); erros `409` fora da janela, `409` tentativas esgotadas, `400` questão fora/repetida/resposta inválida |
| Retorno | `201 {tentativaId, status: 'aguardando_correcao'\|'corrigida', nota: number\|null}` — **sem acerto por questão** (R-A11) |
| Resultado | `GET /avaliacoes/{id}/resultado` (F3-13) → `{tentativas: [{id, enviadaEm, status, nota}], tentativasRestantes, resultado}` — `resultado` = **maior nota** entre tentativas corrigidas, `null` se nenhuma (R-A10); sem aprovação/reprovação: a API não tem nota mínima |
| Pendência interna | Havendo dissertativa respondida: `status: aguardando_correcao`, `nota: null` até o dono/admin pontuar via F3-15 |
| Exercício × avaliação | São fluxos **independentes**: exercício = envio por questão com feedback imediato; avaliação = envio único **sem** feedback por questão e **sem** limite de tempo por tentativa (P-35) |

### 1.3 Erros (ordem das rotas: `401 → 404 → 403 → 409 → 400`, com exceção de papel antes de existência em F3-06/F3-12/F3-13)

| Status | Situação relevante à UI |
|---|---|
| `400` | Resposta malformada, alternativa alheia, questão repetida na avaliação, texto vazio |
| `401` | Sessão expirada/ausente |
| `403` | Papel errado (professor respondendo; estudante em rota de dono) |
| `404` | Questão/avaliação/módulo inexistente ou invisível (rascunho, curso não publicado) |
| `409` | Avaliação fora da janela; tentativas esgotadas; composição congelada (dono) |
| `500` | Erro inesperado (`mensagemDeErro` → "Erro inesperado") |

### 1.4 Limitações da API que a UI deve respeitar (não inventar)

1. **Sem % de progresso de exercícios**: não existe `GET` de tentativas do estudante por questão — a UI de exercício **não pode** exibir histórico, sequência acertada ou progresso acumulado.
2. **Sem aprovação/reprovação**: não há nota mínima — exibir apenas a nota (0–10) e o status da tentativa.
3. **Sem revelação de gabarito na avaliação** (R-A11) e **sem acerto por questão** no retorno de F3-12/F3-13 — a UI não pode mostrar "questão 3: errada".
4. **Sem cronômetro, sem rascunho, sem limite de tentativa de exercício** (P-35): envio da avaliação é instantâneo e único por tentativa; tentativas de exercício são ilimitadas.
5. **Sem correção de dissertativa pelo estudante**: `acerto: null` na avaliação fica `aguardando_correcao` até o dono/admin (F3-15).

## 2. Auditoria do frontend (padrões a seguir)

- **Cliente**: `src/web/cliente.ts` — `api(rota, {metodo, corpo})` com `credentials: 'same-origin'`; erros viram `ErroApi{status, mensagem}`; `mensagemDeErro()` extrai a mensagem amigável do contrato `{"erro": {codigo, mensagem}}` — a UI exibe essa mensagem em alerta `role="alert"` (nunca stack trace).
- **Navegação**: `App.tsx` alterna `Vista`; `PaginaCatalogo` gerencia estados internos (`cursoAberto`, `aulaAberta`) — as novas telas de questão/avaliação integram-se a **esse mesmo padrão** (estados internos do catálogo), sem novo roteador.
- **Estados**: loading (`p.carregando` + spinner), empty (`.estado-vazio` com frase + apoio), sucesso (`.alerta.alerta-sucesso` com `role="status"`), erro (`.erro` com `role="alert"`).
- **Design system**: tokens e componentes da `SPEC/2026-10-01-identidade-visual-frontend.md` (`.badge`, `.card-*`, `.botao-secundario`, `.botao-perigo`, `.grade-*`, `.lista-*`, `.skeleton-*`, `:focus-visible`, breakpoints 1024/768/480px) — **proibida** segunda identidade visual.

## 3. Fluxo do estudante (verificado contra a API)

```text
Catálogo → Detalhe do curso (existe)
  │
  ├─ Módulo
  │    └─ Questões do módulo (F3-02)            [seção nova no módulo]
  │         ├─ lista com prévia do enunciado + badge do tipo
  │         └─ abrir questão (F3-03 opcional; F3-02 já traz a forma)
  │              └─ responder (F3-06) → feedback {acerto, explicacao}
  │                   └─ "Responder de novo" (reenvio ilimitado)
  │
  └─ Avaliações do curso (F3-08)                [seção nova no curso]
       └─ detalhe (F3-09)
            ├─ fora da janela → só metadados + datas (sem questões)
            └─ dentro da janela → todas as questões (sem gabarito)
                 ├─ montar respostas (sem envio intermediário — não há rascunho)
                 ├─ revisar antes do envio
                 └─ enviar TUDO de uma vez (F3-12) → {status, nota}
                      └─ resultado (F3-13): maior nota, histórico, restantes
                           └─ voltar ao curso
```

Diferenças em relação ao fluxo-genérico sugerido na tarefa — todas decorrentes da API: **não há** etapa "enviar" por questão na avaliação (envio único); **não há** feedback por questão na avaliação; **não há** cronômetro; a navegação "próxima questão" é **livre** no exercício (a API não impõe ordem de resposta; a listagem ordena por criação).

## 4. Tela de questão (exercício)

### 4.1 Lista de questões do módulo

- Acesso: no card do módulo (detalhe do curso), seção "Questões" com contagem (`n questões`) e botão "Ver questões" → vista de questões do módulo (padrão de estado interno de `PaginaCatalogo`).
- Cada item: **prévia do enunciado** (semântica de texto simples, truncada visualmente com `line-clamp` — nunca cortar no DOM), badge do tipo (`Multipla escolha` / `Verdadeiro ou falso` / `Numérica` / `Dissertativa`) e botão "Responder".
- Questão não tem título na API — **proibido inventar título**: usar o enunciado (é o único rótulo existente).

### 4.2 Uma questão

| Elemento | Regra |
|---|---|
| Enunciado | `h1`/`h2` com texto completo, `white-space: pre-wrap`, medida ≤ 65ch |
| MC | `checkbox` (a API aceita ≥1 alternativa e o acerto exige conjunto exato) — um `<label>` por alternativa, texto da alternativa visível, opção "A/B/C…" decorativa (`aria-hidden`) |
| V/F | dois `radio`: "Verdadeiro" / "Falso" |
| Numérica | `input type="number"` com step adequado (a tolerância é do servidor — a UI não exibe gabarito/tolerância) |
| Dissertativa | `textarea` (1–20.000 chars, contador opcional) |
| Envio | botão primário "Enviar resposta" — **desabilitado** enquanto não houver resposta válida selecionada/preenchida (`disabled` + dica de campo obrigatório) |
| Durante envio | botão `disabled` + `aria-busy` (padrão `.concluida` de envio já usado na aula); formulário bloqueado |
| Após envio (feedback) | painel com: **resultado textual** — "Resposta correta" (✓) / "Resposta incorreta" (✗) / "Resposta enviada" (dissertativa, `acerto: null`); quando `feedback.explicacao !== null`, exibir "Explicação" + texto; **nunca** mostrar `gabarito` ou `correta` (não vêm na resposta) |
| Reenvio | botão secundário "Responder de novo" limpa a seleção e o feedback — **sem contador de tentativas** (a API não expõe) |
| Voltar | botão "voltar" (padrão `.voltar`) para a lista do módulo |

### 4.3 Estados da tela de questão

| Estado | Exibição |
|---|---|
| Loading lista | skeleton `.skeleton-lista` + `sr-only` "Carregando questões…" |
| Loading envio | botão `aria-busy` (spinner), demais controles bloqueados |
| Empty | `.estado-vazio`: "Nenhuma questão publicada neste módulo." + apoio ("As questões aparecem aqui quando o professor publicar.") — frase **criada** aqui, sem contrato anterior |
| Erro | alerta `.erro` com `mensagemDeErro` (400 → mensagem da própria API; 404 → "Questão não encontrada"; 401 → mensagem da API; 500 → "Erro inesperado") |
| Sucesso | painel de feedback (4.2) com `role="status"` |

## 5. Tela de avaliação

### 5.1 Lista no curso

- Nova seção "Avaliações" abaixo dos módulos no detalhe do curso: card por avaliação com **título**, **janela** (`abreEm`/`fechaEm` formatados localmente) e **tentativas máximas**; botão "Abrir avaliação".
- Sem badge de progresso (F3-08 não devolve resultado) — o desempenho só aparece no detalhe via F3-13.

### 5.2 Detalhe da avaliação (dentro da janela)

1. **Cabeçalho**: título, janela, "Restam X de Y tentativas" (de F3-13) e resultado atual (`F3-13.resultado`), quando houver.
2. **Formulário**: todas as questões da composição em sequência (F3-09 `questoes` na ordem da composição), cada uma com os mesmos controles por tipo da §4.2. **Sem envio por questão** — apenas rascunho local em memória (não persistido; a API não tem rascunho).
3. **Revisão obrigatória antes do envio**: painel com contagem "Respondidas: n de m" e lista das não respondidas (questão omitida vale 0 — F-3); botão primário "Enviar tentativa" habilitado somente com todas respondidas; aviso claro: "O envio é único e não pode ser desfeito."
4. **Após envio** (F3-12 → `201`): painel de confirmação com **status** traduzido (`corrigida` → "Corrigida", `aguardando_correcao` → "Aguardando correção do professor") e **nota** (formato `8,50` — 2 casas, vírgula decimal) ou "Nota disponível após a correção" quando `nota: null`; CTA "Ver resultado".

### 5.3 Resultado (F3-13)

| Elemento | Regra |
|---|---|
| Destaque | **Maior nota** (`resultado`) em destaque (`valor-destaque`); `null` → "Nenhuma nota corrigida ainda." |
| Restantes | "Restam X tentativas" (ou "Nenhuma tentativa restante" em `X: 0`) |
| Histórico | tabela/cards com **data de envio**, **status** (badge: `corrigida` sucesso / `aguardando_correcao` aviso) e **nota** de cada tentativa |
| Sem detalhe por questão | a API não expõe acerto/questão ao estudante (R-A11) — **proibido** exibir "acertou N de M" |
| Ação | botão "Voltar ao curso" |

### 5.4 Fora da janela (metadados sem questões)

Quando F3-09 não devolve `questoes`:
- `agora < abreEm` → `.estado-vazio`: "A avaliação ainda não está aberta." + datas ("Abre em {data} · Fecha em {data}").
- `agora > fechaEm` → `.estado-vazio`: "A janela da avaliação foi encerrada." + datas + seção de resultado (F3-13 continua acessível ao estudante).
- Detecção exclusivamente pelas datas de F3-09 (a API não devolve um campo "aberta").

### 5.5 Estados da tela de avaliação

| Estado | Exibição |
|---|---|
| Loading | skeleton de cards / `p.carregando` padrão |
| Empty lista | `.estado-vazio`: "Nenhuma avaliação disponível." + "As avaliações publicadas aparecem aqui." |
| Erro envio | alerta `.erro` com a mensagem da API: `409` "avaliacao fora da janela" → exibir texto da API em alerta; `409` "tentativas esgotadas" → alerta + CTA "Ver resultado"; `400` → mensagem da API; o formulário permanece preenchido (respostas locais não são descartadas) |
| Sucesso | painel §5.2-4 |

## 6. Requisitos

| ID | Requisito |
|---|---|
| **R-UI-1** | A UI consome **somente** F3-02/F3-03/F3-06/F3-08/F3-09/F3-12/F3-13; nenhum dado exibido existir no retorno é omitido ou simulado (§1.4) |
| **R-UI-2** | Controles de resposta por tipo: MC `checkbox`; V/F `radio`; numérica `input number`; dissertativa `textarea`; todos com `<label>` associada |
| **R-UI-3** | "Enviar resposta" fica `disabled` sem resposta válida; durante o envio, `aria-busy` + `disabled`; o envio usa `POST` correto por fluxo (F3-06 por questão; F3-12 com **todas** as respostas) |
| **R-UI-4** | Feedback do exercício exibe apenas `acerto` (texto + ícone) e `explicacao` quando não nula; **nunca** `gabarito`/`correta` |
| **R-UI-5** | A avaliação só envia quando **todas** as questões estiverem respondidas localmente; a UI avisa que o envio é único; questão omitida é listada como pendente de resposta |
| **R-UI-6** | Após F3-12, exibir `status` traduzido e `nota` com 2 casas (ou "aguardando correção"); após F3-13, exibir maior nota, restantes e histórico de tentativas — **sem** acerto por questão |
| **R-UI-7** | Fora da janela, não há formulário: só metadados + datas + resultado |
| **R-UI-8** | Loading/empty/error/success seguem §4.3/§5.5 no padrão visual do projeto; mensagens de erro vêm de `mensagemDeErro` em alerta `role="alert"` |
| **R-UI-9** | Design system único (tokens, badges, cards, botões, foco, breakpoints 1024/768/480px da SPEC visual); acerto/erro indicados por **texto + ícone**, nunca só por cor |
| **R-UI-10** | Acessibilidade: alternativas navegáveis por teclado (nativo de `input`), `:focus-visible` global, labels associadas, `aria-busy`/`role="status"`/`role="alert"` conforme §4.3/§5.5, `aria-current` na navegação existente preservado |
| **R-UI-11** | Responsividade: enunciados longos com `overflow-wrap`; listas de alternativas empilham em ≤480px; botões de envio ≥44px em touch; histórico de resultado legível em 390px |
| **R-UI-12** | Nenhum texto funcional existente de testes web é alterado; novos testes web cobrem os fluxos desta SPEC sem remover os atuais |

## 7. Crítios de aceitação

| AC | Critério | Verificação |
|---|---|---|
| AC-UI-1 | Estudante abre as questões de um módulo publicado, seleciona resposta por tipo e envia; a interface mostra o feedback retornado por F3-06 (`acerto` + `explicacao` quando presente) | teste web de F3-06 com mock |
| AC-UI-2 | Com resposta vazia/inválida o botão de envio permanece `disabled`; durante o envio o botão fica indisponível e volta ao normal em erro | teste web |
| AC-UI-3 | Nenhum componente renderiza `gabarito` ou `correta` no fluxo do estudante (grep + teste: resposta de F3-06/F3-09 mockada sem esses campos não gera tais nós) | grep em `src/web` + teste |
| AC-UI-4 | Estudante monta e envia uma avaliação completa: envio só ocorre com todas as questões respondidas; F3-12 recebe `{respostas:[…]}` com todos os `questaoId` | teste web verificando o corpo do `POST` |
| AC-UI-5 | Após F3-12 a UI exibe status e nota (ou "aguardando correção"); após F3-13 exibe maior nota, tentativas restantes e histórico — sem acerto por questão | teste web |
| AC-UI-6 | Fora da janela a UI não exibe questões nem formulário; exibe datas e estado vazio correspondente (antes/depois) | teste web com datas mockadas |
| AC-UI-7 | `409` de janela/esgotadas e `400` de validação aparecem como alerta com a mensagem da API, preservando as respostas digitadas | teste web |
| AC-UI-8 | Empty states: módulo sem questões e curso sem avaliações mostram frase + apoio no padrão `.estado-vazio` | inspeção/teste |
| AC-UI-9 | `npm test` (web atuais + novos) verde sem remoção de testes; `npm run typecheck` sem erros | execução local |
| AC-UI-10 | `docker compose build && up -d` sem erro; `/` → `200` | build + curl |
| AC-UI-11 | Nenhum arquivo de `src/server/`, `prisma/` ou `tests/api/` é alterado por esta SPEC | `git diff --stat` |

## 8. Fora de escopo

| Item | Motivo |
|---|---|
| UI de **autoria** de questões (F3-01/04/05) e de avaliações (F3-07/10/11) pelo professor | Esta SPEC cobre o estudante (P-30/P-37 tratam da superfície; autoria é fluxo T3.2/T3.5 — pendência P-UI-1) |
| **Correção manual de dissertativas** (F3-14/F3-15) | Fluxo do professor (DP-09); sem ela, `aguardando_correcao` fica aguardando — pendência P-UI-2 |
| Cronômetro, rascunho persistido, limite de tentativa de avaliação | API não suporta (P-35) |
| Histórico/progresso de exercícios, % de acertos, streaks | API não expõe tentativas do estudante (§1.4-1) — pendência P-UI-3 (exigiria novo endpoint) |
| Aprovação/reprovação, nota mínima, média ponderada de curso | Não existe na API (§1.4-2) |
| Revelação de gabarito, acerto por questão na avaliação, `explicacao` na avaliação | Proibido por R-Q5/R-A11 (§1.4-3) — pendência P-31 da SPEC de D5 |
| XP, progresso de curso, ranking, gamificação a partir de notas | P-34/P-16 (D6/D7) — SPECs futuras |
| Banco de questões, importação, modelos, analytics | Não existem na API |

## 9. Pendências registradas

| ID | Pendência |
|---|---|
| **P-UI-1** | UI de autoria de questões/avaliações (professor) |
| **P-UI-2** | UI de correção manual de dissertativas (F3-14/F3-15, professor) — sem ela, avaliações com dissertativa ficam `aguardando_correcao` sem caminho na web |
| **P-UI-3** | Progresso/histórico de exercícios exige API de leitura de tentativas por questão/usuário (hoje só `POST`) — extensão de D4 |
| **P-V2/P-30/P-37** | **Resolvidas** por esta SPEC (registro nas SPECs de origem: marcar como resolvidas na revisão seguinte a elas) |

## 10. Rastreabilidade

| De/para | Relação |
|---|---|
| `SPEC/2026-10-01-questoes-exercicios.md` P-30, §6 F3-01–F3-06, §3.2 | Esta SPEC **implementa a superfície** do fluxo do estudante de D4 sem alterar seus contratos |
| `SPEC/2026-10-01-avaliacoes.md` P-37, §6 F3-08/09/12/13, R-A4/R-A7/R-A10/R-A11 | UI consome os contratos como escritos; R-A11 restringe o que pode ser exibido |
| `SPEC/2026-10-01-identidade-visual-frontend.md` R-V1..R-V13, P-V2 | Reutiliza o design system integralmente (R-UI-9/R-UI-10); resolve P-V2 |
| `src/server/servicos/{questoes,avaliacoes}.ts` | Fonte da verdade auditada nesta sessão (§1) |
