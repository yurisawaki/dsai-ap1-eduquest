# T0.1 — Inventário das decisões pendentes do EduQuest

Você está trabalhando no projeto EduQuest, no repositório atual.

## Objetivo

Executar exclusivamente a tarefa T0.1 definida em `TASKS.md`:

> Inventariar as decisões pendentes DP-01–DP-19 e organizar seus bloqueios por fase.

O objetivo é produzir um artefato de apoio ao processo SDD, deixando claro:

* quais decisões ainda estão pendentes;
* o que cada decisão significa;
* quais partes do projeto dependem dela;
* em que fase cada decisão precisa ser resolvida;
* quais decisões bloqueiam a implementação;
* quais decisões são permanentemente fora do escopo;
* quais decisões dependem da criação de uma SPEC específica.

## Fontes obrigatórias

Antes de produzir qualquer coisa, leia integralmente:

* `AGENTS.md`
* `README.md`
* `SPEC/2026-09-30-visao-geral.md`
* `PLAN.md`
* `TASKS.md`

A fonte de autoridade deve respeitar esta ordem:

**SPEC → PLAN → TASKS → T0.1**

Não invente requisitos que não estejam nesses artefatos.

## O que produzir

Crie um arquivo:

`SPEC/2026-09-30-decisoes-pendentes.md`

Esse arquivo deve conter, no mínimo:

### 1. Objetivo do documento

Explique que o documento é um inventário das decisões pendentes identificadas pelo PLAN e operacionalizadas pelo TASKS.

Deixe explícito que ele não resolve nenhuma decisão.

### 2. Status geral

Apresente uma visão geral das decisões:

* DP-01 até DP-19;
* status atual;
* fase relacionada;
* se bloqueia implementação;
* dependências.

Use uma tabela quando isso melhorar a leitura.

### 3. Inventário detalhado

Para cada decisão DP-01–DP-19, registre:

* ID;
* nome da decisão;
* descrição objetiva;
* origem no `PLAN.md`;
* domínio(s) afetado(s);
* fase(s) afetada(s);
* tarefas `TASKS.md` afetadas;
* dependências;
* se é bloqueadora;
* qual artefato futuro deverá resolvê-la.

Não escolha uma solução.

### 4. Classificação dos bloqueios

Separe as decisões em categorias, por exemplo:

* decisões necessárias antes da implementação;
* decisões necessárias antes de determinados domínios;
* decisões que dependem de uma SPEC futura;
* decisões fora do escopo permanente.

Não altere a classificação estabelecida pelo PLAN sem justificar explicitamente a divergência.

### 5. Grafo/ordem de dependências

Descreva textualmente a ordem necessária para avançar no SDD.

O mínimo esperado é deixar claro que:

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

Caso existam outras dependências entre decisões, registre-as somente quando forem suportadas por SPEC, PLAN ou TASKS.

### 6. Critério para considerar uma decisão resolvida

Defina objetivamente o que deverá existir para que uma DP deixe de ser considerada pendente.

Importante: isso deve ser um critério documental/processual, e não uma decisão técnica.

## Restrições absolutas

Durante esta tarefa:

* NÃO escreva código;
* NÃO crie arquivos em `src/`;
* NÃO crie arquivos em `tests/`;
* NÃO altere `SPEC/2026-09-30-visao-geral.md`;
* NÃO altere `PLAN.md`;
* NÃO altere `TASKS.md`;
* NÃO escolha framework;
* NÃO escolha linguagem;
* NÃO escolha banco de dados;
* NÃO escolha arquitetura;
* NÃO defina endpoints;
* NÃO defina schemas físicos de banco;
* NÃO defina fórmulas de XP;
* NÃO defina fórmula de níveis;
* NÃO defina tipos definitivos de questões;
* NÃO defina regras definitivas de ranking;
* NÃO resolva DP-01–DP-19;
* NÃO antecipe decisões que pertencem às próximas SPECs.

Você pode referenciar tecnologias ou alternativas somente se elas já aparecerem explicitamente nos artefatos existentes. Mesmo nesse caso, não escolha nenhuma.

## Regra contra invenção

Se uma informação não estiver suficientemente definida em:

* `SPEC/2026-09-30-visao-geral.md`
* `PLAN.md`
* `TASKS.md`

não invente.

Registre a informação como pendente ou não especificada.

## Integridade do SDD

Ao terminar, verifique:

* DP-01–DP-19 aparecem no documento;
* nenhuma DP foi resolvida;
* todas as DPs possuem rastreabilidade;
* as 17 áreas D1–D17 continuam preservadas;
* as 24 funcionalidades continuam preservadas;
* F0–F13 continuam preservadas;
* nenhuma decisão nova foi criada;
* nenhum requisito novo foi introduzido;
* nenhum código foi criado;
* SPEC, PLAN e TASKS permanecem inalterados.

## Saída final

A saída principal desta tarefa deve ser somente:

`SPEC/2026-09-30-decisoes-pendentes.md`

Não modifique outros arquivos.

Ao terminar, faça uma verificação final do `git diff` e informe:

* qual arquivo foi criado;
* quais arquivos foram modificados, se houver;
* confirmação de que nenhuma DP foi resolvida;
* confirmação de que nenhuma alteração foi feita em SPEC, PLAN ou TASKS.
