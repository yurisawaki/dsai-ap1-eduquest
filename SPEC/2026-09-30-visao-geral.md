# SPEC/2026-09-30-visao-geral.md — EduQuest: Visão Geral do Sistema

| Campo | Valor |
|---|---|
| Status | Aprovada para próxima etapa (PLAN) |
| Data | 2026-09-30 |
| Processo | SDD: SPEC → PLAN → TASKS → implementação → testes → revisão |
| Escopo | Visão geral do produto e do sistema (requisitos fundamentais) |
| Próxima etapa | `PLAN.md` derivado exclusivamente desta SPEC |
| Fora de escopo desta etapa | Código, PLAN.md, TASKS.md, SPECs por domínio, stack tecnológica |

---

## 1. O que é o EduQuest

O EduQuest é uma plataforma web de ensino gamificada. Ela permite que estudantes consumam cursos e aulas, realizem exercícios e avaliações e acompanhem seu progresso acadêmico, enquanto a plataforma aplica mecânicas de gamificação para sustentar a motivação e a constância no estudo.

Na prática, o EduQuest combina duas camadas:

1. **Camada de ensino** — estrutura de aprendizagem composta por cursos, módulos, aulas, exercícios, questões e avaliações, com acompanhamento do progresso acadêmico de cada estudante.
2. **Camada de gamificação** — sistema de recompensas e engajamento composto por XP, níveis, conquistas, missões, desafios, rankings, recompensas, moedas virtuais, loja e inventário.

O produto se apoia ainda em camadas transversais: identificação e perfis (estudante e professor), notificações, recursos sociais, analytics, certificados e administração.

**Definições-chave usadas nesta SPEC:**

- **XP**: pontos de experiência concedidos por ações de aprendizagem (concluir aula, acertar questão, entregar avaliação). Não pode ser comprado nem transferido.
- **Nível**: faixa de progresso do estudante derivada de XP acumulado. Subir de nível é irreversível.
- **Moedas virtuais**: moeda ganha por conquistas de progresso; serve como meio de troca na loja.
- **Conquista**: marco atingido de forma permanente (ex.: primeiro curso concluído).
- **Missão**: objetivo com prazo ou janela de tempo, com recompensa ao cumprimento (ex.: estudar 3 dias seguidos).
- **Desafio**: atividade competitiva ou de dificuldade elevada, com classificação ou recompensa diferenciada (ex.: questão bônus, desafio semanal).
- **Ranking**: ordenação de estudantes por uma métrica (XP semanal, nível, progresso) em um escopo (curso, turma, global) e período.
- **Recompensa**: bem concedido ao estudante (item de loja, badge, moedas, XP bônus).
- **Loja**: vitrine onde o estudante troca moedas virtuais por recompensas.
- **Inventário**: conjunto de recompensas que o estudante já possui.
- **Progresso acadêmico**: estado de avance do estudante em aulas, módulos, cursos e avaliações.

---

## 2. Problema que o EduQuest resolve

**Problema central:** plataformas de ensino tradicionais entregam conteúdo, mas não sustentam a constância do estudante. O abandono de cursos online é alto e a motivação de estudar é intrínseca, variável e fácil de perder sem retorno imediato do esforço.

Problemas específicos endereçados:

1. **Baixa retenção e abandono** — o estudante inicia um curso e desiste sem um motivo claro para continuar. O EduQuest torna o esforço visível (XP, níveis, progresso) e oferece gatilhos de retorno (missões, notificações).
2. **Falta de reconhecimento do progresso** — sem métricas claras, o estudante não percebe o quanto avançou. O EduQuest quantifica progresso (%, níveis) e o materializa em conquistas, rankings e certificados.
3. **Estudo sem retorno imediato** — exercícios e avaliações geram retorno apenas cognitivo. O EduQuest adiciona retorno extrínseco imediato (XP, moedas, itens de loja).
4. **Dificuldade do professor em acompanhar turmas** — o professor não enxerga engajamento e dificuldade em tempo hábil. O EduQuest expõe progresso, desempenho e analytics por turma, curso e questão.
5. **Falta de competição saudável e colaboração** — rankings, desafios e recursos sociais criam estímulo social ao estudo.

