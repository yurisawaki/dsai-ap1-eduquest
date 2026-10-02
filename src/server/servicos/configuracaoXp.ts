import { erroNaoEncontrado, erroValidacao } from '../erros'
import { prisma } from '../prisma'
import { uuidValido } from '../tipos'
import { ehDonoOuAdmin, exigirAutoria, type UsuarioSessao } from './catalogo'
import { PADRAO_XP, valoresEfetivos, type ParametroXp, type ValoresXp } from './xp'

// SPEC/2026-10-02-xp-niveis.md §4.2 e §6.2 — configuração de XP por escopo (T5.4)

// D7-c: faixa global por parâmetro
const MAXIMO_GLOBAL = 1_000

// nomes do contrato (camelCase) ↔ colunas
const CAMPOS: Record<string, ParametroXp> = {
  xpConclusaoAula: 'xp_conclusao_aula',
  xpAcertoQuestao: 'xp_acerto_questao',
  xpEntregaAvaliacao: 'xp_entrega_avaliacao',
  xpPorPontoNota: 'xp_por_ponto_nota',
}

type ConfigGlobal = Record<keyof typeof CAMPOS, number>
type ConfigCurso = Record<keyof typeof CAMPOS, { global: number; curso: number | null; efetivo: number }>

function objeto(corpo: unknown): Record<string, unknown> {
  if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw erroValidacao('corpo da requisicao invalido')
  }
  return corpo as Record<string, unknown>
}

function inteiroEntre(valor: unknown, maximo: number, campo: string): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0 || valor > maximo) {
    throw erroValidacao(`${campo} deve ser inteiro entre 0 e ${maximo}`)
  }
  return valor
}

async function valoresGlobais(): Promise<ValoresXp> {
  const linha = await prisma.configXpGlobal.findFirst()
  const valores = { ...PADRAO_XP } as ValoresXp
  for (const coluna of Object.values(CAMPOS)) valores[coluna] = linha?.[coluna] ?? PADRAO_XP[coluna]
  return valores
}

function paraContrato(valores: ValoresXp): ConfigGlobal {
  return Object.fromEntries(
    Object.entries(CAMPOS).map(([campo, coluna]) => [campo, valores[coluna]])
  ) as ConfigGlobal
}

// F5-02 — R-X11: só administrador (papel checado na rota)
export async function lerConfigGlobal(): Promise<ConfigGlobal> {
  return paraContrato(await valoresGlobais())
}

// F5-03 — R-X10/R-X11/R-X14: substitui os 4 valores; não toca em eventos já gravados
export async function substituirConfigGlobal(corpo: unknown): Promise<ConfigGlobal> {
  const entrada = objeto(corpo)
  const chaves = Object.keys(entrada)
  if (chaves.length !== 4 || !Object.keys(CAMPOS).every((campo) => campo in entrada)) {
    throw erroValidacao('informe exatamente xpConclusaoAula, xpAcertoQuestao, xpEntregaAvaliacao e xpPorPontoNota')
  }
  const dados = Object.fromEntries(
    Object.entries(CAMPOS).map(([campo, coluna]) => [coluna, inteiroEntre(entrada[campo], MAXIMO_GLOBAL, campo)])
  ) as ValoresXp
  const existente = await prisma.configXpGlobal.findFirst({ select: { id: true } })
  if (existente) {
    await prisma.configXpGlobal.update({ where: { id: existente.id }, data: dados })
  } else {
    await prisma.configXpGlobal.create({ data: { id: '00000000-0000-4000-8000-000000000007', ...dados } })
  }
  return lerConfigGlobal()
}

// §6.2/EX-02/EX-03: 401 → 404 → 403. Curso inexistente ou não visível (não publicado e sem
// titularidade) → 404; curso visível a quem não é dono nem administrador → 403.
async function cursoParaConfiguracao(id: unknown, usuario: UsuarioSessao) {
  const curso =
    typeof id === 'string' && uuidValido.test(id)
      ? await prisma.curso.findUnique({ where: { id }, select: { id: true, dono_id: true, publicado: true } })
      : null
  if (!curso || (!curso.publicado && !ehDonoOuAdmin(curso.dono_id, usuario))) {
    throw erroNaoEncontrado('curso nao encontrado')
  }
  exigirAutoria(curso.dono_id, usuario)
  return curso
}

async function montarConfigCurso(cursoId: string): Promise<ConfigCurso> {
  const [globais, ajuste, efetivos] = await Promise.all([
    valoresGlobais(),
    prisma.configXpCurso.findUnique({ where: { curso_id: cursoId } }),
    valoresEfetivos(prisma, cursoId),
  ])
  return Object.fromEntries(
    Object.entries(CAMPOS).map(([campo, coluna]) => [
      campo,
      { global: globais[coluna], curso: ajuste?.[coluna] ?? null, efetivo: efetivos[coluna] },
    ])
  ) as ConfigCurso
}

// F5-04 — R-X12/R-X13: dono do curso ou administrador
export async function lerConfigCurso(usuario: UsuarioSessao, id: unknown): Promise<ConfigCurso> {
  const curso = await cursoParaConfiguracao(id, usuario)
  return montarConfigCurso(curso.id)
}

// F5-05 — R-X12: cada chave opcional; inteiro entre 0 e 2× o global atual, ou null (volta ao global)
export async function ajustarConfigCurso(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<ConfigCurso> {
  const curso = await cursoParaConfiguracao(id, usuario)
  const entrada = objeto(corpo)
  const extras = Object.keys(entrada).filter((chave) => !(chave in CAMPOS))
  if (extras.length > 0) throw erroValidacao(`campos nao permitidos: ${extras.join(', ')}`)
  const globais = await valoresGlobais()
  const dados: Partial<Record<ParametroXp, number | null>> = {}
  for (const [campo, valor] of Object.entries(entrada)) {
    const coluna = CAMPOS[campo]
    dados[coluna] = valor === null ? null : inteiroEntre(valor, 2 * globais[coluna], campo)
  }
  await prisma.configXpCurso.upsert({
    where: { curso_id: curso.id },
    create: { curso_id: curso.id, ...dados },
    update: dados,
  })
  return montarConfigCurso(curso.id)
}
