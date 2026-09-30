# Gerar TASKS.md a partir do PLAN

Leia obrigatoriamente:

* `SPEC/2026-09-30-visao-geral.md`
* `PLAN.md`
* `AGENTS.md`
* `README.md`

Sua tarefa nesta etapa é **somente produzir o `TASKS.md`**.

## Regras

1. O `TASKS.md` deve ser derivado exclusivamente do `PLAN.md`.
2. Não invente requisitos funcionais.
3. Não altere a SPEC.
4. Não altere o PLAN.
5. Não implemente código.
6. Não escolha stack tecnológica.
7. Não crie contratos de API.
8. Não crie modelo físico de banco de dados.
9. Não defina fórmulas de XP ou níveis.
10. Não defina tipos de questões que a SPEC deixou pendentes.
11. Não resolva decisões registradas como DP-01–DP-19.
12. Toda tarefa deve possuir rastreabilidade para uma fase e domínio do PLAN.
13. Preserve as dependências entre fases.
14. Tarefas bloqueadas por decisões pendentes devem ser explicitamente marcadas como bloqueadas ou dependentes da SPEC correspondente.
15. O resultado deve permitir que uma etapa posterior de implementação execute as tarefas sem perder a rastreabilidade com a SPEC.

## Estrutura esperada

Organize o `TASKS.md` por fases:

* F0 — Habilitadores
* F1 — Identidade, acesso e perfis
* F2 — Catálogo de aprendizagem
* F3 — Exercícios, questões e avaliações
* F4 — Progresso acadêmico
* F5 — XP, níveis e conquistas
* F6 — Missões e desafios
* F7 — Rankings
* F8 — Economia
* F9 — Notificações
* F10 — Recursos sociais
* F11 — Analytics
* F12 — Certificados
* F13 — Administração

Para cada tarefa, informe:

* ID da tarefa
* fase
* domínio
* descrição objetiva
* pré-requisitos
* artefatos esperados
* validação/critério de conclusão
* rastreabilidade para o PLAN
* dependências ou bloqueios, quando existirem

## Granularidade

As tarefas devem ser suficientemente pequenas para serem executáveis por um agente de código posteriormente.

Evite:

* tarefas gigantes que englobem uma fase inteira;
* tarefas puramente abstratas;
* implementação prematura;
* decisões técnicas não autorizadas pelo PLAN.

Também evite decompor artificialmente uma tarefa em dezenas de subtarefas sem valor.

## Importante

Antes de escrever o arquivo, faça uma verificação interna:

* todos os domínios D1–D17 aparecem;
* todas as 24 funcionalidades continuam rastreáveis;
* nenhuma decisão pendente foi resolvida;
* nenhuma tecnologia foi escolhida;
* nenhuma implementação foi realizada.

Depois disso, crie apenas:

`TASKS.md`

Não crie ou altere nenhum outro arquivo.
