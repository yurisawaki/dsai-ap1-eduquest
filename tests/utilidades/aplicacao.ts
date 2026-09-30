import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { criarApp } from '../../src/server/app'

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

export async function criarUsuarioComSessao(papel: PapelDeTeste) {
  const email = emailUnico()
  const registro = await api
    .post('/api/v1/auth/registro')
    .send({ email, senha: senhaPadrao, papel })
  const agente = request.agent(app)
  await agente.post('/api/v1/auth/login').send({ email, senha: senhaPadrao })
  return { id: registro.body.usuarioId as string, agente }
}