**O que o problema NÃO é (delimitação):** o EduQuest não resolve qualidade pedagógica do conteúdo (conteúdo é autoral/do professor), não substitui um LMS institucional completo e não é um jogo — a gamificação é camada de incentivo sobre o aprendizado, nunca substituto dele.

---

## 3. Principais usuários / personas

### P1 — Estudante (persona primária)

- **Perfil:** estudante do ensino médio, técnico ou universitário, ou learner autônomo; usa celular e computador; familiar com jogos e redes sociais.
- **Objetivos:** concluir cursos, aprender com constância, ver progresso, competir com colegas, desbloquear conquistas e recompensas, obter certificados.
- **Dores:** perde a motivação, não sabe onde parou, não sente retorno do estudo, compara-se com colegas sem referência clara.
- **Permissões:** consome conteúdo; executa exercícios/avaliações; vê próprio progresso, perfil, inventário, loja, rankings e notificações; publica em recursos sociais dentro das regras de moderação.
- **Restrições:** não edita conteúdo de cursos; não vê dados privados de outros estudantes além do que os rankings/expoentes sociais permitem.

### P2 — Professor (persona de criação e gestão)

- **Perfil:** professor ou instrutor responsável por um ou mais cursos; cria conteúdo e avalia desempenho.
- **Objetivos:** criar e estruturar cursos/módulos/aulas; publicar exercícios e avaliações; acompanhar progresso e desempenho da turma; identificar questões problemáticas via analytics; configurar gamificação do próprio curso (missões, desafios, recompensas).
- **Dores:** repetição de correção manual, baixa visibilidade de engajamento, dificuldade em detectar onde os estudantes travam.
- **Permissões:** CRUD dos próprios cursos e conteúdo; publica e corrige avaliações; lê analytics e progresso da própria turma; configura gamificação do próprio escopo.
- **Restrições:** não edita cursos de outros professores; não altera dados globais da plataforma; não manipula XP/moedas de estudantes fora dos mecanismos definidos (salvo ações explícitas de administração delegadas).

### P3 — Administrador (persona de operação)

- **Perfil:** operador da plataforma; cuida de contas, moderação e configuração global.
- **Objetivos:** gerir usuários e papéis; moderar conteúdo e conduta; configurar parâmetros globais de gamificação; resolver problemas operacionais; acompanhar métricas de uso da plataforma.
- **Dores:** volume de denúncias, contas problemáticas, necessidade de ajustar regras de gamificação sem deploy.
- **Permissões:** total sobre usuários, papéis, moderação, configurações globais e analytics de plataforma.
- **Restrições:** não substitui o professor na autoria de conteúdo pedagógico.

### Persona secundária (mencionada, não detalhada nesta SPEC)

- **P4 — Observador/analista (analytics):** consumidor de relatórios agregados (gestão institucional). Requisitos detalhados ficam para SPEC de analytics.

---

## 4. Fluxo principal da aplicação

Fluxo nominal do estudante (o caminho que atravessa todos os domínios). Passos numerados, na ordem:

1. **Cadastro** — visitante informa credenciais e cria conta; sistema valida e cria o perfil de estudante.
2. **Autenticação** — estudante faz login e obtém sessão autenticada; papéis (estudante/professor/admin) determinam o que é visível.
3. **Exploração de catálogo** — estudante navega por cursos disponíveis e abre a estrutura (módulos → aulas).
4. **Consumo de aula** — estudante lê/assiste à aula e a marca como concluída; recebe XP e atualiza progresso.
5. **Execução de exercício** — estudante responde questões; recebe feedback e XP imediato por acerto; progresso do módulo avança.
6. **Avaliação** — estudante realiza avaliação (com regras de tentativa e nota); resultado atualiza progresso acadêmico e pode conceder XP/recompensa.
7. **Progresso acadêmico** — sistema consolida conclusões em métricas (%, módulos concluídos, cursos em andamento/concluídos).
8. **Progressão de gamificação** — XP acumulado eleva o nível; conquistas são desbloqueadas de forma permanente; missões concluídas pagam recompensas; desafios geram classificação.
9. **Ranking** — o estudante é posicionado em rankings (semana/turma/curso) conforme as métricas vigentes.
10. **Recompensa e loja** — moedas ganhas permitem comprar itens na loja; itens comprados aparecem no inventário e podem ser usados/exibidos no perfil.
11. **Notificações** — a plataforma notifica eventos relevantes (missão prestes a expirar, nova conquista, resultado de avaliação, resposta social).
12. **Recursos sociais** — estudante interage com colegas (perfil público, interações permitidas) respeitando moderação.
13. **Certificado** — ao concluir os requisitos de um curso, o estudante pode emitir certificado comprobatório.
14. **Retorno (loop)** — o estudante volta ao passo 3 para um novo curso/aula; o loop é o coração do engajamento.

