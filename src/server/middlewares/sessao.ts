import type { NextFunction, Request, Response } from 'express'
import { nomeCookieSessao } from '../config'
import { Erro, erroNaoAutenticado } from '../erros'
import { prisma } from '../prisma'
import { uuidValido } from '../tipos'

export async function carregarSessao(req: Request, _res: Response, next: NextFunction) {
  try {
    const id = req.cookies?.[nomeCookieSessao]
    if (typeof id === 'string' && uuidValido.test(id)) {
      const sessao = await prisma.sessao.findUnique({
        where: { id },
        include: { usuario: { select: { id: true, papel: true } } },
      })
      if (sessao && sessao.revogada_em === null && sessao.expira_em > new Date()) {
        req.sessao = { id: sessao.id, usuario_id: sessao.usuario_id, expira_em: sessao.expira_em }
        req.usuario = sessao.usuario
      }
    }
    next()
  } catch (erro) {
    next(erro)
  }
}

export function exigirSessao(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario || !req.sessao) {
    next(erroNaoAutenticado())
    return
  }
  next()
}

export function exigirPapel(...papeis: readonly string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario || !req.sessao) {
      next(erroNaoAutenticado())
      return
    }
    if (!papeis.includes(req.usuario.papel)) {
      next(new Erro(403, 'proibido', 'papel nao permitido'))
      return
    }
    next()
  }
}
