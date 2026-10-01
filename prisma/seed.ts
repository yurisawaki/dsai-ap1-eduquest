/**
 * Seed de DESENVOLVIMENTO do EduQuest — não é o seeder de produção da F13.
 *
 * Uso: `npm run db:seed` (Prisma: `prisma db seed` → config "prisma.seed").
 *
 * Garantias:
 * - Idempotente: IDs determinísticos (prefixo `5eed…`) + upsert; rodar duas
 *   vezes não duplica usuários, cursos, módulos, aulas nem conteúdos.
 * - Escopo: só entidades com IDs deste seed. Conteúdo das aulas-seed é
 *   reescrito por substituição total (mesma semântica do F2-12), sempre
 *   restrito às aulas deste seed; aulas criadas fora do seed são intocadas.
 * - Tipos de conteúdo: apenas `texto` e `midia_embedada`, que o sistema
 *   suporta hoje de ponta a ponta. `material_anexo` exige F2-15/F2-16
 *   (upload/download) e binário no disco — fora do escopo desta tarefa.
 * - `criado_em` explícito e crescente: a leitura atual ordena por `criado_em`
 *   (ordenação por `posicao` é pendência C-7/R-C2); timestamps determinísticos
 *   mantêm a ordem exibida igual à ordem de definição.
 * - F3 (D4/D5): questões dos 4 tipos com alternativas, gabarito e explicação,
 *   tentativas de exercício e 5 avaliações — encerrada com histórico (uma
 *   aguardando correção e outra corrigida), aberta, futura e rascunho — com
 *   composição e respostas pré-corrigidas.
 * - Janelas e datas das avaliações são recalculadas a cada execução (relativas
 *   ao relógio), de modo que os cenários continuem válidos em qualquer data.
 * - Recusa rodar contra o banco de teste (`eduquest_test`).
 */
import 'dotenv/config'
import { Prisma, type Papel, type StatusTentativaAvaliacao, type TipoQuestao } from '@prisma/client'
import { prisma } from '../src/server/prisma'
import { gerarHash } from '../src/server/servicos/senha'

const SENHA_DEV = 'Eduquest#Dev2026'
const BASE = new Date('2026-09-15T09:00:00.000Z')

type TipoSeed = 'texto' | 'midia_embedada'

interface BlocoSeed {
  tipo: TipoSeed
  dados: { texto: string } | { url: string }
}

interface AulaSeed {
  id: string
  titulo: string
  publicado: boolean
  blocos: BlocoSeed[]
}

interface ModuloSeed {
  id: string
  titulo: string
  publicado: boolean
  aulas: AulaSeed[]
}

interface CursoSeed {
  id: string
  titulo: string
  publicado: boolean
  donoId: string
  modulos: ModuloSeed[]
}

interface UsuarioSeed {
  id: string
  email: string
  papel: Papel
  bio?: string
}

const usuarios: UsuarioSeed[] = [
  {
    id: '5eed0000-0000-4000-8000-000000000001',
    email: 'professor@eduquest.example',
    papel: 'professor',
    bio: 'Ensino de lógica de programação e introdução à computação há 8 anos. Pesquisa formas de ensinar algoritmos para iniciantes.',
  },
  {
    id: '5eed0000-0000-4000-8000-000000000002',
    email: 'professor.web@eduquest.example',
    papel: 'professor',
    bio: 'Desenvolvedor web e professor de HTML, CSS e JavaScript. Foco em acessibilidade e boas práticas de front-end.',
  },
  {
    id: '5eed0000-0000-4000-8000-000000000003',
    email: 'estudante@eduquest.example',
    papel: 'estudante',
  },
  {
    id: '5eed0000-0000-4000-8000-000000000004',
    email: 'admin@eduquest.example',
    papel: 'administrador',
  },
]

const PROFESSOR_LOGICA = usuarios[0].id
const PROFESSOR_WEB = usuarios[1].id
const ESTUDANTE = usuarios[2].id

// IDs de referência compartilhados com o seed de F3 (questões e avaliações)
const CURSO_FUNDAMENTOS = '5eed0001-0000-4000-8000-000000000001'
const CURSO_WEB = '5eed0001-0000-4000-8000-000000000002'
const MODULO_INTRODUCAO = '5eed0002-0000-4000-8000-000000000001'
const MODULO_LOGICA = '5eed0002-0000-4000-8000-000000000002'
const MODULO_WEB_FUNDAMENTOS = '5eed0002-0000-4000-8000-000000000003'