Fluxos secundários (resumidos aqui, detalhados em SPECs próprias):

- **Professor:** cria conta → cria curso → estrutura módulos/aulas → publica questões/exercícios/avaliações → acompanha progresso e analytics da turma → ajusta missões/desafios/recompensas do curso.
- **Administrador:** autenticação → gestão de usuários e papéis → moderação → configuração global de gamificação → leitura de analytics de plataforma.

**Regra de ouro do fluxo:** toda recompensa (XP, nível, conquista, moeda, item) é calculada pelo servidor a partir de ações verificadas do estudante; o cliente apenas exibe.

---

## 5. Principais domínios funcionais

Cada domínio declara: escopo mínimo, entidades centrais e regras de negócio de alto nível (o suficiente para derivar PLAN/TASKS sem inventar requisitos).

### D1 — Identidade e acesso
- **Escopo:** cadastro, login, logout, sessão, recuperação de senha, papéis e permissões.
- **Entidades:** usuário, credencial, sessão, papel (estudante, professor, administrador).
- **Regras:** e-mail/credencial únicos; senha protegida; sessão expira; acesso determinado por papel; sem login não há ação de estudante.

### D2 — Perfis
- **Escopo:** perfil de estudante e de professor; informações visíveis; nível, conquistas e inventário exibidos.
- **Entidades:** perfil de estudante, perfil de professor, preferências, visibilidade.
- **Regras:** estudante edita apenas o próprio perfil; dados privados (e-mail, notas) nunca públicos; professor pode ter bio pública.

### D3 — Catálogo de aprendizagem (cursos, módulos, aulas)
- **Escopo:** criação, organização e consumo de cursos → módulos → aulas.
- **Entidades:** curso, módulo, aula, conteúdo de aula (texto, mídia embedada, material anexo), publicação.
- **Regras:** hierarquia fixa curso > módulo > aula; apenas professor dono (ou admin) edita; aula só é consumível quando publicada; conclusão de aula é registrada por estudante.

### D4 — Exercícios e questões
- **Escopo:** questões, gabarito, tentativas de exercício e feedback imediato.
- **Entidades:** questão (múltipla escolha, verdadeiro/falso, numérica, dissertativa — conjunto a confirmar em SPEC própria), alternativa, tentativa, resposta, feedback.
- **Regras:** questão pertence a um curso/módulo; tentativa registrada com resposta e acerto; gabarito não exposto antes do envio; feedback emitido conforme regra da questão.

### D5 — Avaliações
- **Escopo:** avaliações compostas por questões, regras de tentativa, prazo, nota e resultado.
- **Entidades:** avaliação, composição (questões), tentativa de avaliação, nota, prazo.
- **Regras:** professor define número de tentativas e janela; nota calculada servidor; resultado atualiza progresso acadêmico; pode haver correção manual de dissertativas (a confirmar em SPEC própria).

### D6 — Progresso acadêmico
- **Escopo:** registro e agregação do avance do estudante.
- **Entidades:** progresso de aula, de módulo, de curso; estatísticas pessoais.
- **Regras:** progresso deriva de conclusões registradas; percentuais monotonicamente crescentes por curso (exceto reset explícito do professor/admin); fonte única de verdade para rankings e certificados.

### D7 — Gamificação: XP e níveis
- **Escopo:** concessão de XP por ações e tradução de XP em níveis.
- **Entidades:** regra de XP, evento de XP, saldo de XP, faixa de nível.
- **Regras:** XP é concedido apenas por ações verificadas; configuração de XP é ajustável por escopo (global do professor/admin); nível é monotônico (nunca diminui); XP total e XP do período são métricas distintas.

### D8 — Gamificação: conquistas
- **Escopo:** definição, avaliação e desbloqueio permanente de conquistas.
- **Entidades:** conquista, critério, desbloqueio.
- **Regras:** desbloqueio é permanente e idempotente (nunca duplica); critérios são avaliados por eventos de progresso/gamificação.

