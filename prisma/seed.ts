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
 * - Recusa rodar contra o banco de teste (`eduquest_test`).
 */
import 'dotenv/config'
import type { Papel } from '@prisma/client'
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

const arvore: CursoSeed[] = [
  {
    id: '5eed0001-0000-4000-8000-000000000001',
    titulo: 'Fundamentos de Programação',
    publicado: true,
    donoId: PROFESSOR_LOGICA,
    modulos: [
      {
        id: '5eed0002-0000-4000-8000-000000000001',
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
        id: '5eed0002-0000-4000-8000-000000000002',
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
    id: '5eed0001-0000-4000-8000-000000000002',
    titulo: 'Desenvolvimento Web',
    publicado: true,
    donoId: PROFESSOR_WEB,
    modulos: [
      {
        id: '5eed0002-0000-4000-8000-000000000003',
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