const arvore: CursoSeed[] = [
  {
    id: CURSO_FUNDAMENTOS,
    titulo: 'Fundamentos de Programação',
    publicado: true,
    donoId: PROFESSOR_LOGICA,
    modulos: [
      {
        id: MODULO_INTRODUCAO,
        titulo: 'Introdução à Programação',
        publicado: true,
        aulas: [
          {
            id: '5eed0003-0000-4000-8000-000000000001',
            titulo: 'O que é programar?',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Bem-vindos ao curso de Fundamentos de Programação!

Programar é instruir o computador para executar uma tarefa passo a passo. Nesta aula você conhece o ciclo de trabalho de quem programa: escrever o código, executar, observar o resultado e corrigir.

Ao final você será capaz de explicar o que é um algoritmo e por que a ordem das instruções importa.`,
                },
              },
              {
                tipo: 'midia_embedada',
                dados: { url: 'https://www.youtube.com/embed/8mei6uVttho' },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000002',
            titulo: 'Variáveis e tipos de dados',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Uma variável é um nome que guarda um valor na memória do programa.

Tipos mais comuns:
- texto (string): "ola, mundo"
- inteiro: 42
- decimal: 3.14
- booleano: verdadeiro ou falso

Escolher o tipo certo evita erros silenciosos, como somar letras ou perder casas decimais em um preço.`,
                },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000003',
            titulo: 'Decisões condicionais: if e else',
            publicado: false,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Condições permitem ao programa escolher caminhos.

se (temperatura > 30):
    escrever("dia quente")
senão:
    escrever("dia ameno")

A expressão precisa ser verdadeira ou falsa. Aninhe com moderação: vários "senão" seguidos dificultam a leitura — prefira funções pequenas.`,
                },
              },
            ],
          },
        ],
      },
      {
        id: MODULO_LOGICA,
        titulo: 'Lógica e Repetição',
        publicado: true,
        aulas: [
          {
            id: '5eed0003-0000-4000-8000-000000000004',
            titulo: 'Laços de repetição: for e while',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Laços repetem um bloco de instruções enquanto uma condição for verdadeira.

- "para" (for): repete um número conhecido de vezes, percorrendo uma sequência.
- "enquanto" (while): repete enquanto a condição continuar verdadeira.

Cuidado com laços infinitos: sempre garanta que a condição de saída seja alcançada.`,
                },
              },
              {
                tipo: 'midia_embedada',
                dados: { url: 'https://www.youtube.com/embed/n5ETibjJcAE' },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000005',
            titulo: 'Exercícios práticos de repetição',
            publicado: false,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Pratique com três exercícios:
1. Somar os números de 1 a 100.
2. Contar quantas palavras de uma frase começam com a letra a.
3. Gerar a tabuada do 7.

Resolva primeiro no papel, escrevendo o algoritmo em português, e só depois transcreva para a linguagem que está estudando.`,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: CURSO_WEB,
    titulo: 'Desenvolvimento Web',
    publicado: true,
    donoId: PROFESSOR_WEB,
    modulos: [
      {
        id: MODULO_WEB_FUNDAMENTOS,
        titulo: 'Fundamentos da Web',
        publicado: true,
        aulas: [
          {
            id: '5eed0003-0000-4000-8000-000000000006',
            titulo: 'Como a web funciona',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `A web funciona por requisição e resposta: o navegador pede uma página e o servidor devolve o conteúdo.

- URL: o endereço do recurso
- HTTP: o protocolo da conversa (pedido e resposta)
- HTML: a estrutura da página
- CSS: a apresentação
- JavaScript: o comportamento

Nesta aula você acompanha o caminho de uma requisição, do DNS até o HTML renderizado.`,
                },
              },
              {
                tipo: 'midia_embedada',
                dados: { url: 'https://www.youtube.com/embed/kfzkK_tGZNM' },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000007',
            titulo: 'HTML semântico',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `HTML semântico descreve o papel de cada parte da página, não apenas a aparência.

Prefira header, nav, main, article, section e footer a divs genéricos.

Benefícios: leitores de tela entendem a estrutura, buscadores indexam melhor e o código fica mais fácil de manter.`,
                },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000008',
            titulo: 'CSS e o modelo de caixa',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Todo elemento em CSS é uma caixa: conteúdo, padding, borda e margem.

Regras práticas:
- use rem em vez de px para textos;
- box-sizing: border-box elimina surpresas de largura;
- margin funde margens verticais adjacentes; padding não.

Nesta aula você monta um layout de duas colunas só com o modelo de caixa.`,
                },
              },
            ],
          },
        ],
      },
      {
        id: '5eed0002-0000-4000-8000-000000000004',
        titulo: 'JavaScript no Navegador',
        publicado: false,
        aulas: [
          {
            id: '5eed0003-0000-4000-8000-000000000009',
            titulo: 'DOM e eventos',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `O DOM é a representação da página em memória do navegador.

- document.querySelector seleciona elementos;
- addEventListener registra reações (clique, teclado, envio de formulário);
- mudanças na página alteram os nós do DOM.

Pratique um contador de cliques e um formulário que valida a entrada antes de enviar.`,
                },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000010',
            titulo: 'Assincronismo e fetch',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Nem tudo termina na hora: ler um dado da rede leva tempo.

- callback: função chamada quando a operação termina;
- promessa (promise): objeto que representa o valor futuro;
- async/await: sintaxe que deixa o código sequencial por fora.

Exemplo: fetch("/api/v1/cursos") devolve uma promessa com a resposta.`,
                },
              },
              {
                tipo: 'midia_embedada',
                dados: { url: 'https://www.youtube.com/embed/q28lfkBd9F4' },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: '5eed0001-0000-4000-8000-000000000003',
    titulo: 'Banco de Dados e SQL',
    publicado: false,
    donoId: PROFESSOR_LOGICA,
    modulos: [
      {
        id: '5eed0002-0000-4000-8000-000000000005',
        titulo: 'Modelagem de Dados',
        publicado: true,
        aulas: [
          {
            id: '5eed0003-0000-4000-8000-000000000011',
            titulo: 'Entidades e relacionamentos',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `Um banco começa pelo modelo: quais informações o sistema guarda e como elas se relacionam.

- entidade: objeto do mundo real (curso, aula, usuário);
- atributo: característica (título, e-mail);
- relacionamento: ligação entre entidades (um módulo tem várias aulas).

Desenhe o modelo antes de criar as tabelas: mudar depois custa muito mais caro.`,
                },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000012',
            titulo: 'Chaves primárias e estrangeiras',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `A chave primária identifica cada linha de forma única e nunca se repete.

A chave estrangeira aponta para a chave de outra tabela e garante que as relações sejam verdadeiras: não existe aula de um módulo que não exista.

Com essas duas regras, o banco recusa dados inconsistentes desde o cadastro.`,
                },
              },
              {
                tipo: 'midia_embedada',
                dados: { url: 'https://www.youtube.com/embed/FPNvKqGHe0A' },
              },
            ],
          },
        ],
      },
      {
        id: '5eed0002-0000-4000-8000-000000000006',
        titulo: 'Consultas com SQL',
        publicado: false,
        aulas: [
          {
            id: '5eed0003-0000-4000-8000-000000000013',
            titulo: 'SELECT e WHERE',
            publicado: true,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `A consulta básica tem esta forma:

SELECT colunas FROM tabela WHERE condicao ORDER BY coluna;

Exemplos:
- listar cursos publicados: WHERE publicado = true;
- aulas de um módulo: WHERE modulo_id = valor;
- ordenar por título: ORDER BY titulo.

Combine filtros com AND e OR e leia sempre o resultado da consulta mais interna para fora.`,
                },
              },
            ],
          },
          {
            id: '5eed0003-0000-4000-8000-000000000014',
            titulo: 'JOINs na prática',
            publicado: false,
            blocos: [
              {
                tipo: 'texto',
                dados: {
                  texto: `JOIN combina linhas de duas tabelas pela relação entre elas.

Exemplo: listar as aulas de um curso com o título do módulo ao lado, ligando aula a módulo e módulo ao curso.

- INNER JOIN: só o que combina nos dois lados;
- LEFT JOIN: tudo da tabela da esquerda, mesmo sem correspondência.

Pratice montando a consulta antes de rodá-la: escrever primeiro evita selecionar tudo com SELECT *.`,
                },
              },
            ],
          },
        ],
      },
    ],
  },
]

// ====================== F3: questões, tentativas e avaliações ======================
// D4 (questões/exercícios) e D5 (avaliacoes): cenarios de demonstracao da UI.
// Prefixo fixo 5eed001x; janelas recalculadas a cada execucao.

interface AlternativaSeed {
  id: string
  texto: string
  correta: boolean
}

interface QuestaoSeed {
  id: string
  moduloId: string
  tipo: TipoQuestao
  enunciado: string
  explicacao: string | null
  publicado: boolean
  alternativas?: AlternativaSeed[]
  gabarito?: { valor: boolean } | { valor: number; tolerancia: number }
}

let contadorAlternativas = 0

// alternativas recebem IDs determinísticos na ordem de definição
function alternativas(opcoes: { texto: string; correta: boolean }[]): AlternativaSeed[] {
  return opcoes.map((opcao) => {
    contadorAlternativas += 1
    return {
      id: `5eed0011-0000-4000-8000-${String(contadorAlternativas).padStart(12, '0')}`,
      texto: opcao.texto,
      correta: opcao.correta,
    }
  })
}

const questoes: QuestaoSeed[] = [
  {
    id: '5eed0010-0000-4000-8000-000000000001',
    moduloId: MODULO_INTRODUCAO,
    tipo: 'multipla_escolha',
    publicado: true,
    enunciado: 'Quais alternativas descrevem um algoritmo?',
    explicacao:
      'Algoritmo é uma sequência finita e ordenada de passos que resolve um problema; qualquer programa é uma implementação concreta e uma receita sem ordem não resolve nada sozinha.',
    alternativas: alternativas([
      { texto: 'Uma sequência finita de instruções que resolve um problema', correta: true },
      { texto: 'Um conjunto de instruções com início, meio e fim', correta: true },
      { texto: 'Qualquer programa escrito em Python', correta: false },
      { texto: 'Uma receita de bolo escrita sem a ordem das etapas', correta: false },
    ]),
  },
  {
    id: '5eed0010-0000-4000-8000-000000000002',
    moduloId: MODULO_INTRODUCAO,
    tipo: 'verdadeiro_falso',
    publicado: true,
    enunciado: 'Em linguagens de tipagem dinâmica toda variável precisa declarar seu tipo antes do uso.',
    explicacao:
      'Falso: em tipagem dinâmica o tipo é definido em tempo de execução. Quem declara o tipo antes é a tipagem estática.',
    gabarito: { valor: false },
  },
  {
    id: '5eed0010-0000-4000-8000-000000000003',
    moduloId: MODULO_INTRODUCAO,
    tipo: 'numerica',
    publicado: true,
    enunciado: 'Quantos números inteiros existem entre 1 e 100, incluindo as extremidades?',
    explicacao: 'Contando as extremidades: 100 − 1 + 1 = 100. São 100 números inteiros de 1 a 100.',
    gabarito: { valor: 100, tolerancia: 0 },
  },
  {
    id: '5eed0010-0000-4000-8000-000000000004',
    moduloId: MODULO_INTRODUCAO,
    tipo: 'dissertativa',
    publicado: true,
    enunciado: 'Explique com suas palavras por que a ordem das instruções importa em um algoritmo.',
    explicacao:
      'Uma boa resposta mostra que instruções trocadas de ordem produzem resultado diferente — por exemplo, subtrair antes de dividir muda o resultado.',
  },
  {
    id: '5eed0010-0000-4000-8000-000000000005',
    moduloId: MODULO_INTRODUCAO,
    tipo: 'multipla_escolha',
    publicado: false,
    enunciado: 'Rascunho: qual estrutura repete um bloco de código enquanto a condição for verdadeira?',
    explicacao: null,
    alternativas: alternativas([
      { texto: 'Laço de repetição', correta: true },
      { texto: 'Decisão condicional', correta: false },
      { texto: 'Função', correta: false },
    ]),
  },
  {
    id: '5eed0010-0000-4000-8000-000000000006',
    moduloId: MODULO_LOGICA,
    tipo: 'multipla_escolha',
    publicado: true,
    enunciado: 'Quais estruturas permitem repetir um bloco de código?',
    explicacao: 'for e while são estruturas de repetição; if é decisão e return encerra uma função.',
    alternativas: alternativas([
      { texto: 'for', correta: true },
      { texto: 'while', correta: true },
      { texto: 'if', correta: false },
      { texto: 'return', correta: false },
    ]),
  },
  {
    id: '5eed0010-0000-4000-8000-000000000007',
    moduloId: MODULO_LOGICA,
    tipo: 'numerica',
    publicado: true,
    enunciado: 'Qual é o resultado da soma de todos os números de 1 a 10?',
    explicacao: 'S = n × (n + 1) ÷ 2 = 10 × 11 ÷ 2 = 55.',
    gabarito: { valor: 55, tolerancia: 0 },
  },
  {
    id: '5eed0010-0000-4000-8000-000000000008',
    moduloId: MODULO_WEB_FUNDAMENTOS,
    tipo: 'multipla_escolha',
    publicado: true,
    enunciado: 'Quais elementos do HTML são considerados semânticos?',
    explicacao:
      'header e nav descrevem a função do conteúdo; div e span são caixas genéricas, sem significado para quem lê a página.',
    alternativas: alternativas([
      { texto: 'header', correta: true },
      { texto: 'nav', correta: true },
      { texto: 'div', correta: false },
      { texto: 'span', correta: false },
    ]),
  },
  {
    id: '5eed0010-0000-4000-8000-000000000009',
    moduloId: MODULO_WEB_FUNDAMENTOS,
    tipo: 'verdadeiro_falso',
    publicado: true,
    enunciado: 'O CSS é interpretado pelo navegador para definir a apresentação da página.',
    explicacao: 'Verdadeiro: o navegador aplica as regras de CSS ao renderizar. A estrutura, por outro lado, é o HTML.',
    gabarito: { valor: true },
  },
]

const [qAlgoritmo, qTipagem, qInteiros, qOrdem, qRascunho, qRepeticao, qSoma, qSemantica, qCss] = questoes

interface TentativaQuestaoSeed {
  id: string
  questaoId: string
  usuarioId: string
  resposta: Prisma.InputJsonValue
  acerto: boolean | null
}

const tentativasQuestao: TentativaQuestaoSeed[] = [
  {
    id: '5eed0012-0000-4000-8000-000000000001',
    questaoId: qAlgoritmo.id,
    usuarioId: ESTUDANTE,
    resposta: { alternativas: [qAlgoritmo.alternativas![0].id, qAlgoritmo.alternativas![1].id] },
    acerto: true,
  },
  {
    id: '5eed0012-0000-4000-8000-000000000002',
    questaoId: qTipagem.id,
    usuarioId: ESTUDANTE,
    resposta: { valor: true },
    acerto: false,
  },
  {
    id: '5eed0012-0000-4000-8000-000000000003',
    questaoId: qInteiros.id,
    usuarioId: ESTUDANTE,
    resposta: { valor: 100 },
    acerto: true,
  },
  {
    id: '5eed0012-0000-4000-8000-000000000004',
    questaoId: qOrdem.id,
    usuarioId: ESTUDANTE,
    resposta: {
      texto: 'A ordem importa porque cada instrução usa o resultado da anterior; trocando a ordem, o resultado final muda.',
    },
    acerto: null,
  },
]

const AGORA_SEED = new Date()

function emDias(dias: number): Date {
  return new Date(AGORA_SEED.getTime() + dias * 86_400_000)
}

function emHoras(horas: number): Date {
  return new Date(AGORA_SEED.getTime() + horas * 3_600_000)
}

interface ItemComposicaoSeed {
  questaoId: string
  peso: number
}

interface AvaliacaoSeed {
  id: string
  cursoId: string
  titulo: string
  tentativasMax: number
  abreEm: Date
  fechaEm: Date
  publicado: boolean
  questoes: ItemComposicaoSeed[]
}

const avaliacoes: AvaliacaoSeed[] = [
  {
    id: '5eed0013-0000-4000-8000-000000000001',
    cursoId: CURSO_FUNDAMENTOS,
    titulo: 'Avaliação inicial — Fundamentos',
    tentativasMax: 3,
    abreEm: emDias(-30),
    fechaEm: emDias(-7),
    publicado: true,
    questoes: [
      { questaoId: qAlgoritmo.id, peso: 4 },
      { questaoId: qTipagem.id, peso: 2 },
      { questaoId: qInteiros.id, peso: 3 },
      { questaoId: qOrdem.id, peso: 1 },
    ],
  },
  {
    id: '5eed0013-0000-4000-8000-000000000002',
    cursoId: CURSO_FUNDAMENTOS,
    titulo: 'Avaliação parcial — Fundamentos',
    tentativasMax: 2,
    abreEm: emHoras(-36),
    fechaEm: emDias(7),
    publicado: true,
    questoes: [
      { questaoId: qRepeticao.id, peso: 5 },
      { questaoId: qSoma.id, peso: 5 },
    ],
  },
  {
    id: '5eed0013-0000-4000-8000-000000000003',
    cursoId: CURSO_FUNDAMENTOS,
    titulo: 'Prova final — Fundamentos',
    tentativasMax: 1,
    abreEm: emDias(14),
    fechaEm: emDias(21),
    publicado: false,
    questoes: [
      { questaoId: qAlgoritmo.id, peso: 6 },
      { questaoId: qTipagem.id, peso: 4 },
    ],
  },
  {
    id: '5eed0013-0000-4000-8000-000000000004',
    cursoId: CURSO_FUNDAMENTOS,
    titulo: 'Avaliação complementar — Fundamentos',
    tentativasMax: 3,
    abreEm: emDias(7),
    fechaEm: emDias(14),
    publicado: true,
    questoes: [
      { questaoId: qInteiros.id, peso: 5 },
      { questaoId: qOrdem.id, peso: 5 },
    ],
  },
  {
    id: '5eed0013-0000-4000-8000-000000000005',
    cursoId: CURSO_WEB,
    titulo: 'Avaliação de Front-end',
    tentativasMax: 2,
    abreEm: emDias(-2),
    fechaEm: emDias(5),
    publicado: true,
    questoes: [
      { questaoId: qSemantica.id, peso: 8 },
      { questaoId: qCss.id, peso: 2 },
    ],
  },
]

interface RespostaAvaliacaoSeed {
  id: string
  questaoId: string
  resposta: Prisma.InputJsonValue
  acerto: boolean | null
  pontos: number | null
}

let contadorRespostas = 0

// respostas recebem IDs determinísticos na ordem de definição
function respostas(itens: Omit<RespostaAvaliacaoSeed, 'id'>[]): RespostaAvaliacaoSeed[] {
  return itens.map((item) => {
    contadorRespostas += 1
    return {
      id: `5eed0015-0000-4000-8000-${String(contadorRespostas).padStart(12, '0')}`,
      ...item,
    }
  })
}

interface TentativaAvaliacaoSeed {
  id: string
  avaliacaoId: string
  usuarioId: string
  status: StatusTentativaAvaliacao
  nota: number | null
  enviadaEm: Date
  respostas: RespostaAvaliacaoSeed[]
}

const tentativasAvaliacao: TentativaAvaliacaoSeed[] = [
  {
    id: '5eed0014-0000-4000-8000-000000000001',
    avaliacaoId: avaliacoes[0].id,
    usuarioId: ESTUDANTE,
    status: 'aguardando_correcao',
    nota: null,
    enviadaEm: emDias(-20),
    respostas: respostas([
      {
        questaoId: qAlgoritmo.id,
        resposta: { alternativas: [qAlgoritmo.alternativas![0].id, qAlgoritmo.alternativas![1].id] },
        acerto: true,
        pontos: 4,
      },
      { questaoId: qTipagem.id, resposta: { valor: true }, acerto: false, pontos: 0 },
      { questaoId: qInteiros.id, resposta: { valor: 100 }, acerto: true, pontos: 3 },
      {
        questaoId: qOrdem.id,
        resposta: { texto: 'A ordem importa porque cada instrução usa o resultado da anterior.' },
        acerto: null,
        pontos: null,
      },
    ]),
  },
  {
    id: '5eed0014-0000-4000-8000-000000000002',
    avaliacaoId: avaliacoes[0].id,
    usuarioId: ESTUDANTE,
    status: 'corrigida',
    nota: 9,
    enviadaEm: emDias(-15),
    respostas: respostas([
      {
        questaoId: qAlgoritmo.id,
        resposta: { alternativas: [qAlgoritmo.alternativas![0].id, qAlgoritmo.alternativas![1].id] },
        acerto: true,
        pontos: 4,
      },
      { questaoId: qTipagem.id, resposta: { valor: false }, acerto: true, pontos: 2 },
      { questaoId: qInteiros.id, resposta: { valor: 100 }, acerto: true, pontos: 3 },
      { questaoId: qOrdem.id, resposta: { texto: 'Qualquer ordem serve.' }, acerto: null, pontos: 0 },
    ]),
  },
  {
    id: '5eed0014-0000-4000-8000-000000000003',
    avaliacaoId: avaliacoes[4].id,
    usuarioId: ESTUDANTE,
    status: 'corrigida',
    nota: 8,
    enviadaEm: emDias(-1),
    respostas: respostas([
      {
        questaoId: qSemantica.id,
        resposta: { alternativas: [qSemantica.alternativas![0].id, qSemantica.alternativas![1].id] },
        acerto: true,
        pontos: 8,
      },
      { questaoId: qCss.id, resposta: { valor: false }, acerto: false, pontos: 0 },
    ]),
  },
]

let tick = 0

function proximoInstante(): Date {
  tick += 1
  return new Date(BASE.getTime() + tick * 60_000)
}

function idConteudo(n: number): string {
  return `5eed0004-0000-4000-8000-${String(n).padStart(12, '0')}`
}

async function principal(): Promise<void> {
  if ((process.env.DATABASE_URL ?? '').includes('eduquest_test')) {
    throw new Error('seed recusado: DATABASE_URL aponta para o banco de teste (eduquest_test)')
  }

  console.log('[seed] EduQuest — seed de DESENVOLVIMENTO (não usar em produção)')
  const hash = await gerarHash(SENHA_DEV)

  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { id: usuario.id },
      create: {
        id: usuario.id,
        email: usuario.email,
        papel: usuario.papel,
        criado_em: proximoInstante(),
      },
      update: { email: usuario.email, papel: usuario.papel },
    })
    await prisma.credencial.upsert({
      where: { usuario_id: usuario.id },
      create: { usuario_id: usuario.id, hash_senha: hash },
      update: { hash_senha: hash },
    })
    if (usuario.papel === 'professor') {
      const bio = usuario.bio ?? null
      const perfil = await prisma.perfilProfessor.findUnique({
        where: { usuario_id: usuario.id },
      })
      if (perfil) {
        await prisma.perfilProfessor.update({
          where: { usuario_id: usuario.id },
          data: { bio },
        })
      } else {
        await prisma.perfilProfessor.create({ data: { usuario_id: usuario.id, bio } })
      }
    } else if (usuario.papel === 'estudante') {
      const perfil = await prisma.perfilEstudante.findUnique({
        where: { usuario_id: usuario.id },
      })
      if (!perfil) {
        await prisma.perfilEstudante.create({ data: { usuario_id: usuario.id } })
      }
    }
  }

  const idsAulas: string[] = []
  const linhasConteudo: {
    id: string
    aula_id: string
    tipo: TipoSeed
    posicao: number
    dados: { texto: string } | { url: string }
    criado_em: Date
  }[] = []
  let sequenciaConteudo = 0

  for (const curso of arvore) {
    await prisma.curso.upsert({
      where: { id: curso.id },
      create: {
        id: curso.id,
        titulo: curso.titulo,
        dono_id: curso.donoId,
        publicado: curso.publicado,
        criado_em: proximoInstante(),
      },
      update: { titulo: curso.titulo, dono_id: curso.donoId, publicado: curso.publicado },
    })
    for (const modulo of curso.modulos) {
      await prisma.modulo.upsert({
        where: { id: modulo.id },
        create: {
          id: modulo.id,
          curso_id: curso.id,
          titulo: modulo.titulo,
          publicado: modulo.publicado,
          criado_em: proximoInstante(),
        },
        update: { titulo: modulo.titulo, publicado: modulo.publicado },
      })
      for (const aula of modulo.aulas) {
        await prisma.aula.upsert({
          where: { id: aula.id },
          create: {
            id: aula.id,
            modulo_id: modulo.id,
            titulo: aula.titulo,
            publicado: aula.publicado,
            criado_em: proximoInstante(),
          },
          update: { titulo: aula.titulo, publicado: aula.publicado },
        })
        idsAulas.push(aula.id)
        aula.blocos.forEach((bloco, posicao) => {
          sequenciaConteudo += 1
          linhasConteudo.push({
            id: idConteudo(sequenciaConteudo),
            aula_id: aula.id,
            tipo: bloco.tipo,
            posicao,
            dados: bloco.dados,
            criado_em: proximoInstante(),
          })
        })
      }
    }
  }

  const remocao = prisma.conteudoAula.deleteMany({ where: { aula_id: { in: idsAulas } } })
  if (linhasConteudo.length > 0) {
    await prisma.$transaction([
      remocao,
      prisma.conteudoAula.createMany({ data: linhasConteudo }),
    ])
  } else {
    await remocao
  }

  // ---- F3-01–F3-06: questões (alternativas substituídas por substituição total) ----
  for (const questao of questoes) {
    await prisma.questao.upsert({
      where: { id: questao.id },
      create: {
        id: questao.id,
        modulo_id: questao.moduloId,
        tipo: questao.tipo,
        enunciado: questao.enunciado,
        explicacao: questao.explicacao,
        gabarito: questao.gabarito ?? Prisma.DbNull,
        publicado: questao.publicado,
        criado_em: proximoInstante(),
      },
      update: {
        modulo_id: questao.moduloId,
        tipo: questao.tipo,
        enunciado: questao.enunciado,
        explicacao: questao.explicacao,
        gabarito: questao.gabarito ?? Prisma.DbNull,
        publicado: questao.publicado,
      },
    })
    if (questao.alternativas) {
      await prisma.$transaction([
        prisma.alternativa.deleteMany({ where: { questao_id: questao.id } }),
        prisma.alternativa.createMany({
          data: questao.alternativas.map((alternativa, posicao) => ({
            id: alternativa.id,
            questao_id: questao.id,
            texto: alternativa.texto,
            correta: alternativa.correta,
            posicao,
          })),
        }),
      ])
    }
  }

  for (const tentativa of tentativasQuestao) {
    await prisma.tentativa.upsert({
      where: { id: tentativa.id },
      create: {
        id: tentativa.id,
        questao_id: tentativa.questaoId,
        usuario_id: tentativa.usuarioId,
        resposta: tentativa.resposta,
        acerto: tentativa.acerto,
        criado_em: proximoInstante(),
      },
      update: { resposta: tentativa.resposta, acerto: tentativa.acerto },
    })
  }

  // ---- F3-07–F3-13: avaliações (composição reescrita por substituição total) ----
  for (const avaliacao of avaliacoes) {
    await prisma.avaliacao.upsert({
      where: { id: avaliacao.id },
      create: {
        id: avaliacao.id,
        curso_id: avaliacao.cursoId,
        titulo: avaliacao.titulo,
        tentativas_max: avaliacao.tentativasMax,
        abre_em: avaliacao.abreEm,
        fecha_em: avaliacao.fechaEm,
        publicado: avaliacao.publicado,
        criado_em: proximoInstante(),
      },
      update: {
        titulo: avaliacao.titulo,
        tentativas_max: avaliacao.tentativasMax,
        abre_em: avaliacao.abreEm,
        fecha_em: avaliacao.fechaEm,
        publicado: avaliacao.publicado,
      },
    })
    await prisma.$transaction([
      prisma.avaliacaoQuestao.deleteMany({ where: { avaliacao_id: avaliacao.id } }),
      prisma.avaliacaoQuestao.createMany({
        data: avaliacao.questoes.map((item, posicao) => ({
          avaliacao_id: avaliacao.id,
          questao_id: item.questaoId,
          peso: item.peso,
          posicao,
        })),
      }),
    ])
  }

  for (const tentativa of tentativasAvaliacao) {
    await prisma.tentativaAvaliacao.upsert({
      where: { id: tentativa.id },
      create: {
        id: tentativa.id,
        avaliacao_id: tentativa.avaliacaoId,
        usuario_id: tentativa.usuarioId,
        status: tentativa.status,
        nota: tentativa.nota,
        enviada_em: tentativa.enviadaEm,
        criado_em: proximoInstante(),
      },
      update: {
        status: tentativa.status,
        nota: tentativa.nota,
        enviada_em: tentativa.enviadaEm,
      },
    })
    for (const resposta of tentativa.respostas) {
      await prisma.respostaAvaliacao.upsert({
        where: { id: resposta.id },
        create: {
          id: resposta.id,
          tentativa_id: tentativa.id,
          questao_id: resposta.questaoId,
          resposta: resposta.resposta,
          acerto: resposta.acerto,
          pontos: resposta.pontos,
          criado_em: proximoInstante(),
        },
        update: {
          resposta: resposta.resposta,
          acerto: resposta.acerto,
          pontos: resposta.pontos,
        },
      })
    }
  }

  const aulas = arvore.flatMap((curso) => curso.modulos.flatMap((modulo) => modulo.aulas))
  const blocos = aulas.flatMap((aula) => aula.blocos)
  const contaPublicados = (itens: { publicado: boolean }[]) =>
    `${itens.filter((item) => item.publicado).length} publicados / ${
      itens.filter((item) => !item.publicado).length
    } rascunho`
  const modulos = arvore.flatMap((curso) => curso.modulos)

  console.log(
    `[seed] ${usuarios.length} usuários · ${arvore.length} cursos · ${modulos.length} módulos · ` +
      `${aulas.length} aulas · ${blocos.length} blocos de conteúdo`
  )
  console.log(
    `[seed] estados — cursos ${contaPublicados(arvore)} · módulos ${contaPublicados(modulos)} · ` +
      `aulas ${contaPublicados(aulas)}`
  )
  console.log(
    `[seed] conteúdo: ${blocos.filter((b) => b.tipo === 'texto').length} texto + ` +
      `${blocos.filter((b) => b.tipo === 'midia_embedada').length} midia_embedada ` +
      `(reescrito nas ${aulas.length} aulas-seed; material_anexo não seedado — requer F2-15/F2-16)`
  )
  console.log(
    `[seed] questões — ${questoes.length} (${contaPublicados(questoes)}) · ` +
      `${contadorAlternativas} alternativas · ${tentativasQuestao.length} tentativas de exercício`
  )
  console.log(
    `[seed] avaliações — ${avaliacoes.length} (${contaPublicados(avaliacoes)}) · ` +
      `${tentativasAvaliacao.length} tentativas com ${contadorRespostas} respostas ` +
      `(cenários: encerrada com histórico, aberta, futura e rascunho)`
  )
  console.log('[seed] acesso de desenvolvimento (mesma senha para todos):')
  for (const usuario of usuarios) {
    console.log(`  ${usuario.papel.padEnd(14)} ${usuario.email} / ${SENHA_DEV}`)
  }
}

principal()
  .then(async () => {
    await prisma.$disconnect()
    console.log('[seed] concluído')
  })
  .catch(async (erro) => {
    console.error('[seed] falhou:', erro)
    await prisma.$disconnect()
    process.exit(1)
  })
