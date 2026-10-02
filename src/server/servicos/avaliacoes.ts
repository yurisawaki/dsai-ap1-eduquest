import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { erroConflito, erroNaoEncontrado, erroValidacao } from '../erros'
import { prisma } from '../prisma'
import { uuidValido } from '../tipos'
import { ehDonoOuAdmin, exigirAutoria, type UsuarioSessao } from './catalogo'
import {
  corrigirResposta,
  incluirCadeia,
  montarQuestao,
  type QuestaoComCadeia,
  type QuestaoLida,
} from './questoes'
import { concederXp, eventoDeNota, maiorNotaRemunerada, type EventoNovo } from './xp'

// SPEC/2026-10-01-avaliacoes.md (D5, DP-09)
const Decimal = Prisma.Decimal

// D5-a: limites revisáveis pela SPEC de NFRs (P-36)
const MAXIMO_QUESTOES = 100
const MAXIMO_PESO = 1_000
const MAXIMO_TENTATIVAS = 100

const instanteIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

interface ItemComposicao {
  questaoId: string
  peso: number
}

export interface AvaliacaoLida {
  id: string
  cursoId: string
  titulo: string
  tentativasMax: number
  abreEm: string
  fechaEm: string
  publicado: boolean
  questoes?: { questao: QuestaoLida; peso: number }[]
}

export interface TentativaLida {
  id: string
  usuarioId: string
  enviadaEm: string
  status: 'aguardando_correcao' | 'corrigida'
  nota: number | null
  respostas: { questaoId: string; resposta: unknown; acerto: boolean | null; pontos: number | null }[]
}

function registro(valor: unknown, rotulo: string): Record<string, unknown> {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
    throw erroValidacao(`${rotulo} invalido`)
  }
  return valor as Record<string, unknown>
}

function chavesExatas(valor: unknown, chaves: readonly string[], rotulo: string) {
  const objeto = registro(valor, rotulo)
  const presentes = Object.keys(objeto)
  if (presentes.length !== chaves.length || !chaves.every((chave) => presentes.includes(chave))) {
    throw erroValidacao(`${rotulo} deve conter exatamente: ${chaves.join(', ')}`)
  }
  return objeto
}

function camposPermitidos(corpo: Record<string, unknown>, permitidos: readonly string[]) {
  for (const chave of Object.keys(corpo)) {
    if (!permitidos.includes(chave)) throw erroValidacao(`campo nao permitido: ${chave}`)
  }
}

// F-4: decimal positivo com no máximo 2 casas
function duasCasas(valor: number): boolean {
  const centavos = valor * 100
  return Math.abs(centavos - Math.round(centavos)) < 1e-9
}

function tituloValido(valor: unknown): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) throw erroValidacao('titulo obrigatorio')
  return valor
}

function tentativasValidas(valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > MAXIMO_TENTATIVAS) {
    throw erroValidacao(`tentativasMax deve ser inteiro de 1 a ${MAXIMO_TENTATIVAS}`)
  }
  return valor
}

function instanteValido(valor: unknown, rotulo: string): Date {
  const data = typeof valor === 'string' && instanteIso.test(valor) ? new Date(valor) : null
  if (!data || Number.isNaN(data.getTime())) {
    throw erroValidacao(`${rotulo} deve ser instante ISO 8601 com fuso`)
  }
  return data
}

function janelaValida(abre: Date, fecha: Date) {
  if (abre.getTime() >= fecha.getTime()) throw erroValidacao('abreEm deve ser anterior a fechaEm')
}

