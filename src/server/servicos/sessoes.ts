import { randomUUID } from 'node:crypto'
import type { Request } from 'express'
import { sessaoExpiracaoMinutos } from '../config'
import { prisma } from '../prisma'

export interface SessaoCriada {
  id: string
  usuario_id: string
  expira_em: Date
}

export async function criarSessao(usuarioId: string): Promise<SessaoCriada> {
  const expira_em = new Date(Date.now() + sessaoExpiracaoMinutos * 60_000)
  return prisma.sessao.create({
    data: { id: randomUUID(), usuario_id: usuarioId, expira_em },
    select: { id: true, usuario_id: true, expira_em: true },
  })
}

export async function revogarSessao(sessaoId: string): Promise<void> {
  await prisma.sessao.update({
    where: { id: sessaoId },
    data: { revogada_em: new Date() },
  })
}

interface OpcoesCookie {
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
  path: string
  expires?: Date
}

export function opcoesCookie(req: Request, expiraEm: Date): OpcoesCookie {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    path: '/',
    expires: expiraEm,
  }
}

export function opcoesLimpezaCookie(req: Request): OpcoesCookie {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    path: '/',
  }
}
