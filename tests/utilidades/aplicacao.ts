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