### D9 — Gamificação: missões
- **Escopo:** objetivos com janela de cumprimento e recompensa.
- **Entidades:** missão, critério de cumprimento, progresso de missão, recompensa da missão.
- **Regras:** missão tem início e fim; progresso rastreado; recompensa paga uma única vez ao cumprir; missão expirada não paga.

### D10 — Gamificação: desafios
- **Escopo:** atividades competitivas/de alta dificuldade com classificação e recompensa diferenciada.
- **Entidades:** desafio, participante, resultado do desafio.
- **Regras:** desafio tem regras próprias (prazo, pontuação); gera colocação; recompensa por colocação conforme configuração.

### D11 — Rankings
- **Escopo:** ordenação de estudantes por métrica, escopo e período.
- **Entidades:** definição de ranking (métrica + escopo + período), entrada de ranking.
- **Regras:** métrica claramente declarada (ex.: XP da semana); empates tratados por regra fixa; rankings respeitam privacidade (pseudônimos/ocultar conforme configuração); cálculo servidor-side.

### D12 — Recompensas, moedas, loja e inventário
- **Escopo:** economia interna: ganho de moedas, compra na loja, posse e uso de itens.
- **Entidades:** moeda (saldo), item de loja, compra, inventário, uso de item.
- **Regras:** saldo nunca fica negativo; compra é atômica (saldo debitado ↔ item creditado); item é não transferível por padrão; estoque/preço configuráveis; recompensas podem ser moedas, XP bônus ou itens.

### D13 — Notificações
- **Escopo:** notificações in-app (e-mail opcional) disparadas por eventos.
- **Entidades:** notificação, preferência de notificação, evento disparador.
- **Regras:** usuário controla quais notificações recebe; não-envio para eventos não permitidos; leitura é registrada; frequência respeita preferências.

### D14 — Recursos sociais
- **Escopo:** dimensão social mínima: perfis públicos, listas/amizades ou seguimento, interações (comentários/curtidas ou equivalentes) sobre conteúdo permitido.
- **Entidades:** relação social, interação, denúncia/moderação.
- **Regras:** apenas dados permitidos são públicos; toda interação é moderável (denunciar, ocultar, remover); spam/abuso são bloqueáveis por admin.

### D15 — Analytics
- **Escopo:** métricas e agregados para professor (turma/curso/questão) e admin (plataforma).
- **Entidades:** evento de análise, métrica agregada, relatório.
- **Regras:** professor vê apenas a própria turma; dados agregados não expõem indivíduo sem permissão; métricas derivam dos mesmos eventos de progresso/gamificação (fonte única).

### D16 — Certificados
- **Escopo:** emissão de certificado ao cumprir requisitos de um curso.
- **Entidades:** certificado, requisito de emissão, código de verificação.
- **Regras:** requisitos definidos pelo professor/admin (ex.: ≥X% do curso e nota mínima); emissão única por estudante por curso; verificável por código; dados do certificado imutáveis após emissão.

### D17 — Administração
- **Escopo:** gestão de usuários e papéis, moderação, configuração global (inclui parâmetros de gamificação), suporte operacional.
- **Entidades:** configuração global, ação de moderação, auditoria.
- **Regras:** apenas admin acessa; ações destrutivas são auditáveis; alteração de parâmetros de gamificação não altera conquistas já desbloqueadas.

**Mapeamento obrigatório:** as 24 funcionalidades listadas no cabeçalho do pedido (cadastro e autenticação; perfis; cursos; módulos; aulas; exercícios; questões; avaliações; progresso acadêmico; XP; níveis; conquistas; missões; desafios; rankings; recompensas; moedas virtuais; loja; inventário; notificações; recursos sociais; analytics; certificados; administração) estão integralmente cobertas pelos domínios D1–D17.

---

## 6. Limites do sistema

**Dentro dos limites do sistema EduQuest:**

- Plataforma web responsiva (acessada via navegador em desktop e mobile).
- Papéis fixos: estudante, professor, administrador.
- Estrutura de conteúdo autoral dentro da própria plataforma (curso > módulo > aula).
- Execução e correção automática de questões; correção de dissertativas conforme regra definida em SPEC própria.
- Gamificação 100% calculada no servidor, a partir de ações verificadas.
- Economia interna fechada: moedas e itens existem apenas dentro da plataforma.
- Persistência própria dos dados da plataforma (contas, conteúdo, progresso, gamificação).
- Analytics derivado dos eventos gerados pela própria plataforma.
- Emissão de certificados com verificação por código próprio.

