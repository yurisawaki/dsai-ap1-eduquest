import { randomUUID } from 'node:crypto'
import { Prisma, type TipoQuestao } from '@prisma/client'
import { erroNaoEncontrado, erroValidacao } from '../erros'
import { prisma } from '../prisma'
import { uuidValido } from '../tipos'
import { ehDonoOuAdmin, exigirAutoria, type UsuarioSessao } from './catalogo'

// SPEC/2026-10-01-questoes-exercicios.md (D4, DP-08)
const TIPOS_QUESTAO: readonly TipoQuestao[] = [
  'multipla_escolha',
  'verdadeiro_falso',
  'numerica',
  'dissertativa',
]

// R-Q12: limites revisáveis pela SPEC de NFRs (P-26)
const MAXIMO_CARACTERES_TEXTO = 20_000
const MAXIMO_CARACTERES_ALTERNATIVA = 1_000
const MINIMO_ALTERNATIVAS = 2
const MAXIMO_ALTERNATIVAS = 10

type Gabarito = { valor: boolean } | { valor: number; tolerancia: number }

interface AlternativaEntrada {
  texto: string
  correta: boolean
}

export interface AlternativaLida {
  id: string
  texto: string
  posicao: number
  correta?: boolean
}

export interface QuestaoLida {
  id: string
  moduloId: string
  tipo: TipoQuestao
  enunciado: string
  publicado: boolean
  explicacao?: string | null
  alternativas?: AlternativaLida[]
  gabarito?: unknown
}

export interface ResultadoTentativa {
  tentativaId: string
  acerto: boolean | null
  feedback: { explicacao: string | null }
}

function pontosDeCodigo(valor: string): number {
  return Array.from(valor).length
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

function textoLimitado(valor: unknown, maximo: number, rotulo: string): string {
  if (typeof valor !== 'string' || valor.trim().length === 0 || pontosDeCodigo(valor) > maximo) {
    throw erroValidacao(`${rotulo} invalido`)
  }
  return valor
}

function explicacaoValida(valor: unknown): string | null {
  if (valor === null) return null
  return textoLimitado(valor, MAXIMO_CARACTERES_TEXTO, 'explicacao')
}

function numeroFinito(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor)
}

function alternativasValidas(valor: unknown): AlternativaEntrada[] {
  if (
    !Array.isArray(valor) ||
    valor.length < MINIMO_ALTERNATIVAS ||
    valor.length > MAXIMO_ALTERNATIVAS
  ) {
    throw erroValidacao(`informe de ${MINIMO_ALTERNATIVAS} a ${MAXIMO_ALTERNATIVAS} alternativas`)
  }
  const alternativas = valor.map((item) => {
    const alternativa = chavesExatas(item, ['texto', 'correta'], 'alternativa')
    if (typeof alternativa.correta !== 'boolean') {
      throw erroValidacao('alternativa.correta deve ser booleano')
    }
    return {
      texto: textoLimitado(alternativa.texto, MAXIMO_CARACTERES_ALTERNATIVA, 'texto da alternativa'),
      correta: alternativa.correta,
    }
  })
  if (!alternativas.some((alternativa) => alternativa.correta)) {
    throw erroValidacao('ao menos uma alternativa deve ser correta')
  }
  return alternativas
}

// R-Q7: gabarito de V/F e numérica; múltipla escolha e dissertativa não têm gabarito em JSON
function gabaritoValido(tipo: TipoQuestao, valor: unknown): Gabarito {
  if (tipo === 'verdadeiro_falso') {
    const gabarito = chavesExatas(valor, ['valor'], 'gabarito')
    if (typeof gabarito.valor !== 'boolean') throw erroValidacao('gabarito.valor deve ser booleano')
    return { valor: gabarito.valor }
  }
  const gabarito = chavesExatas(valor, ['valor', 'tolerancia'], 'gabarito')
  if (!numeroFinito(gabarito.valor) || !numeroFinito(gabarito.tolerancia) || gabarito.tolerancia < 0) {
    throw erroValidacao('gabarito numerico invalido')
  }
  return { valor: gabarito.valor, tolerancia: gabarito.tolerancia }
}