// R-A2: 1–100 questões distintas do mesmo curso, peso > 0, ≤ 1.000, 2 casas
async function composicaoValida(cursoId: string, valor: unknown): Promise<ItemComposicao[]> {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > MAXIMO_QUESTOES) {
    throw erroValidacao(`a avaliacao deve ter de 1 a ${MAXIMO_QUESTOES} questoes`)
  }
  const itens = valor.map((item) => {
    const entrada = chavesExatas(item, ['questaoId', 'peso'], 'item da composicao')
    const { questaoId, peso } = entrada
    if (typeof questaoId !== 'string' || !uuidValido.test(questaoId)) {
      throw erroValidacao('questaoId invalido')
    }
    if (typeof peso !== 'number' || !Number.isFinite(peso) || peso <= 0 || peso > MAXIMO_PESO || !duasCasas(peso)) {
      throw erroValidacao(`peso deve ser positivo, ate ${MAXIMO_PESO}, com no maximo 2 casas`)
    }
    return { questaoId, peso }
  })
  const ids = itens.map((item) => item.questaoId)
  if (new Set(ids).size !== ids.length) throw erroValidacao('questao repetida na composicao')
  const doCurso = await prisma.questao.count({
    where: { id: { in: ids }, modulo: { curso_id: cursoId } },
  })
  if (doCurso !== ids.length) throw erroValidacao('questao inexistente ou de outro curso')
  return itens
}

function dadosComposicao(avaliacaoId: string, itens: ItemComposicao[]) {
  return itens.map((item, posicao) => ({
    avaliacao_id: avaliacaoId,
    questao_id: item.questaoId,
    peso: new Decimal(item.peso),
    posicao,
  }))
}

const incluirAvaliacao = {
  curso: { select: { dono_id: true, publicado: true } },
  questoes: { orderBy: { posicao: 'asc' }, include: { questao: { include: incluirCadeia } } },
} satisfies Prisma.AvaliacaoInclude

type AvaliacaoCompleta = Prisma.AvaliacaoGetPayload<{ include: typeof incluirAvaliacao }>

async function buscarAvaliacao(id: unknown): Promise<AvaliacaoCompleta | null> {
  if (typeof id !== 'string' || !uuidValido.test(id)) return null
  return prisma.avaliacao.findUnique({ where: { id }, include: incluirAvaliacao })
}

// R-A4: leitor comum só vê avaliação publicada de curso publicado
function avaliacaoVisivel(avaliacao: AvaliacaoCompleta, usuario: UsuarioSessao): boolean {
  return (
    (avaliacao.publicado && avaliacao.curso.publicado) ||
    ehDonoOuAdmin(avaliacao.curso.dono_id, usuario)
  )
}

async function avaliacaoVisivelPara(id: unknown, usuario: UsuarioSessao): Promise<AvaliacaoCompleta> {
  const avaliacao = await buscarAvaliacao(id)
  if (!avaliacao || !avaliacaoVisivel(avaliacao, usuario)) {
    throw erroNaoEncontrado('avaliacao nao encontrada')
  }
  return avaliacao
}

async function avaliacaoParaAlteracao(id: unknown, usuario: UsuarioSessao): Promise<AvaliacaoCompleta> {
  const avaliacao = await buscarAvaliacao(id)
  if (!avaliacao) throw erroNaoEncontrado('avaliacao nao encontrada')
  exigirAutoria(avaliacao.curso.dono_id, usuario)
  return avaliacao
}

function dentroDaJanela(avaliacao: { abre_em: Date; fecha_em: Date }, agora = new Date()): boolean {
  return agora >= avaliacao.abre_em && agora <= avaliacao.fecha_em
}

// D5-c/R-A11: questões só para dono/admin ou, para o estudante, dentro da janela e sem gabarito
function montarAvaliacao(avaliacao: AvaliacaoCompleta, usuario: UsuarioSessao, comQuestoes: boolean): AvaliacaoLida {
  const autor = ehDonoOuAdmin(avaliacao.curso.dono_id, usuario)
  const lida: AvaliacaoLida = {
    id: avaliacao.id,
    cursoId: avaliacao.curso_id,
    titulo: avaliacao.titulo,
    tentativasMax: avaliacao.tentativas_max,
    abreEm: avaliacao.abre_em.toISOString(),
    fechaEm: avaliacao.fecha_em.toISOString(),
    publicado: avaliacao.publicado,
  }
  if (comQuestoes && (autor || dentroDaJanela(avaliacao))) {
    lida.questoes = avaliacao.questoes.map((item) => ({
      questao: montarQuestao(item.questao, autor),
      peso: item.peso.toNumber(),
    }))
  }
  return lida
}

