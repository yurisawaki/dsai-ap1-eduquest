import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { criarApp } from '../../src/server/app'
import { prisma } from '../../src/server/prisma'
import { gerarHash } from '../../src/server/servicos/senha'

export const app = criarApp()
export const api = request(app)

export function emailUnico(): string {
  return `teste-${randomUUID()}@exemplo.test`
}

export const senhaPadrao = 'senha-segura-123'

export function primeiroCookie(resposta: { headers: Record<string, unknown> }): string {
  const cookies = resposta.headers['set-cookie']
  const primeiro = Array.isArray(cookies) ? cookies[0] : cookies
  return String(primeiro ?? '')
}

export type PapelDeTeste = 'estudante' | 'professor' | 'administrador'

// R-12 (SPEC de D1): o cadastro público só cria estudante. Papéis
// professor/administrador são provisionados pela operação — aqui, direto
// no banco (mesma mecânica do seed), nunca pela rota /auth/registro.
export async function criarUsuarioComSessao(papel: PapelDeTeste) {
  const email = emailUnico()
  const hash = await gerarHash(senhaPadrao)
  const usuario = await prisma.usuario.create({ data: { id: randomUUID(), email, papel } })
  await prisma.credencial.create({
    data: { usuario_id: usuario.id, hash_senha: hash },
  })
  if (papel === 'estudante') {
    await prisma.perfilEstudante.create({ data: { usuario_id: usuario.id } })
  } else if (papel === 'professor') {
    await prisma.perfilProfessor.create({ data: { usuario_id: usuario.id } })
  }
  const agente = request.agent(app)
  await agente.post('/api/v1/auth/login').send({ email, senha: senhaPadrao })
  return { id: usuario.id, agente }
}