**Fronteiras explícitas (o que o sistema NÃO é):**

- **Não é** um host de vídeo: aulas podem exibir vídeo por incorporação (embed) de provedor externo, mas o EduQuest não armazena nem transmite vídeo próprio.
- **Não é** um sistema de pagamento: não há compra de moedas com dinheiro real, assinaturas, moeda fiscal, checkout ou gateway de pagamento nesta visão geral.
- **Não é** um LMS institucional completo: não integra com matrículas, SIAPE/SISU, diários oficiais, LTI/SCORM (fora do escopo desta visão geral).
- **Não é** um app nativo: apenas web.
- **Não é** um sistema de videoconferência/aula ao vivo.
- **Não é** uma rede social livre: recursos sociais são funcionais ao estudo e moderados.
- **Não é** autor de conteúdo: o conteúdo pedagógico é de responsabilidade do professor/administrador.
- **Não é** um jogo: a gamificação incentiva estudo real; nenhuma mecânica pode conceder progresso acadêmico sem atividade de aprendizagem correspondente.

---

## 7. Fora do escopo desta visão geral

Esta SPEC **não** define (e portanto nenhum agente posterior deve assumir como requisito sem nova SPEC):

1. **Stack tecnológica** — linguagem, framework, banco de dados, infraestrutura, hospedagem, ferramentas. (Escolha fica para o PLAN, se o processo assim determinar, ou para SPEC técnica própria.)
2. **Modelo de dados detalhado** — esquema físico, migrations, índices, IDs.
3. **Contratos de API** — endpoints, payloads, autenticação técnica (token/session), versionamento.
4. **Requisitos não funcionais quantificados** — performance, disponibilidade, escalabilidade, limites de carga. (Devem vir em SPEC própria de NFRs.)
5. **Design de UI/UX** — wireframes, paleta, componentes, guia visual, animações.
6. **Requisitos de acessibilidade e internacionalização** — níveis de conformidade, idiomas, fuso horário.
7. **Detalhamento por domínio** — cada domínio D1–D17 terá sua própria SPEC com requisitos finos (ex.: fórmula exata de XP, fórmula de níveis, tabela de níveis, tipos exatos de questão, regras de empatia de ranking).
8. **Roadmap, estimativas e ordem de implementação** — ficam para PLAN/TASKS.
9. **Integrações externas** — LTI/SCORM, OAuth social, e-mail transacional, CDN, vídeos, analytics de terceiros.
10. **Pagamentos, moedas reais e marketplace de conteúdo.**
11. **Moderação por IA, recomendação inteligente e uso de LLM.**
12. **Multi-tenancy / múltiplas instituições.**
13. **Testes de carga, política de backup e plano de disaster recovery.**
14. **Aspectos legais completos** — termos de uso, LGPD/GDPR, consentimentos, apenas mencionados como consideração futura.

---

## 8. Critérios de aceitação verificáveis

Todos os critérios abaixo se verificam **por leitura/documental** sobre este repositório e o conteúdo desta SPEC. São objetivos: cada um tem ID, condição observável e método de verificação.