// F3-07
export async function criarAvaliacao(usuario: UsuarioSessao, cursoId: unknown, corpo: unknown) {
  const curso =
    typeof cursoId === 'string' && uuidValido.test(cursoId)
      ? await prisma.curso.findUnique({ where: { id: cursoId } })
      : null
  if (!curso) throw erroNaoEncontrado('curso nao encontrado')
  exigirAutoria(curso.dono_id, usuario)

  const entrada = chavesExatas(
    corpo,
    ['titulo', 'tentativasMax', 'abreEm', 'fechaEm', 'questoes'],
    'corpo da avaliacao'
  )
  const titulo = tituloValido(entrada.titulo)
  const tentativasMax = tentativasValidas(entrada.tentativasMax)
  const abre = instanteValido(entrada.abreEm, 'abreEm')
  const fecha = instanteValido(entrada.fechaEm, 'fechaEm')
  janelaValida(abre, fecha)
  const itens = await composicaoValida(curso.id, entrada.questoes)

  const id = randomUUID()
  await prisma.$transaction([
    prisma.avaliacao.create({
      data: {
        id,
        curso_id: curso.id,
        titulo,
        tentativas_max: tentativasMax,
        abre_em: abre,
        fecha_em: fecha,
        publicado: false,
      },
    }),
    prisma.avaliacaoQuestao.createMany({ data: dadosComposicao(id, itens) }),
  ])
  return { avaliacaoId: id }
}

// F3-08
export async function listarAvaliacoes(usuario: UsuarioSessao, cursoId: unknown): Promise<AvaliacaoLida[]> {
  const curso =
    typeof cursoId === 'string' && uuidValido.test(cursoId)
      ? await prisma.curso.findUnique({ where: { id: cursoId } })
      : null
  if (!curso) throw erroNaoEncontrado('curso nao encontrado')
  const autor = ehDonoOuAdmin(curso.dono_id, usuario)
  if (!autor && !curso.publicado) throw erroNaoEncontrado('curso nao encontrado')
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { curso_id: curso.id, ...(autor ? {} : { publicado: true }) },
    include: incluirAvaliacao,
    orderBy: [{ abre_em: 'asc' }, { id: 'asc' }],
  })
  return avaliacoes.map((avaliacao) => montarAvaliacao(avaliacao, usuario, false))
}

// F3-09
export async function lerAvaliacao(usuario: UsuarioSessao, id: unknown): Promise<AvaliacaoLida> {
  return montarAvaliacao(await avaliacaoVisivelPara(id, usuario), usuario, true)
}

