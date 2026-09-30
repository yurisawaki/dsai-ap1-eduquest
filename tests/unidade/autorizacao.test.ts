import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it } from 'vitest'
import { Erro } from '../../src/server/erros'
import { exigirPapel, exigirSessao } from '../../src/server/middlewares/sessao'
import { prisma } from '../../src/server/prisma'

type Middleware = (req: Request, res: Response, next: NextFunction) => void

function executar(middleware: Middleware, usuario?: { id: string; papel: string }) {
  const sessao = usuario
    ? { id: randomUUID(), usuario_id: usuario.id, expira_em: new Date(Date.now() + 60_000) }
    : undefined
  const req = { usuario, sessao } as Request
  const res = {} as Response
  const erros: unknown[] = []
  let passou = false
  middleware(req, res, ((erro?: unknown) => {
    if (erro) erros.push(erro)
    else passou = true
  }) as NextFunction)
  return { passou, erros }
}

const usuarioDe = (papel: string) => ({ id: randomUUID(), papel })

describe('T1.4 — papéis e controle de acesso (R-04/R-10/AC-10)', () => {
  it('exigirSessao: 401 sem sessão e next() com sessão', () => {
    const semSessao = executar(exigirSessao)
    expect(semSessao.passou).toBe(false)
    expect((semSessao.erros[0] as Erro).status).toBe(401)

    const comSessao = executar(exigirSessao, usuarioDe('estudante'))
    expect(comSessao.passou).toBe(true)
    expect(comSessao.erros).toHaveLength(0)
  })

  it('exigirPapel: next() para papel permitido, 403 para papel não permitido, 401 sem sessão', () => {
    const permitido = executar(exigirPapel('professor'), usuarioDe('professor'))
    expect(permitido.passou).toBe(true)

    const negado = executar(exigirPapel('professor'), usuarioDe('estudante'))
    expect(negado.passou).toBe(false)
    expect((negado.erros[0] as Erro).status).toBe(403)
    expect((negado.erros[0] as Erro).codigo).toBe('proibido')

    const semSessao = executar(exigirPapel('professor'))
    expect(semSessao.passou).toBe(false)
    expect((semSessao.erros[0] as Erro).status).toBe(401)
  })

  it('o ENUM de papel no banco rejeita valores fora dos três fixos (R-10)', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO usuario (id, email, papel, criado_em, atualizado_em) VALUES ('${randomUUID()}', 'enum-teste@exemplo.test', 'super', now(), now())`
      )
    ).rejects.toThrow()
  })

  it('as contas existentes têm sempre um dos três papéis fixos', async () => {
    const foraDoConjunto = await prisma.$queryRawUnsafe<
      { papel: string }[]
    >(`SELECT DISTINCT papel FROM usuario WHERE papel NOT IN ('estudante', 'professor', 'administrador')`)
    expect(foraDoConjunto).toHaveLength(0)
  })
})