| ID | Critério | Método de verificação |
|---|---|---|
| AC-01 | O arquivo `SPEC/2026-09-30-visao-geral.md` existe e contém exatamente as 8 seções numeradas 1 a 8 com os títulos: "O que é o EduQuest", "Problema que o EduQuest resolve", "Principais usuários / personas", "Fluxo principal da aplicação", "Principais domínios funcionais", "Limites do sistema", "Fora do escopo desta visão geral", "Critérios de aceitação verificáveis". | `ls` + leitura do arquivo; busca pelas seções `## 1.` a `## 8.` |
| AC-02 | A seção 5 cobre **todas as 24 funcionalidades** pedidas (cadastro e autenticação; perfis; cursos; módulos; aulas; exercícios; questões; avaliações; progresso acadêmico; XP; níveis; conquistas; missões; desafios; rankings; recompensas; moedas virtuais; loja; inventário; notificações; recursos sociais; analytics; certificados; administração), cada uma mapeada a pelo menos um domínio D1–D17. | Cruzamento manual lista × tabela de domínios; grep de cada termo no arquivo deve retornar ≥1 ocorrência na seção 5 |
| AC-03 | São definidas **ao menos 3 personas** (estudante, professor, administrador), cada uma com objetivos, dores e permissões explícitas. | Leitura da seção 3; contagem de personas ≥ 3 com os campos objetivos/dores/permissões |
| AC-04 | O fluxo principal da seção 4 contém **passos numerados em ordem** que cobrem obrigatoriamente: cadastro, autenticação, consumo de aula, exercício, avaliação, progresso, gamificação (XP/conquista/missão), ranking, loja/inventário e notificação, formando um ciclo de retorno. | Leitura da seção 4; verificação da presença sequencial dos termos em passos numerados |
| AC-05 | Cada domínio da seção 5 declara **escopo, entidades centrais e regras de negócio de alto nível** (mínimo: 1 escopo, ≥2 entidades, ≥1 regra por domínio). | Leitura da seção 5; contagem de campos por domínio D1–D17 |
| AC-06 | A seção 6 declara **limites explícitos**: lista do que está dentro e lista do que está fora (ao menos 7 itens "não é"), incluindo explicitamente: sem pagamento com dinheiro real, sem app nativo, sem host de vídeo próprio, sem LTI/SCORM. | Leitura da seção 6; busca pelos termos "não é", "pagamento", "app nativo", "vídeo", "LTI/SCORM" |
| AC-07 | A seção 7 lista **ao menos 10 itens fora de escopo**, incluindo obrigatoriamente: stack tecnológica, modelo de dados, contratos de API, requisitos não funcionais quantificados, design de UI/UX e ordem de implementação. | Leitura da seção 7; contagem de itens ≥ 10 e busca dos termos obrigatórios |
| AC-08 | Os critérios da própria seção 8 são **objetivos e verificáveis**: cada AC possui ID único no formato `AC-nn`, um enunciado observável e um método de verificação documental; são ao menos 10 ACs. | Leitura da seção 8; contagem de linhas com `AC-` ≥ 10; unicidade dos IDs |
| AC-09 | A SPEC **não prescreve stack** como requisito: nenhum framework, linguagem de programação, banco de dados ou provedor aparece como exigência de implementação (menções genéricas de fronteira, como "web responsiva", são permitidas). | Busca por nomes de frameworks, linguagens, bancos de dados ou provedores de nuvem no arquivo (fora desta própria linha AC-09) — ocorrências devem ser 0 |
| AC-10 | **Nenhum outro artefato de processo foi criado nesta etapa**: não existem `PLAN.md`, `TASKS.md` nem outras SPECs além desta. | `ls` na raiz e em `SPEC/`; confirmação de ausência dos arquivos |
| AC-11 | **Nenhum código foi criado**: `src/` e `tests/` permanecem vazios (apenas diretórios). | `ls src tests` — sem arquivos |
| AC-12 | A SPEC é **suficiente para derivar PLAN e TASKS**: um leitor consegue, sem conhecimento externo, listar os domínios a implementar, seus escopos, entidades e regras de alto nível, bem como personas e fluxo. Verificação operacional: a seção 5 contém ao menos 60 linhas não vazias de conteúdo funcional (escopo + entidades + regras). | Contagem de linhas não vazias da seção 5 (`awk` entre os títulos `## 5.` e `## 6.`) ≥ 60; revisão de leitura por agente secundário sem pedidos de esclarecimento sobre requisitos fundamentais |
| AC-13 | Toda decisão tomada nesta SPEC é **rastreável ao pedido original**: os conceitos gamificados solicitados (XP, níveis, conquistas, missões, desafios, rankings, recompensas, moedas, loja, inventário) e as funcionalidades de suporte (notificações, sociais, analytics, certificados, administração) aparecem na seção 1 ou 5. | Busca de cada termo obrigatório no arquivo — ocorrência ≥ 1 |

**Critério de encerramento da etapa:** esta SPEC pode ser considerada aprovada quando AC-01 a AC-13 forem todos atendidos (verificação documental). A partir daí, o próximo artefato do processo SDD é `PLAN.md`, derivado exclusivamente desta SPEC — sem inventar requisitos que não estejam aqui declarados ou explicitamente remetidos a SPECs futuras.
