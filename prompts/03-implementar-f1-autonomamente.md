Leia integralmente antes de executar:

* `AGENTS.md`
* `README.md`
* `SPEC/2026-09-30-visao-geral.md`
* `PLAN.md`
* `TASKS.md`
* `SPEC/2026-09-30-decisoes-pendentes.md`
* `SPEC/2026-09-30-tecnica-fundacoes.md`
* `SPEC/2026-09-30-identidade-acesso-credenciais.md`

A SPEC D1 foi auditada e está **APROVADA**.

Agora implemente autonomamente a **F1 — Identidade, acesso e perfis**, seguindo o processo SDD e as decisões já aprovadas.

## Objetivo

Entregar uma F1 funcional de ponta a ponta, cobrindo:

* T1.2 — cadastro
* T1.3 — login, logout, sessão e recuperação
* T1.4 — papéis e autorização
* T1.5 — perfis
* T1.6 — integração das informações previstas no perfil
* T1.7 — validação da F1

Não implemente funcionalidades de F2 em diante.

## Regra principal de autonomia

Não interrompa a execução para pedir decisões sobre detalhes técnicos ou de implementação.

Quando a SPEC definir o comportamento funcional, implemente-o diretamente.

Você pode decidir autonomamente detalhes técnicos necessários para materializar a SPEC, incluindo:

* estrutura de diretórios;
* organização de módulos;
* nomes internos de funções/classes;
* services e repositories;
* componentes React;
* organização de testes;
* configuração de ferramentas;
* scripts;
* Dockerfiles;
* configuração de desenvolvimento;
* tratamento interno de erros;
* detalhes de implementação do Prisma;
* detalhes de implementação do Express;
* detalhes de implementação do React/Vite.

Não invente requisitos funcionais, regras de negócio ou políticas de produto.

## Regra para pendências

As pendências existentes nas SPECs continuam pendências.

Não resolva arbitrariamente:

* P-01
* P-02
* P-03
* P-04
* P-11
* P-12
* P-13
* DP-04–DP-19

Quando uma pendência não for necessária para executar o comportamento atualmente especificado, preserve-a e siga a implementação.

Quando uma pendência for indispensável para continuar e não houver comportamento derivável das SPECs, pare somente naquele ponto e produza um relatório objetivo explicando:

1. qual tarefa está bloqueada;
2. qual decisão está faltando;
3. onde a pendência está registrada;
4. por que não é possível continuar sem inventar uma regra.

Não peça confirmação para questões que possam ser resolvidas tecnicamente sem alterar o comportamento especificado.

## Stack obrigatória

Use exatamente a stack definida em:

`SPEC/2026-09-30-tecnica-fundacoes.md`

Incluindo:

* TypeScript
* Node.js
* Express
* React
* Vite
* PostgreSQL
* Prisma
* Vitest
* HTTP/JSON
* Docker/Compose

Não substitua tecnologias sem necessidade.

## Implementação

Execute a F1 de forma incremental internamente, nesta ordem:

### T1.2 — Cadastro

Implemente o fluxo de cadastro conforme a SPEC D1.

Inclua:

* endpoint;
* validações previstas;
* persistência;
* hash de senha;
* unicidade;
* transação;
* criação das entidades exigidas;
* resposta HTTP;
* tratamento dos erros especificados;
* testes.

Não crie sessão automaticamente se a SPEC não determinar isso.

### T1.3 — Login, sessão, logout e recuperação

Implemente os contratos correspondentes da SPEC técnica e D1.

Inclua:

* autenticação;
* bcrypt;
* sessão server-side;
* cookie `eduquest_session`;
* expiração;
* revogação;
* logout;
* verificação de sessão;
* recuperação de senha conforme o comportamento que já está definido;
* testes.

Não invente canal externo de entrega do recovery quando isso estiver pendente.

### T1.4 — Papéis e autorização

Implemente:

* estudante;
* professor;
* administrador;
* controle de acesso;
* middleware/autorização necessário;
* respostas HTTP previstas;
* testes de acesso autorizado e não autorizado.

Não crie novos papéis.

### T1.5 — Perfil

Implemente somente o que estiver definido pelas SPECs aprovadas.

Não invente campos de perfil pertencentes a decisões ainda pendentes.

### T1.6

Integre somente as informações explicitamente previstas para a F1.

Não implemente gamificação, cursos, exercícios ou outras funcionalidades futuras.

### T1.7 — Validação

Ao final:

* execute todos os testes;
* execute build;
* execute lint/typecheck se configurados;
* execute migrations;
* suba o ambiente Docker;
* valide a aplicação;
* teste os principais fluxos ponta a ponta;
* corrija automaticamente erros encontrados;
* execute novamente os testes após as correções.

## Critério de conclusão

A execução só deve ser considerada concluída quando:

1. o projeto estiver compilando;
2. os testes relevantes estiverem passando;
3. o banco estiver funcionando;
4. a aplicação estiver executável;
5. os fluxos principais de F1 estiverem funcionando;
6. Docker estiver funcional conforme a SPEC técnica;
7. não houver erro conhecido introduzido pela implementação;
8. as pendências não resolvidas estiverem explicitamente preservadas.

## Processo durante a execução

Não faça pausas artificiais entre T1.2, T1.3, T1.4, T1.5, T1.6 e T1.7.

Trate-os como uma única execução autônoma da F1.

Depois de cada tarefa, faça internamente:

* implementação;
* testes;
* correção de erros;
* verificação.

Depois prossiga automaticamente para a próxima tarefa.

Não peça aprovação intermediária.

## Controle de escopo

Não:

* altere as SPECs para justificar uma implementação;
* altere PLAN.md para acomodar decisões;
* altere TASKS.md;
* resolva pendências sem autorização;
* implemente F2–F13;
* adicione funcionalidades não especificadas;
* substitua a arquitetura definida.

Se encontrar uma inconsistência entre documentos, siga a hierarquia definida pelo próprio processo SDD e registre o conflito em vez de inventar uma solução de negócio.

## Relatório final

Ao terminar, produza um relatório objetivo contendo:

### Resultado

`F1 CONCLUÍDA` ou `F1 BLOQUEADA`

### Tarefas

| Tarefa | Status |
| ------ | ------ |
| T1.2   |        |
| T1.3   |        |
| T1.4   |        |
| T1.5   |        |
| T1.6   |        |
| T1.7   |        |

### Validação

* testes:
* build:
* typecheck/lint:
* migrations:
* Docker:
* execução da aplicação:
* testes ponta a ponta:

### Arquivos modificados

Liste os principais arquivos criados ou modificados.

### Pendências preservadas

Liste as pendências que permaneceram sem resolução.

### Bloqueios

Se houver algum bloqueio real, explique exatamente qual decisão da SPEC está faltando.

Não faça commit automaticamente. Ao final, aguarde a revisão do usuário.
