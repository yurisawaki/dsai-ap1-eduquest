import { randomUUID } from 'node:crypto'
import type { Prisma, PrismaClient, TipoCriterio } from '@prisma/client'
import { prisma } from '../prisma'
import { nivelDe } from './xp'

// SPEC/2026-10-02-conquistas.md (D8, DP-18 parcela D8) — desbloqueio de conquistas (T5.6)

type Db = Prisma.TransactionClient | PrismaClient

export interface ConquistaDesbloqueada {
  codigo: string
  nome: string
}

export interface ConquistaDoCatalogo {
  codigo: string
  nome: string
  descricao: string
  meta: number
  progresso: number
  desbloqueada: boolean
  desbloqueadaEm: string | null
}

export interface ConquistaDoPerfil {
  codigo: string
  nome: string
  desbloqueadaEm: string
}

type Progresso = Record<TipoCriterio, number>

// §4.2 (U-3/U-4): progresso sobre o estado verificado atual do estudante
async function cursosConcluidos(db: Db, usuarioId: string): Promise<number> {
  // D6 R-D6-3/R-D6-4: curso concluído = 100% das aulas visíveis (curso, módulo e aula publicados)
  const [linha] = await db.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*) AS total FROM (
      SELECT c."id"
      FROM "curso" c
      JOIN "modulo" m ON m."curso_id" = c."id" AND m."publicado"
      JOIN "aula" a ON a."modulo_id" = m."id" AND a."publicado"
      LEFT JOIN "conclusao_aula" ca ON ca."aula_id" = a."id" AND ca."usuario_id" = ${usuarioId}::uuid
      WHERE c."publicado"
      GROUP BY c."id"
      HAVING COUNT(ca."id") = COUNT(a."id")
    ) concluidos`
  return Number(linha?.total ?? 0)
}

async function contarDistintos(db: Db, usuarioId: string, tabela: 'acertos' | 'entregas'): Promise<number> {
  const [linha] =
    tabela === 'acertos'
      ? // D8-d: só exercício (D4), cada questão uma vez
        await db.$queryRaw<{ total: bigint }[]>`
          SELECT COUNT(DISTINCT "questao_id") AS total FROM "tentativa"
          WHERE "usuario_id" = ${usuarioId}::uuid AND "acerto" = true`
      : await db.$queryRaw<{ total: bigint }[]>`
          SELECT COUNT(DISTINCT "avaliacao_id") AS total FROM "tentativa_avaliacao"
          WHERE "usuario_id" = ${usuarioId}::uuid`
  return Number(linha?.total ?? 0)
}

async function calcularProgresso(db: Db, usuarioId: string, tipos: Set<TipoCriterio>): Promise<Partial<Progresso>> {
  const progresso: Partial<Progresso> = {}
  if (tipos.has('aulas_concluidas')) {
    // D8-d: toda conclusão registrada conta, mesmo de aula depois despublicada
    progresso.aulas_concluidas = await db.conclusaoAula.count({ where: { usuario_id: usuarioId } })
  }
  if (tipos.has('cursos_concluidos')) progresso.cursos_concluidos = await cursosConcluidos(db, usuarioId)
  if (tipos.has('questoes_acertadas')) progresso.questoes_acertadas = await contarDistintos(db, usuarioId, 'acertos')
  if (tipos.has('avaliacoes_entregues')) {
    progresso.avaliacoes_entregues = await contarDistintos(db, usuarioId, 'entregas')
  }
  if (tipos.has('nota_avaliacao')) {
    const maior = await db.tentativaAvaliacao.aggregate({
      where: { usuario_id: usuarioId, status: 'corrigida' },
      _max: { nota: true },
    })
    progresso.nota_avaliacao = Math.floor(maior._max.nota?.toNumber() ?? 0)
  }
  if (tipos.has('nivel')) {
    const saldo = await db.saldoXp.findUnique({ where: { usuario_id: usuarioId } })
    progresso.nivel = Math.max(saldo?.nivel ?? 1, nivelDe(saldo?.xp_total ?? 0))
  }
  return progresso
}

/**
 * R-C1–R-C5: chamada dentro da transação da ação, depois da concessão de XP (o saldo do
 * estudante já está travado por D7). Avalia todo o catálogo ainda não desbloqueado (D8-b) e
 * devolve só o que esta chamada gravou, na ordem do catálogo. Nunca concede recompensa (U-5).
 */
export async function avaliarConquistas(
  tx: Prisma.TransactionClient,
  usuarioId: string
): Promise<ConquistaDesbloqueada[]> {
  const [catalogo, desbloqueios] = await Promise.all([
    tx.conquista.findMany({ orderBy: { ordem: 'asc' } }),
    tx.desbloqueioConquista.findMany({ where: { usuario_id: usuarioId }, select: { conquista_id: true } }),
  ])
  const ja = new Set(desbloqueios.map((desbloqueio) => desbloqueio.conquista_id))
  const pendentes = catalogo.filter((conquista) => !ja.has(conquista.id))
  if (pendentes.length === 0) return []

  const progresso = await calcularProgresso(
    tx,
    usuarioId,
    new Set(pendentes.map((conquista) => conquista.tipo_criterio))
  )
  const agora = new Date()
  const novas: ConquistaDesbloqueada[] = []
  for (const conquista of pendentes) {
    if ((progresso[conquista.tipo_criterio] ?? 0) < conquista.meta) continue
    // R-C4: UNIQUE (usuario_id, conquista_id) — conflito é ignorado, nunca duplica
    const criado = await tx.desbloqueioConquista.createMany({
      data: [{ id: randomUUID(), usuario_id: usuarioId, conquista_id: conquista.id, desbloqueada_em: agora }],
      skipDuplicates: true,
    })
    if (criado.count > 0) novas.push({ codigo: conquista.codigo, nome: conquista.nome })
  }
  return novas
}

// F5-06 — R-C8/R-C10: leitura não desbloqueia; progresso limitado à meta
export async function catalogoDoEstudante(usuarioId: string): Promise<ConquistaDoCatalogo[]> {
  const [catalogo, desbloqueios] = await Promise.all([
    prisma.conquista.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.desbloqueioConquista.findMany({ where: { usuario_id: usuarioId } }),
  ])
  const porConquista = new Map(desbloqueios.map((desbloqueio) => [desbloqueio.conquista_id, desbloqueio]))
  const progresso = await calcularProgresso(
    prisma,
    usuarioId,
    new Set(catalogo.map((conquista) => conquista.tipo_criterio))
  )
  return catalogo.map((conquista) => {
    const desbloqueio = porConquista.get(conquista.id)
    return {
      codigo: conquista.codigo,
      nome: conquista.nome,
      descricao: conquista.descricao,
      meta: conquista.meta,
      // R-C6: desbloqueada continua completa mesmo se o estado atual cair
      progresso: desbloqueio ? conquista.meta : Math.min(progresso[conquista.tipo_criterio] ?? 0, conquista.meta),
      desbloqueada: Boolean(desbloqueio),
      desbloqueadaEm: desbloqueio?.desbloqueada_em.toISOString() ?? null,
    }
  })
}

// R-C9 (D8-g): perfil lista só as desbloqueadas, por data e código
export async function conquistasDoPerfil(usuarioId: string): Promise<ConquistaDoPerfil[]> {
  const desbloqueios = await prisma.desbloqueioConquista.findMany({
    where: { usuario_id: usuarioId },
    include: { conquista: { select: { codigo: true, nome: true } } },
  })
  return desbloqueios
    .map((desbloqueio) => ({
      codigo: desbloqueio.conquista.codigo,
      nome: desbloqueio.conquista.nome,
      desbloqueadaEm: desbloqueio.desbloqueada_em.toISOString(),
    }))
    .sort((a, b) => a.desbloqueadaEm.localeCompare(b.desbloqueadaEm) || a.codigo.localeCompare(b.codigo))
}
