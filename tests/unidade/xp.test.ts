import { describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'
import { eventoDeNota, nivelDe, xpParaNivel } from '../../src/server/servicos/xp'

// SPEC/2026-10-02-xp-niveis.md (D7) — R-X5 e R-X16

describe('D7 — curva de níveis (R-X16)', () => {
  it('TX-10: L(n) = 50·n·(n−1) e nivelDe nas fronteiras', () => {
    expect([1, 2, 3, 4, 5, 10].map(xpParaNivel)).toEqual([0, 100, 300, 600, 1000, 4500])
    const casos: [number, number][] = [
      [0, 1], [99, 1], [100, 2], [299, 2], [300, 3], [999, 4], [1000, 5], [4500, 10], [4499, 9],
    ]
    for (const [xp, nivel] of casos) expect(nivelDe(xp)).toBe(nivel)
  })

  it('TX-10: valores grandes respeitam L(n) ≤ xp < L(n+1)', () => {
    for (const xp of [1e9, 1e9 - 1, 2_147_483_647, xpParaNivel(4473), xpParaNivel(4473) - 1]) {
      const nivel = nivelDe(xp)
      expect(xpParaNivel(nivel)).toBeLessThanOrEqual(xp)
      expect(xpParaNivel(nivel + 1)).toBeGreaterThan(xp)
    }
  })
})

describe('D7 — XP de nota (R-X5)', () => {
  const d = (valor: string) => new Prisma.Decimal(valor)

  it('paga round(k·N) − round(k·M) só quando N > M', () => {
    expect(eventoDeNota('a', d('6'), d('0'), 3)?.xp).toBe(18)
    expect(eventoDeNota('a', d('8'), d('6'), 3)?.xp).toBe(6)
    expect(eventoDeNota('a', d('7'), d('8'), 3)).toBeNull()
    expect(eventoDeNota('a', d('8'), d('8'), 3)).toBeNull()
    expect(eventoDeNota('a', d('0'), d('0'), 3)).toBeNull()
  })

  it('arredonda meio para cima e soma exatamente round(k × maior nota)', () => {
    // 3 × 3,50 = 10,5 → 11; 3 × 3,83 = 11,49 → 11; 3 × 10 = 30
    const primeira = eventoDeNota('a', d('3.5'), d('0'), 3)!
    const segunda = eventoDeNota('a', d('3.83'), d('3.5'), 3)!
    const terceira = eventoDeNota('a', d('10'), d('3.83'), 3)!
    expect([primeira.xp, segunda.xp, terceira.xp]).toEqual([11, 0, 19])
    expect(primeira.xp + segunda.xp + terceira.xp).toBe(30)
    expect(segunda.chave).toBe('nota:a:383')
  })
})