function exigeGabarito(tipo: TipoQuestao): boolean {
  return tipo === 'verdadeiro_falso' || tipo === 'numerica'
}

function camposPermitidos(corpo: Record<string, unknown>, permitidos: readonly string[]) {
  for (const chave of Object.keys(corpo)) {
    if (!permitidos.includes(chave)) throw erroValidacao(`campo nao permitido: ${chave}`)
  }
}

// R-Q4: leitor comum só vê questão com questão, módulo e curso publicados
interface CadeiaDaQuestao {
  publicado: boolean
  modulo: { publicado: boolean; curso: { dono_id: string; publicado: boolean } }
}

function questaoVisivel(questao: CadeiaDaQuestao, usuario: UsuarioSessao): boolean {
  const cadeiaPublicada =
    questao.publicado && questao.modulo.publicado && questao.modulo.curso.publicado
  return cadeiaPublicada || ehDonoOuAdmin(questao.modulo.curso.dono_id, usuario)
}

const incluirCadeia = {
  alternativas: { orderBy: { posicao: 'asc' } },
  modulo: {
    select: { publicado: true, curso: { select: { dono_id: true, publicado: true } } },
  },
} satisfies Prisma.QuestaoInclude

type QuestaoComCadeia = Prisma.QuestaoGetPayload<{ include: typeof incluirCadeia }>

async function buscarQuestao(id: unknown): Promise<QuestaoComCadeia | null> {
  if (typeof id !== 'string' || !uuidValido.test(id)) return null
  return prisma.questao.findUnique({ where: { id }, include: incluirCadeia })
}

async function questaoParaAlteracao(id: unknown, usuario: UsuarioSessao) {
  const questao = await buscarQuestao(id)
  if (!questao) throw erroNaoEncontrado('questao nao encontrada')
  exigirAutoria(questao.modulo.curso.dono_id, usuario)
  return questao
}

// R-Q5/D4-h: gabarito, `correta` e explicação só para dono/admin
function montarQuestao(questao: QuestaoComCadeia, autor: boolean): QuestaoLida {
  const lida: QuestaoLida = {
    id: questao.id,
    moduloId: questao.modulo_id,
    tipo: questao.tipo,
    enunciado: questao.enunciado,
    publicado: questao.publicado,
  }
  if (questao.tipo === 'multipla_escolha') {
    lida.alternativas = questao.alternativas.map((alternativa) => ({
      id: alternativa.id,
      texto: alternativa.texto,
      posicao: alternativa.posicao,
      ...(autor && { correta: alternativa.correta }),
    }))
  }
  if (autor) {
    lida.explicacao = questao.explicacao
    if (exigeGabarito(questao.tipo)) lida.gabarito = questao.gabarito
  }
  return lida
}

function dadosAlternativas(questaoId: string, alternativas: AlternativaEntrada[]) {
  return alternativas.map((alternativa, posicao) => ({
    id: randomUUID(),
    questao_id: questaoId,
    texto: alternativa.texto,
    correta: alternativa.correta,
    posicao,
  }))
}

