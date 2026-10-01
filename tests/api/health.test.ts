import { describe, expect, it } from 'vitest'
import { api } from '../utilidades/aplicacao'

describe('health check de produção (deploy AP1)', () => {
  it('GET /api/v1/health responde 200 {status: ok} sem sessão', async () => {
    const resposta = await api.get('/api/v1/health')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'ok' })
  })
})