// F3-10
export async function editarAvaliacao(usuario: UsuarioSessao, id: unknown, corpo: unknown): Promise<AvaliacaoLida> {
  const avaliacao = await avaliacaoParaAlteracao(id, usuario)
  const entrada = registro(corpo, 'corpo da avaliacao')

  // D5-d: composição congelada após a primeira tentativa (409 antes da validação do corpo)
  if ('questoes' in entrada) {
    const tentativas = await prisma.tentativaAvaliacao.count({ where: { avaliacao_id: avaliacao.id } })
    if (tentativas > 0) throw erroConflito('composicao bloqueada: a avaliacao ja tem tentativas')
  }
  camposPermitidos(entrada, ['titulo', 'tentativasMax', 'abreEm', 'fechaEm', 'questoes', 'publicado'])
  if (Object.keys(entrada).length === 0) throw erroValidacao('corpo sem alteracoes')

  const dados: Prisma.AvaliacaoUpdateInput = {}
  if ('titulo' in entrada) dados.titulo = tituloValido(entrada.titulo)
  if ('tentativasMax' in entrada) dados.tentativas_max = tentativasValidas(entrada.tentativasMax)
  if ('publicado' in entrada) {
    if (typeof entrada.publicado !== 'boolean') throw erroValidacao('publicado invalido')
    dados.publicado = entrada.publicado
  }
  const abre = 'abreEm' in entrada ? instanteValido(entrada.abreEm, 'abreEm') : avaliacao.abre_em
  const fecha = 'fechaEm' in entrada ? instanteValido(entrada.fechaEm, 'fechaEm') : avaliacao.fecha_em
  janelaValida(abre, fecha)
  dados.abre_em = abre
  dados.fecha_em = fecha
  const itens = 'questoes' in entrada ? await composicaoValida(avaliacao.curso_id, entrada.questoes) : null

  const operacoes: Prisma.PrismaPromise<unknown>[] = [
    prisma.avaliacao.update({ where: { id: avaliacao.id }, data: dados }),
  ]
  if (itens) {
    operacoes.push(
      prisma.avaliacaoQuestao.deleteMany({ where: { avaliacao_id: avaliacao.id } }),
      prisma.avaliacaoQuestao.createMany({ data: dadosComposicao(avaliacao.id, itens) })
    )
  }
  await prisma.$transaction(operacoes)
  return montarAvaliacao((await buscarAvaliacao(avaliacao.id))!, usuario, true)
}

// F3-11
export async function excluirAvaliacao(usuario: UsuarioSessao, id: unknown): Promise<void> {
  const avaliacao = await avaliacaoParaAlteracao(id, usuario)
  await prisma.avaliacao.delete({ where: { id: avaliacao.id } })
}