// F3-01
export async function criarQuestao(usuario: UsuarioSessao, moduloId: unknown, corpo: unknown) {
  const modulo =
    typeof moduloId === 'string' && uuidValido.test(moduloId)
      ? await prisma.modulo.findUnique({
          where: { id: moduloId },
          include: { curso: { select: { dono_id: true } } },
        })
      : null
  if (!modulo) throw erroNaoEncontrado('modulo nao encontrado')
  exigirAutoria(modulo.curso.dono_id, usuario)

  const entrada = registro(corpo, 'corpo da questao')
  camposPermitidos(entrada, ['tipo', 'enunciado', 'explicacao', 'alternativas', 'gabarito'])
  const tipo = entrada.tipo
  if (typeof tipo !== 'string' || !TIPOS_QUESTAO.includes(tipo as TipoQuestao)) {
    throw erroValidacao('tipo de questao invalido')
  }
  const tipoQuestao = tipo as TipoQuestao
  const enunciado = textoLimitado(entrada.enunciado, MAXIMO_CARACTERES_TEXTO, 'enunciado')
  const explicacao = 'explicacao' in entrada ? explicacaoValida(entrada.explicacao) : null

  const multipla = tipoQuestao === 'multipla_escolha'
  if (multipla !== 'alternativas' in entrada) {
    throw erroValidacao('alternativas sao exclusivas de multipla escolha e obrigatorias nela')
  }
  if (exigeGabarito(tipoQuestao) !== 'gabarito' in entrada) {
    throw erroValidacao('gabarito e exclusivo e obrigatorio em verdadeiro/falso e numerica')
  }
  const alternativas = multipla ? alternativasValidas(entrada.alternativas) : []
  const gabarito = exigeGabarito(tipoQuestao) ? gabaritoValido(tipoQuestao, entrada.gabarito) : null

  const id = randomUUID()
  await prisma.$transaction([
    prisma.questao.create({
      data: {
        id,
        modulo_id: modulo.id,
        tipo: tipoQuestao,
        enunciado,
        explicacao,
        gabarito: gabarito ?? Prisma.DbNull,
        publicado: false,
      },
    }),
    prisma.alternativa.createMany({ data: dadosAlternativas(id, alternativas) }),
  ])
  return { questaoId: id }
}

// F3-02
export async function listarQuestoes(usuario: UsuarioSessao, moduloId: unknown): Promise<QuestaoLida[]> {
  const modulo =
    typeof moduloId === 'string' && uuidValido.test(moduloId)
      ? await prisma.modulo.findUnique({
          where: { id: moduloId },
          include: { curso: { select: { dono_id: true, publicado: true } } },
        })
      : null
  if (!modulo) throw erroNaoEncontrado('modulo nao encontrado')
  const autor = ehDonoOuAdmin(modulo.curso.dono_id, usuario)
  if (!autor && !(modulo.publicado && modulo.curso.publicado)) {
    throw erroNaoEncontrado('modulo nao encontrado')
  }
  const questoes = await prisma.questao.findMany({
    where: { modulo_id: modulo.id, ...(autor ? {} : { publicado: true }) },
    include: incluirCadeia,
    orderBy: [{ criado_em: 'asc' }, { id: 'asc' }],
  })
  return questoes.map((questao) => montarQuestao(questao, autor))
}

// F3-03
export async function lerQuestao(usuario: UsuarioSessao, id: unknown): Promise<QuestaoLida> {
  const questao = await buscarQuestao(id)
  if (!questao || !questaoVisivel(questao, usuario)) {
    throw erroNaoEncontrado('questao nao encontrada')
  }
  return montarQuestao(questao, ehDonoOuAdmin(questao.modulo.curso.dono_id, usuario))
}

