import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'

export class Erro extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensagem: string
  ) {
    super(mensagem)
    this.name = 'Erro'
  }
}

export const erroValidacao = (mensagem: string) => new Erro(400, 'validacao', mensagem)
export const erroNaoAutenticado = () =>
  new Erro(401, 'nao_autenticado', 'Sessao ausente ou invalida')
export const erroProibido = (mensagem: string) => new Erro(403, 'proibido', mensagem)
export const erroNaoEncontrado = (mensagem: string) => new Erro(404, 'nao_encontrado', mensagem)

export function manipularErro(
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (erro instanceof Erro) {
    res
      .status(erro.status)
      .json({ erro: { codigo: erro.codigo, mensagem: erro.message } })
    return
  }
  if (erro instanceof SyntaxError && 'status' in erro && erro.status === 400) {
    res
      .status(400)
      .json({ erro: { codigo: 'validacao', mensagem: 'JSON malformado' } })
    return
  }
  // R-C6f (SPEC de conteúdo): corpo acima do limite é 400 — 413 não pertence ao contrato (técnica §2.3.1)
  if (erro instanceof Error && 'type' in erro && erro.type === 'entity.too.large') {
    res
      .status(400)
      .json({ erro: { codigo: 'validacao', mensagem: 'corpo excede o limite permitido' } })
    return
  }
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === 'P2002') {
      res
        .status(409)
        .json({ erro: { codigo: 'conflito', mensagem: 'recurso duplicado' } })
      return
    }
    if (erro.code === 'P2025') {
      res
        .status(404)
        .json({ erro: { codigo: 'nao_encontrado', mensagem: 'recurso nao encontrado' } })
      return
    }
  }
  console.error(erro)
  res.status(500).json({ erro: { codigo: 'erro_interno', mensagem: 'erro interno' } })
}
