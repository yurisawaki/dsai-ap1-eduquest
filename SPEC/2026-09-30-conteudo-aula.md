# SPEC/2026-09-30-conteudo-aula.md — SPEC de conteúdo de aula: resolução de DP-19 (EduQuest)

| Campo | Valor |
|---|---|
| Artefato | `SPEC/2026-09-30-conteudo-aula.md` (veículo de resolução de **DP-19** — "SPEC de conteúdo", `PLAN.md` §8) |
| Status | **Proposta — aguardando aprovação.** DP-19 só passa a ser considerada resolvida após (a) aprovação com status "Aprovada" no cabeçalho e (b) revisão formal posterior de `PLAN.md` §8, `decisoes-pendentes.md` e `TASKS.md` (critério em `decisoes-pendentes.md` §6; ver §10.2) |
| Data | 2026-09-30 |
| Domínio / Fase | **D3 — Catálogo de aprendizagem**, parcela conteúdo de aula · Fase **F2** (`PLAN.md` §7) |
| Tarefa relacionada | **T2.3** (`TASKS.md` — "Implementar conteúdo de aula"), hoje `[Bloqueada: DP-19]` para formato/limites; origem da pendência: T0.1/T2.1 |
| Fontes de verdade | `SPEC/2026-09-30-visao-geral.md` → `PLAN.md` → `TASKS.md` → `SPEC/2026-09-30-decisoes-pendentes.md`; decisões técnicas vinculantes: `SPEC/2026-09-30-tecnica-fundacoes.md`; baseline funcional: `SPEC/2026-09-30-catalogo-aprendizagem.md` (D3) |
| Desbloqueia (conteúdo) | Formato/limites/embed/cardinalidade de T2.3; a forma definitiva de `conteudo` de F2-13; condições de teste de T2.3 e da leitura de T2.5 |
| Não resolve | DP-04–DP-18 e DP-20+ (nenhuma); P-14–P-17 da SPEC D3 (nenhuma); nada pertencente a D2, D4–D17; progresso/XP/avaliações/certificados/matrícula/notificações (fronteiras §2.3) |
| Restrições desta etapa | Sem código; sem alterar `PLAN.md`, `TASKS.md`, SPECs existentes (`decisoes-pendentes.md`, D3, visão, técnica); sem commit; sem escolha de tecnologia externa arbitrária (§3); informação não determinável vira pendência (§11) |
| Alterações a outros artefatos | **Nenhuma nesta etapa** — revisões necessárias são listadas, não executadas (§10.2) |

---

## 1. Status

DP-19 (**"Formato de conteúdo de aula, limites de upload, embeds"**) está registrada como **Pendente** em `PLAN.md` §8 (linha DP-19), `decisoes-pendentes.md` §2/§3 e `SPEC/2026-09-30-catalogo-aprendizagem.md` §10.1, com artefato futuro designado: **"SPEC de conteúdo"**. Este documento é esse artefato.

Este documento **resolve a decisão** (formato, limites, regras de embed, cardinalidade, ordem, upload/download de anexos — cada item marcado como **Decisão DP-19** em §4) e **não cria requisitos funcionais além do que as fontes já declaram**: "conteúdo de aula (texto, mídia embedada, material anexo)" é entidade da visão §5 D3 e item do escopo de F2 (`PLAN.md` §5.3/§7); detalhar formato/limites é exatamente o que o `PLAN.md` §8 designa a esta SPEC. Onde as fontes não determinam algo e a decisão é indecidível sem inventar produto, o item vira **pendência** (§11), nunca valor arbitrário silencioso.

Condições documentais de fechamento (espelho de `decisoes-pendentes.md` §6): (1) artefato existe ✓; (2) decisão inequívoca ✓ (§4–§7); (3) status "Aprovada" — **pendente de aprovação**; (4) rastreabilidade às fontes ✓ (§3, colunas de §4/§6); (5) registro em `PLAN.md` §8/`decisoes-pendentes.md` — pós-requisito (§10.2); (6) remoção do bloqueio de T2.3 no `TASKS.md` — pós-requisito (§10.2).

---

## 2. Escopo

### 2.1 O que DP-19 decide (e onde cada ponto aparece)

| Item de DP-19 (origem: `decisoes-pendentes.md` §3 DP-19; `PLAN.md` §8/§11 item 9) | Seção |
|---|---|
| Formato exato do conteúdo de aula (texto, mídia embedada, material anexo) | §2.2, §4 R-C4–R-C6, §6.1/§6.2 |
| Limites de upload (tamanho, tipos, quantidades) | §4 R-C6, §6.3, §7 |
| Regras de incorporação (embed) e fronteira de vídeo | §4 R-C5/R-C9, §5.3, §11 P-18 |
| Forma interna de `conteudo_aula.dados` | §2.2, §6, §7.1 |
| Cardinalidade fina dos blocos (um-bloco × lista; quantidade máxima) | §4 R-C3, §6.5 |
| Ordem dos blocos (representação formal da posição) | §4 R-C2, §6.5, §7.1 |
| Mecânica de download/exibição de anexo | §4 R-C7, §6.4 |

### 2.2 Os três tipos de conteúdo (mapeamento com a visão §5 D3)

A visão §5 D3 declara a entidade "conteúdo de aula (**texto, mídia embedada, material anexo**)" — conjunto **fechado de 3 tipos**. A SPEC D3 §5.4 materializou-os como ENUM `TipoConteudo` com valores **minúsculos** (convenção da técnica §2.2.2). Mapeamento fixado por esta SPEC:

| Conceito (cobertura da DP-19) | Valor no ENUM e na API | `dados` no PUT (F2-12) | `dados` no GET (F2-13) |
|---|---|---|---|
| **TEXTO** | `texto` | `{ "texto": "<string>" }` | idem (espelho) |
| **MEDIA** | `midia_embedada` | `{ "url": "<https URL>" }` | idem (espelho) |
| **ANEXO** | `material_anexo` | `{ "arquivoId": "<UUID>" }` | `{ "arquivoId", "nome", "mime", "tamanho" }` (enriquecido pelo servidor — R-C7) |

Nenhum tipo além dos três é aceito; renomear valores do ENUM exigiria migração e contraria a convenção de minúsculas da técnica §2.2.2 — **não é feito aqui**.

### 2.3 Fora de escopo