// R-A8: nota = 10 × Σpontos ÷ Σpesos, 2 casas, meio para cima (D5-f)
function calcularNota(pesos: Prisma.Decimal[], pontos: Prisma.Decimal[]): Prisma.Decimal {
  const totalPesos = pesos.reduce((soma, peso) => soma.plus(peso), new Decimal(0))
  const totalPontos = pontos.reduce((soma, ponto) => soma.plus(ponto), new Decimal(0))
  return totalPontos.div(totalPesos).times(10).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

// F3-12
export async function realizarAvaliacao(usuario: UsuarioSessao, id: unknown, corpo: unknown) {
  const avaliacao = await avaliacaoVisivelPara(id, usuario)
  const agora = new Date()
  if (!dentroDaJanela(avaliacao, agora)) throw erroConflito('avaliacao fora da janela')
  const usadas = await prisma.tentativaAvaliacao.count({
    where: { avaliacao_id: avaliacao.id, usuario_id: usuario.id },
  })
  if (usadas >= avaliacao.tentativas_max) throw erroConflito('tentativas esgotadas')

  // R-A7: envio único; cada questão da composição no máximo uma vez
  const { respostas } = chavesExatas(corpo, ['respostas'], 'corpo da tentativa')
  if (!Array.isArray(respostas)) throw erroValidacao('respostas deve ser uma lista')
  const composicao = new Map(avaliacao.questoes.map((item) => [item.questao_id, item]))
  const vistas = new Set<string>()
  const corrigidas = respostas.map((item) => {
    const entrada = chavesExatas(item, ['questaoId', 'resposta'], 'resposta')
    const questaoId = entrada.questaoId
    const itemComposicao = typeof questaoId === 'string' ? composicao.get(questaoId) : undefined
    if (!itemComposicao || vistas.has(itemComposicao.questao_id)) {
      throw erroValidacao('questao fora da avaliacao ou repetida')
    }
    vistas.add(itemComposicao.questao_id)
    const questao: QuestaoComCadeia = itemComposicao.questao
    const { resposta, acerto } = corrigirResposta(questao, entrada.resposta)
    const pontos =
      questao.tipo === 'dissertativa' ? null : acerto ? itemComposicao.peso : new Decimal(0)
    return { questaoId: questao.id, resposta, acerto, pontos }
  })

  // F-3: questões omitidas valem 0 e não aguardam correção
  const pendente = corrigidas.some((resposta) => resposta.pontos === null)
  const nota = pendente
    ? null
    : calcularNota(
        avaliacao.questoes.map((item) => item.peso),
        corrigidas.map((resposta) => resposta.pontos!)
      )
  const tentativaId = randomUUID()
  const xp = await prisma.$transaction(async (tx) => {
    await tx.tentativaAvaliacao.create({
      data: {
        id: tentativaId,
        avaliacao_id: avaliacao.id,
        usuario_id: usuario.id,
        status: pendente ? 'aguardando_correcao' : 'corrigida',
        nota,
        enviada_em: agora,
      },
    })
    await tx.respostaAvaliacao.createMany({
      data: corrigidas.map((resposta) => ({
        id: randomUUID(),
        tentativa_id: tentativaId,
        questao_id: resposta.questaoId,
        resposta: resposta.resposta,
        acerto: resposta.acerto,
        pontos: resposta.pontos,
      })),
    })
    // R-X4/R-X5/R-X8 (D7): entrega (só a primeira paga) + melhoria da nota, se já corrigida.
    // R-X6: respostas de avaliação não pagam XP por acerto.
    return concederXp(tx, usuario.id, avaliacao.curso_id, async (valores) => {
      const eventos: EventoNovo[] = [
        {
          origem: 'entrega_avaliacao',
          referenciaId: avaliacao.id,
          chave: `entrega:${avaliacao.id}`,
          xp: valores.xp_entrega_avaliacao,
        },
      ]
      if (nota) {
        const anterior = await maiorNotaRemunerada(tx, usuario.id, avaliacao.id)
        const evento = eventoDeNota(avaliacao.id, nota, anterior, valores.xp_por_ponto_nota)
        if (evento) eventos.push(evento)
      }
      return eventos
    })
  })
  // R-A11: só status e nota — nem gabarito nem acerto por questão
  return {
    tentativaId,
    status: pendente ? 'aguardando_correcao' : 'corrigida',
    nota: nota?.toNumber() ?? null,
    xp,
  }
}

// F3-13 — R-A10: resultado = maior nota entre as tentativas corrigidas
export async function resultadoDoEstudante(usuario: UsuarioSessao, id: unknown) {
  const avaliacao = await avaliacaoVisivelPara(id, usuario)
  const tentativas = await prisma.tentativaAvaliacao.findMany({
    where: { avaliacao_id: avaliacao.id, usuario_id: usuario.id },
    orderBy: [{ enviada_em: 'asc' }, { id: 'asc' }],
  })
  const notas = tentativas.flatMap((tentativa) =>
    tentativa.status === 'corrigida' && tentativa.nota ? [tentativa.nota.toNumber()] : []
  )
  return {
    tentativas: tentativas.map((tentativa) => ({
      id: tentativa.id,
      enviadaEm: tentativa.enviada_em.toISOString(),
      status: tentativa.status,
      nota: tentativa.nota?.toNumber() ?? null,
    })),
    tentativasRestantes: Math.max(0, avaliacao.tentativas_max - tentativas.length),
    resultado: notas.length > 0 ? Math.max(...notas) : null,
  }
}

const incluirRespostas = {
  respostas: { orderBy: { criado_em: 'asc' } },
} satisfies Prisma.TentativaAvaliacaoInclude

type TentativaComRespostas = Prisma.TentativaAvaliacaoGetPayload<{ include: typeof incluirRespostas }>

function montarTentativa(tentativa: TentativaComRespostas): TentativaLida {
  return {
    id: tentativa.id,
    usuarioId: tentativa.usuario_id,
    enviadaEm: tentativa.enviada_em.toISOString(),
    status: tentativa.status,
    nota: tentativa.nota?.toNumber() ?? null,
    respostas: tentativa.respostas.map((resposta) => ({
      questaoId: resposta.questao_id,
      resposta: resposta.resposta,
      acerto: resposta.acerto,
      pontos: resposta.pontos?.toNumber() ?? null,
    })),
  }
}

// F3-14
export async function listarTentativas(usuario: UsuarioSessao, id: unknown): Promise<TentativaLida[]> {
  const avaliacao = await avaliacaoParaAlteracao(id, usuario)
  const tentativas = await prisma.tentativaAvaliacao.findMany({
    where: { avaliacao_id: avaliacao.id },
    include: incluirRespostas,
    orderBy: [{ enviada_em: 'asc' }, { id: 'asc' }],
  })
  return tentativas.map(montarTentativa)
}

// F3-15 — DP-09: correção manual de dissertativa pelo dono/admin; recorreção recalcula (D5-h)
export async function corrigirDissertativa(
  usuario: UsuarioSessao,
  tentativaId: unknown,
  questaoId: unknown,
  corpo: unknown
): Promise<TentativaLida> {
  const tentativa =
    typeof tentativaId === 'string' && uuidValido.test(tentativaId)
      ? await prisma.tentativaAvaliacao.findUnique({
          where: { id: tentativaId },
          include: {
            ...incluirRespostas,
            avaliacao: {
              include: {
                curso: { select: { dono_id: true } },
                questoes: { include: { questao: { select: { tipo: true } } } },
              },
            },
          },
        })
      : null
  if (!tentativa) throw erroNaoEncontrado('tentativa nao encontrada')
  exigirAutoria(tentativa.avaliacao.curso.dono_id, usuario)

  const { pontos } = chavesExatas(corpo, ['pontos'], 'corpo da correcao')
  const resposta = tentativa.respostas.find((item) => item.questao_id === questaoId)
  const itemComposicao = tentativa.avaliacao.questoes.find((item) => item.questao_id === questaoId)
  if (!resposta || !itemComposicao || itemComposicao.questao.tipo !== 'dissertativa') {
    throw erroValidacao('a questao nao e dissertativa respondida nesta tentativa')
  }
  if (
    typeof pontos !== 'number' ||
    !Number.isFinite(pontos) ||
    pontos < 0 ||
    !duasCasas(pontos) ||
    new Decimal(pontos).greaterThan(itemComposicao.peso)
  ) {
    throw erroValidacao('pontos devem estar entre 0 e o peso da questao, com no maximo 2 casas')
  }

  const pontosPorQuestao = new Map(
    tentativa.respostas.map((item) => [item.questao_id, item.pontos] as const)
  )
  pontosPorQuestao.set(resposta.questao_id, new Decimal(pontos))
  const pendente = [...pontosPorQuestao.values()].some((valor) => valor === null)
  const nota = pendente
    ? null
    : calcularNota(
        tentativa.avaliacao.questoes.map((item) => item.peso),
        [...pontosPorQuestao.values()] as Prisma.Decimal[]
      )
  await prisma.$transaction(async (tx) => {
    await tx.respostaAvaliacao.update({
      where: { id: resposta.id },
      data: { pontos: new Decimal(pontos) },
    })
    await tx.tentativaAvaliacao.update({
      where: { id: tentativa.id },
      data: { status: pendente ? 'aguardando_correcao' : 'corrigida', nota },
    })
    // R-X5/R-X9/R-X21 (D7): ao ficar corrigida, o dono da tentativa recebe a melhoria da nota;
    // recorreção que baixa a nota não retira XP. A resposta de F3-15 não muda (§6.3).
    if (nota) {
      const estudanteId = tentativa.usuario_id
      const avaliacaoId = tentativa.avaliacao_id
      await concederXp(tx, estudanteId, tentativa.avaliacao.curso_id, async (valores) => {
        const anterior = await maiorNotaRemunerada(tx, estudanteId, avaliacaoId)
        const evento = eventoDeNota(avaliacaoId, nota, anterior, valores.xp_por_ponto_nota)
        return evento ? [evento] : []
      })
    }
  })
  const atualizada = await prisma.tentativaAvaliacao.findUnique({
    where: { id: tentativa.id },
    include: incluirRespostas,
  })
  return montarTentativa(atualizada!)
}