// F3-04
export async function editarQuestao(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<QuestaoLida> {
  const questao = await questaoParaAlteracao(id, usuario)
  const entrada = registro(corpo, 'corpo da questao')
  camposPermitidos(entrada, ['enunciado', 'explicacao', 'alternativas', 'gabarito', 'publicado'])
  if (Object.keys(entrada).length === 0) throw erroValidacao('corpo sem alteracoes')

  const dados: Prisma.QuestaoUpdateInput = {}
  if ('enunciado' in entrada) {
    dados.enunciado = textoLimitado(entrada.enunciado, MAXIMO_CARACTERES_TEXTO, 'enunciado')
  }
  if ('explicacao' in entrada) dados.explicacao = explicacaoValida(entrada.explicacao)
  if ('publicado' in entrada) {
    if (typeof entrada.publicado !== 'boolean') throw erroValidacao('publicado invalido')
    dados.publicado = entrada.publicado
  }
  if ('gabarito' in entrada) {
    if (!exigeGabarito(questao.tipo)) throw erroValidacao('gabarito nao se aplica a este tipo')
    dados.gabarito = gabaritoValido(questao.tipo, entrada.gabarito)
  }
  let alternativas: AlternativaEntrada[] | null = null
  if ('alternativas' in entrada) {
    if (questao.tipo !== 'multipla_escolha') {
      throw erroValidacao('alternativas sao exclusivas de multipla escolha')
    }
    alternativas = alternativasValidas(entrada.alternativas)
  }

  // D4-g: tentativas anteriores não são recalculadas
  const operacoes: Prisma.PrismaPromise<unknown>[] = [
    prisma.questao.update({ where: { id: questao.id }, data: dados }),
  ]
  if (alternativas) {
    operacoes.push(
      prisma.alternativa.deleteMany({ where: { questao_id: questao.id } }),
      prisma.alternativa.createMany({ data: dadosAlternativas(questao.id, alternativas) })
    )
  }
  await prisma.$transaction(operacoes)
  const atualizada = await buscarQuestao(questao.id)
  return montarQuestao(atualizada!, true)
}

// F3-05
export async function excluirQuestao(usuario: UsuarioSessao, id: unknown): Promise<void> {
  const questao = await questaoParaAlteracao(id, usuario)
  await prisma.questao.delete({ where: { id: questao.id } })
}

// R-Q7/R-Q8: correção no servidor; `acerto` null só para dissertativa
function corrigir(questao: QuestaoComCadeia, corpo: unknown): { resposta: Prisma.InputJsonValue; acerto: boolean | null } {
  switch (questao.tipo) {
    case 'multipla_escolha': {
      const { alternativas } = chavesExatas(corpo, ['alternativas'], 'resposta')
      if (
        !Array.isArray(alternativas) ||
        alternativas.length === 0 ||
        alternativas.some((item) => typeof item !== 'string') ||
        new Set(alternativas).size !== alternativas.length
      ) {
        throw erroValidacao('resposta deve listar alternativas distintas')
      }
      const escolhidas = alternativas as string[]
      const daQuestao = new Set(questao.alternativas.map((alternativa) => alternativa.id))
      if (!escolhidas.every((alternativaId) => daQuestao.has(alternativaId))) {
        throw erroValidacao('alternativa nao pertence a questao')
      }
      const corretas = questao.alternativas.filter((a) => a.correta).map((a) => a.id)
      const acerto =
        escolhidas.length === corretas.length && corretas.every((alternativaId) => escolhidas.includes(alternativaId))
      return { resposta: { alternativas: escolhidas }, acerto }
    }
    case 'verdadeiro_falso': {
      const { valor } = chavesExatas(corpo, ['valor'], 'resposta')
      if (typeof valor !== 'boolean') throw erroValidacao('resposta.valor deve ser booleano')
      const gabarito = questao.gabarito as { valor: boolean }
      return { resposta: { valor }, acerto: valor === gabarito.valor }
    }
    case 'numerica': {
      const { valor } = chavesExatas(corpo, ['valor'], 'resposta')
      if (!numeroFinito(valor)) throw erroValidacao('resposta.valor deve ser numero')
      const gabarito = questao.gabarito as { valor: number; tolerancia: number }
      return { resposta: { valor }, acerto: Math.abs(valor - gabarito.valor) <= gabarito.tolerancia }
    }
    case 'dissertativa': {
      const { texto } = chavesExatas(corpo, ['texto'], 'resposta')
      return { resposta: { texto: textoLimitado(texto, MAXIMO_CARACTERES_TEXTO, 'texto') }, acerto: null }
    }
  }
}

// F3-06
export async function responderQuestao(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<ResultadoTentativa> {
  const questao = await buscarQuestao(id)
  if (!questao || !questaoVisivel(questao, usuario)) {
    throw erroNaoEncontrado('questao nao encontrada')
  }
  const { resposta, acerto } = corrigir(questao, corpo)
  const tentativa = await prisma.tentativa.create({
    data: { id: randomUUID(), questao_id: questao.id, usuario_id: usuario.id, resposta, acerto },
    select: { id: true },
  })
  // R-Q10/D4-c: feedback com acerto e explicação; o gabarito nunca é devolvido
  return { tentativaId: tentativa.id, acerto, feedback: { explicacao: questao.explicacao } }
}