- **D4/D5** (questões, gabarito, avaliações), **D6** (progresso/percentuais), **D7** (XP/nível), **D13** (notificações), **D16** (certificados), **D17** (moderação) — nenhum desses domínios recebe decisão ou comportamento novo; a aula continua a mesma entidade de F2; **F2-14 (conclusão) permanece intocado**.
- **Matrícula/vínculo, notificações, ranking, gamificação** — não existem em D3 (fronteiras da SPEC D3 §2.3, preservadas).
- **Armazenamento/transmissão de vídeo próprio** — proibido pela visão §6 (limite fixo; R-C9).
- **DP-04–DP-18, P-14–P-17** — nenhuma resolvida; os limites numéricos desta SPEC são revisáveis pela futura SPEC de NFRs (§11, nota).
- **Provedor de embed nomeado, serviço de armazenamento externo (CDN/arquivo em nuvem), proxy de mídia** — nenhum é escolhido: provedores são pendência P-18; armazenamento é local (§7.2), coerente com "persistência própria" (visão §6) e sem integração externa (DP-11 permanece aberta).
- **Código, migrações, seeders executáveis** — §10.3/§10.4 listam impacto e requisitos; nada é implementado nesta etapa.
- **Alterações em qualquer artefato existente** — apenas revisões listadas em §10.2.

---

## 3. Fontes e rastreabilidade

| Fonte | Seções usadas | Uso nesta SPEC |
|---|---|---|
| `SPEC/2026-09-30-visao-geral.md` | §5 D3 (entidade conteúdo de aula: texto, mídia embedada, material anexo); §4 passo 4 (consumo de aula); §6 ("não é host de vídeo… embed de provedor externo"; "persistência própria"); §7 (UI/UX, integrações, NFRs fora de escopo) | §2.2, §4 (R-C1, R-C9), §5, §11 |
| `PLAN.md` | §5.3 (escopo; pendência "formato exato de conteúdo/mídia e limites de upload — SPEC de conteúdo"); §7 F2; §8 linha DP-19 ("SPEC de conteúdo"); §11 item 9 | §1, §2.1, §10.1 |
| `TASKS.md` | T2.1, **T2.3** (descrição, validação, bloqueio `[Bloqueada: DP-19]`), T2.5, T2.6 | §1, §10.1, §12 |
| `SPEC/2026-09-30-decisoes-pendentes.md` | §2/§3 entrada DP-19; §4 Categoria B; §6 (critério de decisão resolvida) | §1, §10.2, §12 |
| `SPEC/2026-09-30-tecnica-fundacoes.md` | §2.1.3 (volume persistente), §2.2.1/§2.2.2 (convenções: UUID, timestamps, ENUM minúscula), §2.2.3 regra 4 (FKs CASCADE, transação), §2.3.1 (JSON sobre HTTP; códigos 400/401/403/404/409/500; `/api/v1`), §2.3.2 (sessão, `401`/`403`), §6.4 (P-08/P-09) | §4, §6, §7, §9; justificativa da recusa de multipart (R-C6a) |
| `SPEC/2026-09-30-catalogo-aprendizagem.md` (D3) | §3.1 passo 3, §3.3, §3.5 (F2-12/F2-13; "14 contratos"), §4 (R-14/R-17/R-18), §4.2 (matriz de rota), §5.4 (modelo; "estrutura fina → DP-19"), §7.3 (E-14–E-27, E-24), §10.1 (DP-19), §10.2 (P-14–P-17) | §4, §5, §6, §7, §9, §12 |
| Estado atual da implementação | `prisma/schema.prisma`, `src/server/servicos/catalogo.ts`, `src/server/rotas/catalogo.ts`, `src/web/paginas/Catalogo.tsx`, `tests/api/conteudo.test.ts` | §6 (compatibilidade), §10.3 (impacto) |

**Natureza de cada item (coluna da §4):** **Herdada** = regra já fixada por fonte, citada; **Derivação** = consequência lógica de regras herdadas, sem escolha nova; **Decisão DP-19** = escolha que pertence a esta DP e é feita aqui, com justificativa; **Pendência** = remetida a §11. Nenhuma decisão técnica da SPEC técnica é reaberta.

---

## 4. Regras

