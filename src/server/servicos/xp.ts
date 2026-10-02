import { randomUUID } from 'node:crypto'
import { Prisma, type OrigemXp } from '@prisma/client'

// SPEC/2026-10-02-xp-niveis.md (D7, DP-07) — concessão de XP por ações verificadas (T5.2)

type Tx = Prisma.TransactionClient

// U-1–U-3: padrões, usados se a linha global não existir
const PADRAO = {
  xp_conclusao_aula: 10,
  xp_acerto_questao: 5,
  xp_entrega_avaliacao: 20,
  xp_por_ponto_nota: 3,
} as const

type Parametro = keyof typeof PADRAO
export type ValoresXp = Record<Parametro, number>

export interface XpDaAcao {
  ganho: number
  total: number
  nivel: number
  subiuNivel: boolean
}

export interface EventoNovo {
  origem: OrigemXp
  referenciaId: string
  chave: string
  xp: number
  notaReferencia?: Prisma.Decimal
}

// R-X16: L(n) = 50·n·(n−1); nivelDe(xp) = maior n com L(n) ≤ xp, em aritmética inteira
export function xpParaNivel(nivel: number): number {
  return 50 * nivel * (nivel - 1)
}

export function nivelDe(xp: number): number {
  if (xp < 100) return 1
  let nivel = Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2))
  while (xpParaNivel(nivel + 1) <= xp) nivel++
  while (xpParaNivel(nivel) > xp) nivel--
  return nivel
}

// R-X13: efetivo = min(ajuste do curso, 2 × global atual); sem ajuste, o global
export async function valoresEfetivos(tx: Tx, cursoId: string): Promise<ValoresXp> {
  const [global, curso] = await Promise.all([
    tx.configXpGlobal.findFirst(),
    tx.configXpCurso.findUnique({ where: { curso_id: cursoId } }),
  ])
  const valores = { ...PADRAO } as ValoresXp
  for (const parametro of Object.keys(PADRAO) as Parametro[]) {
    const base = global?.[parametro] ?? PADRAO[parametro]
    const ajuste = curso?.[parametro]
    valores[parametro] = ajuste === null || ajuste === undefined ? base : Math.min(ajuste, 2 * base)
  }
  return valores
}

// R-X5: maior nota já remunerada da avaliação (0 se nenhuma)
export async function maiorNotaRemunerada(
  tx: Tx,
  usuarioId: string,
  avaliacaoId: string
): Promise<Prisma.Decimal> {
  const agregado = await tx.eventoXp.aggregate({
    where: { usuario_id: usuarioId, origem: 'nota_avaliacao', referencia_id: avaliacaoId },
    _max: { nota_referencia: true },
  })
  return agregado._max.nota_referencia ?? new Prisma.Decimal(0)
}

function arredondar(valor: Prisma.Decimal): number {
  return valor.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber()
}

// R-X5: round(k × N) − round(k × M) quando N > M; a chave leva N em centésimos
export function eventoDeNota(
  avaliacaoId: string,
  nota: Prisma.Decimal,
  maiorAnterior: Prisma.Decimal,
  k: number
): EventoNovo | null {
  if (!nota.greaterThan(maiorAnterior)) return null
  return {
    origem: 'nota_avaliacao',
    referenciaId: avaliacaoId,
    chave: `nota:${avaliacaoId}:${nota.times(100).toFixed(0)}`,
    xp: arredondar(nota.times(k)) - arredondar(maiorAnterior.times(k)),
    notaReferencia: nota,
  }
}

// Trava (e cria, se preciso) o saldo do usuário: serializa concessões concorrentes do mesmo estudante
async function travarSaldo(tx: Tx, usuarioId: string) {
  const [saldo] = await tx.$queryRaw<{ xp_total: number; nivel: number }[]>`
    INSERT INTO "saldo_xp" ("usuario_id", "atualizado_em")
    VALUES (${usuarioId}::uuid, CURRENT_TIMESTAMP)
    ON CONFLICT ("usuario_id") DO UPDATE SET "xp_total" = "saldo_xp"."xp_total"
    RETURNING "xp_total", "nivel"`
  return saldo
}

/**
 * R-X7/R-X8: grava os eventos (idempotentes pela chave única) e o saldo, dentro da
 * transação da ação. `calcular` roda com o saldo já travado, para que leituras como
 * a maior nota remunerada não corram com outra concessão do mesmo estudante.
 */
export async function concederXp(
  tx: Tx,
  usuarioId: string,
  cursoId: string,
  calcular: (valores: ValoresXp) => Promise<EventoNovo[]> | EventoNovo[]
): Promise<XpDaAcao> {
  const anterior = await travarSaldo(tx, usuarioId)
  const eventos = await calcular(await valoresEfetivos(tx, cursoId))
  const agora = new Date()
  let ganho = 0
  for (const evento of eventos) {
    // eventos de valor 0 também são gravados (D7-a): a ação não paga depois se a configuração subir
    const criado = await tx.eventoXp.createMany({
      data: [
        {
          id: randomUUID(),
          usuario_id: usuarioId,
          origem: evento.origem,
          referencia_id: evento.referenciaId,
          curso_id: cursoId,
          chave: evento.chave,
          xp: evento.xp,
          nota_referencia: evento.notaReferencia ?? null,
          concedido_em: agora,
        },
      ],
      skipDuplicates: true,
    })
    if (criado.count > 0) ganho += evento.xp
  }
  const total = anterior.xp_total + ganho
  // R-X17: nível = máximo entre o gravado e o derivado do XP total
  const nivel = Math.max(anterior.nivel, nivelDe(total))
  if (ganho > 0 || nivel !== anterior.nivel) {
    await tx.saldoXp.update({
      where: { usuario_id: usuarioId },
      data: { xp_total: { increment: ganho }, nivel },
    })
  }
  return { ganho, total, nivel, subiuNivel: nivel > anterior.nivel }
}
