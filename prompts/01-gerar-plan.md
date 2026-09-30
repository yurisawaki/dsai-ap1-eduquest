# Tarefa: derivar PLAN.md a partir da SPEC

Você está trabalhando no projeto EduQuest.

## Contexto

O projeto utiliza o processo SDD (Specification-Driven Development):

SPEC → PLAN → TASKS → implementação → testes → revisão.

A SPEC de visão geral já foi aprovada e está versionada em:

`SPEC/2026-09-30-visao-geral.md`

Sua tarefa é produzir o próximo artefato do processo:

`PLAN.md`

## Regra fundamental

O PLAN deve ser derivado exclusivamente da SPEC fornecida.

Não invente requisitos funcionais, regras de negócio, tecnologias, APIs, modelos de dados ou decisões arquiteturais que não estejam presentes na SPEC.

Quando uma decisão estiver explicitamente fora do escopo da SPEC ou remetida para uma SPEC futura, preserve essa fronteira no PLAN.

## Objetivo do PLAN

Transformar a visão geral da SPEC em um plano de implementação executável, organizando:

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

## Restrições

* Não escrever código.
* Não criar TASKS.md.
* Não escolher framework, linguagem, banco de dados ou infraestrutura.
* Não criar contratos de API.
* Não criar modelo de dados físico.
* Não definir fórmulas específicas de XP ou níveis.
* Não inventar tipos definitivos de questões.
* Não inventar regras detalhadas de ranking.
* Não definir requisitos não funcionais que não estejam na SPEC.
* Não transformar hipóteses em requisitos.
* Não alterar a SPEC existente.

## Rastreabilidade

Para cada fase ou grupo de trabalho do PLAN, indique quais domínios D1–D17 da SPEC ela cobre.

O PLAN deve permitir que posteriormente seja derivado um TASKS.md sem que seja necessário inventar requisitos fundamentais.

## Dependências

Analise os domínios e identifique dependências lógicas.

Exemplo de raciocínio esperado:

* identidade e acesso precedem funcionalidades que exigem estudante autenticado;
* catálogo de aprendizagem precede consumo de aulas;
* progresso depende dos eventos de aprendizagem;
* gamificação depende de ações verificadas;
* rankings dependem de métricas previamente existentes;
* certificados dependem de progresso e/ou avaliação;
* analytics depende dos eventos produzidos pelos demais domínios.

Esses exemplos não devem ser tratados como requisitos novos: valide-os contra a SPEC antes de incluí-los.

## SPECs futuras

A SPEC declara que haverá detalhamento posterior por domínio.

Identifique explicitamente quais áreas precisam de uma SPEC própria antes de uma implementação detalhada, especialmente quando a SPEC atual diz que uma decisão está "a confirmar" ou remete explicitamente para uma SPEC futura.

## Formato esperado

Crie `PLAN.md` com estrutura clara e objetiva.

Sugestão de estrutura:

# PLAN — EduQuest

## 1. Objetivo

## 2. Fonte e rastreabilidade

## 3. Escopo herdado da SPEC

## 4. Princípios e restrições

## 5. Decomposição do sistema

### 5.1 Identidade e acesso

### 5.2 Perfis

### 5.3 Catálogo de aprendizagem

...

Mapeie os D1–D17.

## 6. Dependências entre domínios

## 7. Fases de implementação

Para cada fase, informe:

* objetivo;
* domínios envolvidos;
* pré-requisitos;
* resultado esperado;
* validação.

## 8. Artefatos e decisões pendentes

## 9. Estratégia de validação

## 10. Critérios de conclusão do PLAN

## 11. Limites e itens explicitamente não definidos

## Critério de qualidade

Antes de finalizar, faça uma revisão do próprio PLAN verificando:

* Todo D1–D17 aparece no plano?
* As 24 funcionalidades continuam rastreáveis?
* Algum requisito novo foi inventado?
* Alguma decisão explicitamente deixada para SPEC futura foi tomada indevidamente?
* O plano permite derivar TASKS.md posteriormente?
* Stack tecnológica foi evitada?
* Código foi evitado?
* O PLAN respeita os limites da SPEC?

Se houver qualquer decisão necessária que não esteja definida pela SPEC, registre-a como "decisão pendente" ou "dependência de SPEC futura", em vez de inventar uma resposta.

Não modifique nenhum outro arquivo do projeto.