| ID | Regra | Natureza / detalhe | Rastreabilidade |
|---|---|---|---|
| R-C1 | **Conjunto fechado de 3 tipos** | **Herdada.** Todo bloco tem exatamente um `tipo` ∈ {`texto`, `midia_embedada`, `material_anexo`}; qualquer outro valor → `400`. Valores minúsculos preservados (ENUM da técnica §2.2.2; D3 §5.4) — sem rename. | visão §5 D3; técnica §2.2.2; D3 §5.4 |
| R-C2 | **Blocos ordenados com posição formal determinística** | **Decisão DP-19.** Aula contém **lista ordenada** de blocos; cada bloco persiste `posicao` inteira **0-based contígua** (0…n−1, sem lacunas, sem repetição na aula). O servidor **deriva a posição do índice do array** no PUT e devolve os blocos **ordenados por `posicao` ascendente** no GET, com o campo `posicao` na resposta. A ordenação por `criado_em` deixa de ser usada (empates de timestamp eram indeterminados). Justificativa: a visão trata a aula como sequência "lê/assiste" (§4 passo 4); ordem de exibição é requisito observável de consumo e o índice do array é a única fonte de verdade não ambígua. | visão §4 passo 4; D3 §5.4 ("estrutura fina → DP-19"); achado de auditoria F-02 |
| R-C3 | **Substituição total com cardinalidade definida** | **Herdada** (substituição total: D3 §3.1 passo 3) + **Decisão DP-19** (cardinalidade): corpo do PUT é **sempre um array** de **0 a 50 blocos**; `[]` limpa o conteúdo; objeto único, string, número ou array com >50 → `400`. Aceitar também objeto único (comportamento atual) é **retirado**: um contrato definitivo admite uma única forma de corpo. | D3 §3.1/§5.4; decisão DP-19 (limites) |
| R-C4 | **TEXTO: formato, limite e vazio** | **Decisão DP-19.** `dados` é objeto **exatamente** `{"texto": string}` (chaves extras/ausentes → `400`). Formato: **texto simples** com quebras de linha (`\n`), **não interpretado como HTML nem markdown** na exibição (R-C8) — justificativa: nenhum formato de apresentação está especificado nas fontes e apresentação é fronteira de DP-05/DP-06 (visão §7.5–§7.6); texto simples não introduz tecnologia de renderização nem vetor de injeção. **Vazio:** `string` com ≥1 caractere após `trim()` (só espaços/quebras → `400`). **Limite:** ≤ **20.000 caracteres** (exceder → `400`). | visão §5 D3 ("texto"); decisão DP-19; fronteira DP-05 (§11 P-20) |
| R-C5 | **MEDIA: URL de referência e regras de embed** | **Decisão DP-19** sobre base **Herdada** (D3 R-18: "o EduQuest guarda apenas a referência"; visão §6: embed de provedor externo). `dados` é objeto **exatamente** `{"url": string}`. Validação **apenas de forma** — o servidor **não busca** a URL remota (fetch externo seria integração = DP-11): esquema **`https:`**; hostname presente; **sem credenciais** (`user:pass@`); ≤ **2.048 caracteres**; URL absoluta parseável. Violação → `400` (`http:`, `javascript:`, `data:` etc. são rejeitados). **Geração de embed:** o servidor **não gera nem reescreve** URL de player (nenhum provedor é nomeado em nenhuma fonte); armazena e devolve a URL como está; exibição é `<iframe sandbox>` no cliente (R-C8). **Lista fechada de provedores/transformação para player → P-18** (§11). | visão §6; D3 R-18; técnica §2.3.1; decisão DP-19 |
| R-C6 | **ANEXO: envio, tipos, limites e armazenamento** | **Decisão DP-19.** (a) **Envio:** rota própria F2-15 (§6.3) com corpo **JSON** `{nome, mime, base64}` — **multipart é recusado em todas as rotas**, pois a técnica §2.3.1 fixa "JSON sobre HTTP" como transporte (multipart seria quebra de decisão vinculante; nenhum parser externo é introduzido). (b) **Tipos aceitos** (MIME **e** extensão obrigatoriamente coerentes): `application/pdf` (`.pdf`), `image/png` (`.png`), `image/jpeg` (`.jpg`/`.jpeg`), `image/gif` (`.gif`), `application/zip` (`.zip`) — lista **fechada**; qualquer outro MIME (inclusive `video/*`, `audio/*`, `text/html`, `image/svg+xml`) → `400`. **Vídeo é rejeitado por regra**, não por lacuna de lista (R-C9). (c) **Validação de conteúdo:** o servidor **decodifica o base64** e confere a **assinatura binária** do formato declarado (`%PDF`, `\x89PNG`, `\xFF\xD8\xFF`, `GIF8`, `PK`) e a coerência do `mime`; divergência, base64 inválido ou corpo vazio → `400`. O **tamanho é medido após decodificar** (fonte da verdade = bytes decodificados). (d) **Limites:** ≤ **5.242.880 bytes (5 MB)** por arquivo; ≤ **25 arquivos** por aula; `nome` obrigatório, sem separadores de caminho (`/`, `\`) nem caracteres de controle, ≤ **255 caracteres**. Exceder → `400` (**não `413`**: a técnica §2.3.1 fixa o conjunto de códigos e `413` não faz parte dele). (e) **Armazenamento:** binário no **sistema de arquivos da aplicação** (diretório de dados do contêiner, volume persistente — técnica §2.1.3), **nunca** em banco e **nunca** em serviço externo (visão §6 "persistência própria"; serviço externo seria DP-11); caminho derivado do UUID do arquivo, **jamais de entrada do cliente**; metadados na tabela `arquivo` (§7.2). | visão §5 D3 ("material anexo"), §6; técnica §2.1.3/§2.3.1; decisão DP-19 |
| R-C7 | **Referência e download/exibição de anexo** | **Derivação** (autorização) + **Decisão DP-19** (mecânica). O PUT referencia o anexo **apenas** por `arquivoId`; o arquivo deve existir e **pertencer à mesma aula** (senão → `400`). Ao aceitar o PUT, o servidor **enriquece e persiste** `dados` com `{arquivoId, nome, mime, tamanho}` copiados da linha de `arquivo` (metadados imutáveis após upload → sem divergência). Download/exibição: F2-16 (§6.4) devolve o binário com `Content-Type` armazenado, `Content-Disposition` com o nome original e `X-Content-Type-Options: nosniff`. **Autorização de leitura idêntica à de F2-13:** dono/admin sempre; demais papéis somente com cadeia aula→módulo→curso publicada (R-14/R-17) — falha de visibilidade responde **`404`** (não revela rascunho, E-19); sem sessão → `401`. | D3 §4 (R-14/R-17), §4.2, E-19/E-20; decisão DP-19 |
| R-C8 | **Renderização e edição no cliente** | **Decisão DP-19** (detalhe de consumo exigido por T2.3: "editor/exibição dos três tipos"). O cliente **exibe os blocos exatamente na ordem recebida** (posição ascendente do servidor), por tipo: **texto** → bloco de texto preservando quebras de linha, sem interpretar marcação; **média** → `<iframe loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" src=<url>>` + link "abrir em nova aba" (`rel="noopener"`) como recurso quando o provedor recusa iframe (X-Frame-Options; sem proxy server-side, que seria integração — DP-11); **anexo** → link de download para F2-16 exibindo `nome` e tamanho. **Edição** (somente dono/admin, mesma matriz da D3 §4.2): formulário por tipo — área de texto; campo de URL com validação `https` no cliente; campo de arquivo que lê o arquivo e envia base64 na F2-15, com `accept` restrito aos 5 MIMEs —, além de remoção de bloco; o cliente reenvia a **lista completa** no PUT (substituição total), preservando a ordem relativa dos remanescentes. **Reordenação explícita (arrasto) não é criada**: não é requisito de nenhuma fonte (D3 §8 → P-17); a API já aceita outra ordem se o array for enviado em outra ordem. | TASKS T2.3; D3 §3.1/§4.2/§8; visão §6; decisão DP-19 |
| R-C9 | **Fronteira de vídeo (limite fixo)** | **Herdada.** Nenhum caminho armazena ou transmite vídeo: F2-15 rejeita `video/*`; F2-12 não aceita binário; mídia de aula é somente URL externa (R-C5). Verificação obrigatória em T2.6. | visão §6; D3 R-18/AC-10; TASKS T2.3/T2.6 |
| R-C10 | **Validação estrita de corpo e ordem de avaliação** | **Decisão DP-19.** Chaves do objeto `dados` são **fechadas por tipo** (extras ou ausentes → `400`); a chave `posicao` **não é aceita** no corpo do PUT (posição deriva do índice — R-C2); `dados` não-nulo obrigatório (já fixado pela D3/E-24). **Ordem de avaliação das respostas** (preserva comportamento já implementado e testado): `401` (sessão, middleware) → `404` (aula inexistente) → `403` (não-dono/não-admin, E-16) → `400` (corpo). | D3 §4.2, E-14/E-16/E-18/E-24; comportamento atual de `substituirConteudo`; decisão DP-19 |

---

## 5. Fluxo

### 5.1 Produção — professor escreve o conteúdo (T2.3)

1. Professor dono (ou admin) abre a aula (F2-13 em preview de rascunho — E-20: `200` para dono/admin).
2. Se houver material de arquivo: envia cada arquivo via **F2-15** (`POST /api/v1/aulas/{id}/arquivos`, JSON+base64) → `201 {arquivoId, nome, mime, tamanho}`. **Contrafluxos:** sem sessão → `401`; aula inexistente → `404`; não-dono/admin → `403`; MIME/extensão/assinatura/tamanho/vazio/limite de 25 arquivos → `400`; corpo multipart → `400` (R-C6a).
3. Monta a **lista de blocos** na ordem desejada e envia **F2-12** (`PUT /api/v1/aulas/{id}/conteudo`, array de 0–50) → `204`. O servidor valida tudo **antes** de escrever, apaga os blocos anteriores e insere os novos com `posicao` 0…n−1 em **transação única** (§7.3). **Contrafluxos:** `401`/`404`/`403` (R-C10); `400` por corpo inválido (R-C3–R-C6, R-C10); `arquivoId` desconhecido ou de outra aula → `400`.
4. Publica curso/módulo/aula (F2-04/F2-07/F2-10 — inalterado, R-16).

### 5.2 Consumo — leitor abre a aula (T2.5 / passo 4 do fluxo da visão)

1. Usuário autenticado abre a aula (**F2-13**) → `200 {id, titulo, publicado, conteudo}` com `conteudo` **ordenado por `posicao`** e cada bloco `{id, tipo, posicao, dados}` (R-C2).
2. Aula só é consumível quando publicada (R-14): não publicada lida por não-dono/admin → `404` (E-20); dono/admin → `200` (preview).
3. Cliente renderiza por tipo na ordem recebida (R-C8): texto puro; mídia em iframe sandbox com link alternativo; anexo como link **F2-16**, cuja autorização replica a visibilidade da aula (R-C7).
4. Conclusão da aula (F2-14) permanece **inalterada** — esta SPEC não toca em registro de conclusão, progresso ou XP (§2.3).

**Contrafluxos de consumo:** `401` sem sessão; `404` inexistente/não-visível; `400` não ocorre em GET (sem corpo); binário de anexo ausente fisicamente → `404` na F2-16.

### 5.3 Frontend (regras por tipo e ordem)

Detalhado em R-C8. Resumo verificável: (a) ordem exibida = ordem do servidor, sem reordenação do cliente; (b) três comportamentos distintos de renderização; (c) editor só para dono/admin, com campos dedicados por tipo (não mais JSON livre — §10.3); (d) nenhum `dangerouslySetInnerHTML` nem interpretação de marcação; (e) nenhum mecanismo de upload além da F2-15 (JSON+base64).

---

## 6. Contratos

Todos sob `/api/v1`, JSON sobre HTTP, erro `{"erro": {"codigo", "mensagem"}}` e códigos `400/401/403/404` (técnicas §2.3.1–§2.3.2 — **nenhum código novo**). F2-12 e F2-13 são os contratos já registrados na SPEC D3 §3.5, aqui **fixados definitivamente** (o "corpo remetido a DP-19" daquela tabela passa a ter o formato abaixo). F2-15 e F2-16 são **contratos novos, criados por decisão DP-19** (mecânica de anexo exigida por T2.3: "material anexo"), na continuação da série F2 — exige revisão do contador "14 contratos" da D3 §3.5 (§12, conflito C-1).

### 6.1 F2-12 (definitivo) — PUT `/api/v1/aulas/{id}/conteudo`

| Campo | Definição |
|---|---|
| Conteúdo | `Content-Type: application/json` **obrigatório** (multipart ou outro tipo → `400`) |
| Corpo | **array** de 0–50 blocos; bloco = `{"tipo": <3 valores>, "dados": <objeto fechado por tipo — §2.2>}`; **sem** campo `posicao` |
| Substituição | total: blocos anteriores da aula são apagados e o array é gravado na ordem dada (posições 0…n−1) |
| Sucesso | `204` sem corpo |
| Erros | `401` sem sessão (E-14) · `404` aula inexistente (E-18) · `403` não-dono/admin (E-16) · `400` corpo/validade: não-array, >50 blocos, bloco não-objeto, `tipo` inválido, `dados` ausente/nulo, chaves extras/ausentes no `dados` do tipo, `texto` vazio/`>20.000`, `url` fora de R-C5, `arquivoId` desconhecido/outro/aula, `posicao` no corpo, JSON malformado (**E-24 concretizada**) |
| Ordem de avaliação | `401` → `404` → `403` → `400` (R-C10) |

Exemplo de corpo:

```json
[
  { "tipo": "texto", "dados": { "texto": "Bem-vindos à aula 1.\nLeiam o texto abaixo." } },
  { "tipo": "midia_embedada", "dados": { "url": "https://provedor.example/embed/abc" } },
  { "tipo": "material_anexo", "dados": { "arquivoId": "3f1c2b4a-0000-4000-8000-000000000001" } }
]
```

### 6.2 F2-13 (definitivo) — GET `/api/v1/aulas/{id}`

| Campo | Definição |
|---|---|
| Sucesso | `200` `{"id", "titulo", "publicado", "conteudo": [...]}`; `conteudo` **ordenado por `posicao` asc**, item = `{"id", "tipo", "posicao", "dados"}`; `posicao` ∈ 0…n−1 contígua; `dados` conforme §2.2 (anexo enriquecido — R-C7) |
| Aula sem conteúdo | `conteudo: []` (array vazio, nunca `null`) |
| Erros | `401` (E-14) · `404` inexistente ou cadeia não publicada para não-dono/admin (E-19/E-20) |
| Inalterado | demais campos e regras de visibilidade da D3 §3.5 |

### 6.3 F2-15 (novo, decisão DP-19) — POST `/api/v1/aulas/{id}/arquivos`

| Campo | Definição |
|---|---|
| Propósito | Enviar um arquivo de material anexo antes de referenciá-lo no F2-12 |
| Corpo | JSON: `{"nome": string, "mime": string, "base64": string}` — exatamente essas 3 chaves (extras/faltantes → `400`) |
| Autorização | professor dono do curso ou administrador (mesma matriz da D3 §4.2 para F2-04–F2-12); violação → `403` |
| Sucesso | `201` `{"arquivoId", "nome", "mime", "tamanho"}` — `tamanho` = bytes **decodificados** |
| Erros | `401` · `404` (aula) · `403` · `400`: base64 inválido/vazio, `>5 MB`, MIME fora da lista, extensão incoerente, assinatura divergente, `nome` inválido/`>255`, 25 arquivos já existentes na aula, **`Content-Type` não-JSON (inclusive multipart)** |
| Não faz | não associa o arquivo a bloco (isso é F2-12); não aceita vídeo (R-C9) |

### 6.4 F2-16 (novo, decisão DP-19) — GET `/api/v1/arquivos/{id}`

| Campo | Definição |
|---|---|
| Propósito | Download/exibição do material anexo |
| Autorização | qualquer papel autenticado **com visibilidade da aula** (R-C7 — idêntica à F2-13); dono/admin sempre |
| Sucesso | `200` binário: `Content-Type` = mime armazenado; `Content-Disposition` com nome original; `X-Content-Type-Options: nosniff` |
| Erros | `401` sem sessão · `404` arquivo inexistente **ou** aula não visível (não revela rascunho, E-19) |
| Não faz | não redireciona para URL externa; não há streaming de vídeo (anexo é material, mídia de aula é R-C5) |

### 6.5 Cardinalidade e ordem (resumo)

| Relação | Cardinalidade | Representação |
|---|---|---|
| aula → blocos | **0…50** (0 = aula vazia) | lista ordenada; `posicao` 0…n−1 contígua e única por aula (§7.1) |
| bloco → tipo | exatamente **1** de 3 | ENUM `TipoConteudo` |
| aula → arquivos | **0…25** | tabela `arquivo` (§7.2); arquivos são independentes dos blocos (podem existir sem referência — §11 P-19) |
| bloco `material_anexo` → arquivo | **1 → 1**, mesmo `aula_id` | referência por UUID validada no PUT |

---

## 7. Modelo físico

Convenções herdaadas da técnica §2.2.1/§2.2.2 (PostgreSQL; PK UUID gerado pela aplicação; timestamps `criado_em`/`atualizado_em`; ENUM minúscula; FKs `ON DELETE CASCADE` §2.2.3 regra 4; transação em operações compostas). **A parcela de P-08 já foi cumprida pela SPEC D3 §5; esta SPEC apenas altera/acrescenta** — a revisão formal da técnica continua sendo pós-requisito (D3 §9.4, §10.2 abaixo).

### 7.1 `conteudo_aula` — alterações (decisão DP-19)

| Dado | Mudança | Motivo / rastreabilidade |
|---|---|---|
| `posicao` | **NOVA coluna** `INTEGER NOT NULL` | R-C2: ordem determinística substitui a ordenação por `criado_em` (indeterminada em empates) |
| `tipo` | inalterado — ENUM(`texto`, `midia_embedada`, `material_anexo`) NOT NULL | R-C1 (sem rename) |
| `dados` | inalterado — `JSONB NOT NULL`; **forma interna agora fixada** (§2.2/§6) — era "DP-19 não definida" na D3 §5.4 | R-C4–R-C7 |
| índice | `@@index([aula_id])` → **`@@unique([aula_id, posicao])`** | ordenação é o acesso dominante do F2-13 e a unicidade por aula materializa "contíguo sem repetição" (R-C2) |
| `id`, `aula_id`, timestamps | inalterados | técnica §2.2.1 |

### 7.2 `arquivo` — NOVA tabela (decisão DP-19)

| Dado | Tipo/restrição | Papel |
|---|---|---|
| `id` | UUID (PK, aplicação) | `arquivoId` de F2-15/F2-12/F2-16; nomeia o binário no disco (caminho nunca vem do cliente) |
| `aula_id` | FK → `aula.id` (**ON DELETE CASCADE**), INDEX | arquivo pertence à aula; excluir aula/módulo/curso remove os registros (D3 §7.3/P-16 preservados) |
| `nome` | VARCHAR(255) NOT NULL | nome original saneado (R-C6d), exibido no download |
| `mime` | VARCHAR(100) NOT NULL | um dos 5 MIMEs de R-C6b; `Content-Type` do download |
| `tamanho` | INTEGER NOT NULL | bytes decodificados (≤ 5 MB) |
| `criado_em` / `atualizado_em` | TIMESTAMP NOT NULL | técnica §2.2.1 |

Binário **fora do banco** — arquivo no sistema de arquivos do contêiner (R-C6e). A exclusão física do binário acompanha a exclusão da linha (regra de implementação); expurgo de arquivos não referenciados → §11 P-19.

### 7.3 Substituição e ciclo de vida

1. **PUT (F2-12):** validação completa **antes** de qualquer escrita → transação única [`DELETE` de todos os blocos da aula + `INSERT` dos novos com `posicao` = índice]; array vazio → apenas `DELETE`. Ou falha tudo, ou grava tudo (técnicas §2.2.3 regra 4).
2. **PUT não toca em `arquivo`:** remover bloco `material_anexo` deixa o arquivo referencialmente órfão (registro e binário permanecem até a exclusão da aula; §11 P-19).
3. **F2-15** insere linha + binário; a contagem de 25 por aula consulta `arquivo.aula_id`.
4. **Exclusão de aula** (F2-11) apaga blocos e arquivos por CASCADE, e o binário acompanha a linha — efeitos sobre progresso/certificados continuam sob **P-16 da D3** (não tratados aqui).
5. **Nenhuma coluna nova em `aula`, `modulo` ou `curso`**; nenhum outro domínio é modelado.

---

## 8. Critérios de aceitação

Critérios **documentais** (AC) e **testáveis** (TC). TCs são objetivos para T2.3/T2.6 e devem ser automatizados em `tests/api/conteudo.test.ts` (suíte atual: 56/56 ✓).

### 8.1 Documentais

| ID | Critério |
|---|---|
| AC-01 | Os 3 tipos de R-C1 cobrem os 3 conceitos da visão §5 D3, sem 4º tipo, sem rename do ENUM |
| AC-02 | Toda resposta GET/F2-13 traz `conteudo` ordenado por `posicao` 0…n−1 contígua (R-C2) |
| AC-03 | F2-12 aceita **apenas** array (0–50); objeto único/string/número → 400 (R-C3) |
| AC-04 | TEXTO: formato exato, texto simples, 1–20.000 chars (R-C4) |
| AC-05 | MEDIA: só `https`, URL forma-validada, servidor não busca a URL (R-C5) |
| AC-06 | ANEXO: só 5 MIMEs+extensões coerentes, assinatura binária conferida, ≤5 MB, ≤25/aula, nome saneado (R-C6) |
| AC-07 | Upload é JSON+base64; **multipart → 400** em todas as rotas (R-C6a; técnica §2.3.1) |
| AC-08 | GET de anexo replica a autorização da aula (dono/admin sempre; outros só publicado; falha → 404) (R-C7) |
| AC-09 | Cliente exibe na ordem do servidor com 3 renderizações distintas, sem interpretar marcação (R-C8) |
| AC-10 | Nenhum caminho armazena/transmite vídeo; `video/*` → 400 (R-C9; visão §6) |
| AC-11 | Ordem de avaliação 401→404→403→400 preservada; nenhum código HTTP novo (R-C10; técnica §2.3.1) |
| AC-12 | `dados` do GET tem forma idempotente ao PUT (espelho), exceto anexo enriquecido (§6.1/§6.2) |
| AC-13 | Substituição total em transação única; array vazio limpa (§7.3) |
| AC-14 | Novo contrato F2-15/F2-16 rastreável a decisão DP-19 e não conflita com regra existente (§12) |
| AC-15 | Nenhuma alteração em F2-14, D4–D7, D13, D16, D17, P-14–P-17 (§2.3) |
| AC-16 | Nenhum artefato existente é alterado nesta etapa (§10.2/§10.5) |

### 8.2 Testáveis

| ID | Teste objetivo |
|---|---|
| TC-01 | PUT `[]` → 204; GET → `conteudo: []` |
| TC-02 | PUT objeto único → 400; PUT 51 blocos → 400; PUT string → 400 |
| TC-03 | PUT 3 blocos (ordem mista) → 204; GET devolve `posicao` 0,1,2 na ordem enviada |
| TC-04 | PUT `{"tipo":"texto","dados":{"texto":"   "}}` → 400; texto de 20.001 chars → 400; 20.000 chars → 204 |
| TC-05 | PUT `dados` com chave extra (ex.: `{"texto":"x","cor":"vermelho"}`) → 400; chave `posicao` no corpo → 400 |
| TC-06 | PUT mídia `http://…` → 400; `javascript:alert(1)` → 400; `https://provedor.example/embed/abc` → 204 e GET devolve a URL idêntica (sem rewrite) |
| TC-07 | POST F2-15 `Content-Type: multipart/form-data` → 400; JSON com MIME `video/mp4` → 400; `text/html` → 400; `image/svg+xml` → 400 |
| TC-08 | POST F2-15 PDF válido (assinatura `%PDF`) → 201 com `tamanho` = bytes decodificados; base64 de PNG declarado como `application/pdf` → 400 (assinatura divergente) |
| TC-09 | POST F2-15 com 6 MB → 400 (não 413); 26º arquivo da aula → 400; `nome: "../../etc/passwd"` → 400 |
| TC-10 | POST F2-15 sem sessão → 401; aula inexistente → 404; não-dono → 403 |
| TC-11 | PUT referenciando `arquivoId` de outra aula → 400; desconhecido → 400; da mesma aula → 204 e GET devolve `{arquivoId, nome, mime, tamanho}` |
| TC-12 | GET F2-16 sem sessão → 401; arquivo de aula rascunho por terceiro → 404; por dono → 200 com `Content-Type` correto e `X-Content-Type-Options: nosniff` |
| TC-13 | PUT com `dados: null` → 400 (E-24); corpo malformado → 400 |
| TC-14 | Verificação de limite de vídeo: rota F2-15 não aceita `video/*` (coberto por TC-07) e F2-12 não tem caminho de upload (sem multipart) |
| TC-15 | GET/F2-13 devolve `conteudo` sempre como array (nunca `null`) para aula sem blocos |

---

## 9. Erros e contrafluxos

`E-24` da D3 §7.3 ("corpo inválido") é **concretizada** por esta SPEC; nenhum código novo é criado (técnicas §2.3.1: 400/401/403/404/409/500 — nenhum 413/415/422 é introduzido; 409 não se aplica: substituição total resolve qualquer conflito pré-existente; 500 permanece para falha interna — D3 E-25).

| ID | Situação | HTTP | Comportamento |
|---|---|---|---|
| DC-01 | Corpo do F2-12 não é array / >50 / bloco malformado / `tipo` inválido / `dados` ausente ou chaves erradas / `posicao` no corpo | 400 | validação pré-escrita; nada gravado |
| DC-02 | `texto` vazio após trim ou >20.000 chars | 400 | idem |
| DC-03 | `url` fora de R-C5 (`http`, `javascript`, `data`, sem host, sem `https`, >2.048, com credencial) | 400 | idem |
| DC-04 | F2-15: corpo não-JSON (multipart/form-data, text/plain…) | 400 | rejeição por middleware de JSON — regra da técnica §2.3.1 |
| DC-05 | F2-15: MIME fora dos 5 / extensão incoerente / assinatura divergente / base64 inválido ou vazio / >5 MB / nome inválido / 25 arquivos já presentes | 400 | validação antes de gravar disco |
| DC-06 | F2-15: `arquivoId` desconhecido ou de outra aula no PUT | 400 | validação cruzada aula↔arquivo |
| DC-07 | Sem sessão (qualquer rota nova) | 401 | `nao_autenticado` |
| DC-08 | Aula inexistente | 404 | antes da checagem de papel |
| DC-09 | Dono/admin ausente e papel insuficiente | 403 | E-16 — não-admin/não-dono em escrita |
| DC-10 | Aula não publicada lida por não-dono/admin (F2-13 e F2-16) | 404 | E-19 — não revela existência |
| DC-11 | Arquivo referenciado no PUT não existe na tabela `arquivo` | 400 | hoje "conteúdo bloqueado" (E-24); passa a ser regra explícita |
| DC-12 | Falha interna (disco cheio, exceção de transação) | 500 | transação revertida; binário não gravado sem linha, linha não gravada sem binário |

**Contrafluxos não listados permanecem com a definição da D3 §7.3** (E-14…E-27) — esta tabela não substitui aquela; sobrepõe apenas E-24.

---

## 10. Impacto nas tarefas

### 10.1 Tarefas afetadas

| Tarefa | Efeito |
|---|---|
| **T2.3** (conteúdo de aula) — hoje `[Bloqueada: DP-19]` | Desbloqueada após aprovação: especificação completa em §4/§6/§7/§8. T2.3 inclui F2-12, F2-15, F2-16 (contratos novos são da decisão DP-19, na continuação de F2) |
| **T2.5/T2.6** | Leitura/validação passam a ter objetividade: TC-01…TC-15; T2.6 mantém verificação de R-C9 (sem vídeo) |
| **T0.1/T2.1** | Origem da pendência: após revisão formal (§10.2), `TASKS.md` T2.3 perde o rótulo de bloqueio |
| **F2-14** | Não afetada (§2.3) |

### 10.2 Revisões formais exigidas (não executadas nesta etapa — ACP)

| Artefato | Revisão necessária |
|---|---|
| `PLAN.md` | §8: linha DP-19 muda para **"Resolvida (ver SPEC/2026-09-30-conteudo-aula.md)"** com data; §5.3 remove a pendência de "formato exato/limites de upload"; §11 item 9 reavaliado (parte resolvida por esta SPEC, parte pendente: P-18–P-21) |
| `decisoes-pendentes.md` | §2/§3: DP-19 → "Resolvida"; §6: checar os 6 critérios (status "Aprovada" é pré-condição) |
| `TASKS.md` | T2.3: remove `[Bloqueada: DP-19]`; adiciona F2-15/F2-16 aos passos; T2.6 mantém R-C9 |
| `SPEC/2026-09-30-catalogo-aprendizagem.md` (D3) | §3.5: "corpo remetido a DP-19" → corpo de §6.1; "14 contratos" → 16 (F2-15/F2-16); §5.4: `dados` "DP-19 não definida" → §2.2; nota em §10.1 (DP-19 resolvida) e §10.2 (novas pendências P-18…P-21 apontadas para a SPEC de conteúdo) |
| `SPEC/2026-09-30-tecnica-fundacoes.md` | §2.3.1: regra de multipart já está coerente (JSON único) — **nenhuma alteração necessária**; apenas validar que a nova tabela `arquivo` e o `posicao` de `conteudo_aula` são registrados na revisão de P-08 |
| `SPEC/2026-09-30-visao-geral.md` | **Nenhuma** — §5/§6 já contêm os três tipos e o limite de vídeo (rastreabilidade §3) |

Nenhuma dessas revisões é executada agora (restrição: não alterar artefatos existentes).

### 10.3 Impacto na implementação (quando T2.3 for executada)

| Arquivo | Mudança |
|---|---|
| `prisma/schema.prisma` | `conteudo_aula`: +`posicao INT NOT NULL`, `@@unique([aula_id, posicao])` (substitui o índice simples); nova `arquivo` (§7.2); migração Prisma nova (backfill de `posicao` = `criado_em` ordenado ou reset de conteúdo existente — ver nota) |
| `src/server/servicos/catalogo.ts` | `blocosConteudo`/`lerAula`: ordenar por `posicao` + validar posição contígua; `substituirConteudo`: validação estrita por tipo (R-C3–R-C7, R-C10), transação renumerando 0…n−1; novos serviços: `criarArquivo` (decode/validação/assinatura/limites) e `lerArquivo` (autorização + streaming do disco) |
| `src/server/rotas/catalogo.ts` | F2-12 (corpo array-only); **novas rotas F2-15/F2-16** com mesma cadeia de sessão/papel |
| `src/web/paginas/Catalogo.tsx` | Substituir a edição JSON livre por **formulário por tipo** (texto/URL/arquivo → base64) + lista renderizada na ordem do servidor com as 3 renderizações (R-C8); remoção de bloco preserva ordem relativa |
| `tests/api/conteudo.test.ts` | Ajustar asserções atuais de "objeto único → 204" para TC-02 (400) e "não existe caminho de upload" para TC-07/TC-14; adicionar TC-01…TC-15 |
| `tests/api/catalogo.test.ts` / `conclusao.test.ts` | Nenhuma mudança esperada (F2-14 e visibilidade intocadas) |
| Seeders | Apenas requisitos — §10.4 (seeders em si pertencem a F13) |

**Nota de backfill (pendência de dado existente):** se houver conteúdo de aula gravado em produção/anterior à migração, o `posicao` precisa ser derivado — opções são ordem de `criado_em` (ambígua em empates) ou reset de conteúdo; como o ambiente é pré-lançamento e seeders ainda não existem (F13), a decisão de migração de dado fica registrada como detalhe de implementação de T2.3 e, se produzir dúvida, vira pendência (§11, nota P-21).

### 10.4 Seeders — requisitos (sem executar)

Quando F13 criar seeders de conteúdo de aula, devem satisfazer: (a) cobrir os **3 tipos**; (b) blocos com `posicao` contígua começando em 0; (c) aulas publicadas **e** não publicadas (E-19/E-20); (d) anexos referenciados existirem em `arquivo` (mesma aula) e terem binário consistente no disco; (e) respeitar os limites (≤50 blocos, ≤25 arquivos, ≤5 MB); (f) nenhum vídeo binário (R-C9); (g) URLs de mídia `https` plausíveis sem exigir rede. Seeders **não** são criados nesta etapa (documento-only).

### 10.5 Fora do impacto (confirmado)

Nenhum arquivo de código, migração ou teste é alterado nesta etapa; único artefato criado é esta SPEC (ver §12/relatório final).

---

## 11. Pendências

Itens que as fontes **não determinam** e que não podem ser decididos sem inventar produto/tecnologia. Cada um é registro novo derivado de DP-19 (ir à mesma `decisoes-pendentes.md` na revisão formal — §10.2):

| ID | Pendência | Origem / motivo |
|---|---|---|
| **P-18** | **Lista fechada de provedores de mídia embedada** e transformação de URL de página → URL de player (sempre `https`, sem proxy). R-C5 armazena/devolve a URL crua e o cliente usa iframe+link; a escolha de provedores concretos (e quais aceitam `sandbox`) não consta de nenhuma fonte e nomear provedor agora seria escolha arbitrária de integração | visão §6 (embed de "provedor externo" — sem nomes); DP-11 segue aberta para qualquer coisa que exija rede |
| **P-19** | **Política de expurgo de arquivos órfãos**: PUT não toca `arquivo` (§7.3); remover todos os blocos `material_anexo` deixa linhas+binário sem referência até a exclusão da aula. Opções (reaproveitar com contador, expurgo em cascata, lixeira) têm custo/perfis distintos e não são requeridas por nenhuma fonte | decisão DP-19 optou por não depurar no PUT (deixaria upload impossível se reordenar sem reenviar — ver DC-11) para manter substituição total simples; política é produto |
| **P-20** | **Texto enriquecido (HTML restrito ou markdown)**: R-C4 fixa texto simples por segurança e por fronteira; se produto quiser formatação, exige definir subconjunto, sanitização e política CSP — DP-05/DP-06 não estão resolvidas | visão §7.5–§7.6 (fronteira de design); segurança (SVG/HTML proibidos — R-C6b) |
| **P-21** | **Revisão dos limites numéricos** (20.000 chars, 5 MB, 25 arquivos, 50 blocos, 2.048 chars de URL): valores adotados como pontos de partida consistentes com "nenhum NFR em escopo" (visão §7); a SPEC de NFRs (**DP-04**) pode fixá-los formalmente | visão §7.1 (NFRs fora do escopo); DP-04 pendente |
| Nota | **Backfill de `posicao`** (§10.3) pode gerar decisão de migração se houver dado existente — hoje não há (pré-lançamento, seeders F13 ausentes); se materializar, abrir pendência em vez de decidir silenciosamente | ambiente de dados atuais |

Não resolvidas por esta SPEC (apenas listadas para rastreabilidade, sem novidade): **DP-04, DP-05, DP-06, DP-11, DP-13, DP-16, DP-17** e todas as demais de `decisoes-pendentes.md`; **P-14–P-17** da D3.

---

## 12. Checklist de consistência

### 12.1 Cobertura de DP-19

| Item exigido de DP-19 | § |
|---|---|
| Formato exato (3 tipos) | §2.2, §4 R-C1/R-C4–R-C7 |
| Limites de upload | §4 R-C6, §6.3, §7 |
| Regras de embed + fronteira de vídeo | §4 R-C5/R-C9, §5.3 |
| `dados` interno | §2.2, §6 |
| Cardinalidade fina | §4 R-C3, §6.5 |
| Ordem | §4 R-C2, §6.5, §7.1 |
| Download/exibição de anexo | §4 R-C7, §6.4 |

### 12.2 Conflitos com a SPEC D3 (identificados, não executados)

| ID | Conflito | Resolução nesta SPEC |
|---|---|---|
| C-1 | D3 §3.5: "**14 contratos**"; F2-12 com "corpo remetido a DP-19" | F2-12 fixado (§6.1); **+2 contratos** F2-15/F2-16 → 16; revisão D3 §3.5 em §10.2 |
| C-2 | D3 §5.4: `dados` "estrutura fina — **DP-19 não definida**" | Estrutura fechada por tipo (§2.2); nova tabela `arquivo` (§7.2); revisão D3 §5.4 em §10.2 |
| C-3 | D3 E-24: "corpo inválido" genérico | Concretizada em DC-01…DC-06/DC-11 (§9); D3 §7.3 segue válida como base |
| C-4 | `conteudo.test.ts`: "objeto único … 204" e "não existe caminho de upload" | Contradizem R-C3/R-C6a → TC-02/TC-07/TC-14; ajuste em §10.3 |
| C-5 | `Catalogo.tsx`: editor de **JSON livre** | Insuficiente para os 3 tipos (R-C8); substituído por formulário por tipo (§10.3) |
| C-6 | `TASKS.md` T2.3 / `decisoes-pendentes.md`: texto de bloqueio "formato/limites indefinidos" | Stale após aprovação — revisão formal em §10.2 (não executada) |
| C-7 | Ordenação atual por `criado_em` (serviço `lerAula`) | Substituída por `posicao` (R-C2) — é a correção do achado de auditoria F-02 |

Nenhum conflito permanece sem resolução definida; todos têm caminho de revisão em §10.2.

### 12.3 Fronteiras preservadas

| Fronteira | Status |
|---|---|
| D4/D5 (avaliações), D6 (progresso), D7 (XP), D13 (notificações), D16 (certificados), D17 (moderação) | intocados (§2.3) |
| F2-14 conclusão | intocada (§5.2) |
| P-14–P-17 (D3) | intactas (§2.3) |
| Persistência própria, sem vídeo, sem provedor nomeado, sem serviço externo, sem proxy de mídia | cumprido (R-C5/R-C6/R-C9, §2.3, P-18) |
| JSON sobre HTTP; códigos 400/401/403/404 (nenhum novo) | cumprido (R-C6a, §6, §9) |
| Nenhum artefato existente alterado; nenhum código; nenhum commit | cumprido (§10.2/§10.5) |
| Sem inventar progresso/XP/avaliação/certificado/matrícula/notificação | cumprido |
| Informação não determinável → pendência | P-18…P-21 + nota backfill (§11) |

### 12.4 Comandos de validação executados nesta etapa

| Comando | Resultado |
|---|---|
| `git status --porcelain` | único artefato novo da SPEC + 3 arquivos de teste já modificados (F-01/F-02 da etapa anterior) |
| Verificação de 12 seções obrigatórias (`grep -c '^## '`) | 12 |
| IDs de série completos | AC-01…AC-16, TC-01…TC-15, DC-01…DC-12 |
| Cobertura dos 7 itens de DP-19 | §12.1 |
| Código/lint | não aplicável (documento Markdown; etapa sem código) |

---

*Documento gerado em 2026-09-30 como resolução de DP-19. Somente após aprovação (status "Aprovada" no cabeçalho) e execução das revisões de §10.2, a DP-19 passa a constar como resolvida em `PLAN.md` e `decisoes-pendentes.md`, e T2.3 deixa o bloqueio.*

