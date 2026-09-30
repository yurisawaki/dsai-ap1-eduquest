import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { api, app, emailUnico, primeiroCookie, senhaPadrao } from '../utilidades/aplicacao'

async function criarSessaoDeTeste() {
  const email = emailUnico()
  await api
    .post('/api/v1/auth/registro')
    .send({ email, senha: senhaPadrao, papel: 'estudante' })
  const agente = request.agent(app)
  const login = await agente.post('/api/v1/auth/login').send({ email, senha: senhaPadrao })
  return { email, agente, login }
}

describe('T1.3 — login, sessão e logout (contratos 2, 3 e 4)', () => {
  it('login responde 200 com cookie HttpOnly, SameSite=Lax e Path=/', async () => {
    const { login } = await criarSessaoDeTeste()
    expect(login.status).toBe(200)
    const cookie = primeiroCookie(login)
    expect(cookie).toContain('eduquest_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(JSON.stringify(login.body)).not.toContain(senhaPadrao)
  })

  it('cookie recebe Secure quando a requisição chega por HTTPS', async () => {
    const email = emailUnico()
    await api.post('/api/v1/auth/registro').send({ email, senha: senhaPadrao, papel: 'estudante' })
    const login = await api
      .post('/api/v1/auth/login')
      .set('X-Forwarded-Proto', 'https')
      .send({ email, senha: senhaPadrao })
    expect(login.status).toBe(200)
    expect(primeiroCookie(login)).toContain('Secure')
  })

  it('credenciais inválidas respondem 401 com a mesma resposta (E-04, sem revelar motivo)', async () => {
    const email = emailUnico()
    await api.post('/api/v1/auth/registro').send({ email, senha: senhaPadrao, papel: 'estudante' })
    const senhaErrada = await api.post('/api/v1/auth/login').send({ email, senha: 'errada-999' })
    const contaInexistente = await api
      .post('/api/v1/auth/login')
      .send({ email: emailUnico(), senha: senhaPadrao })
    expect(senhaErrada.status).toBe(401)
    expect(contaInexistente.status).toBe(401)
    expect(senhaErrada.body).toEqual(contaInexistente.body)
    expect(senhaErrada.body.erro.codigo).toBe('credenciais_invalidas')
  })

  it('login com dados malformados responde 400 (E-05)', async () => {
    for (const corpo of [{}, { email: '', senha: 'x' }, { email: 'a@x.test' }]) {
      const resposta = await api.post('/api/v1/auth/login').send(corpo)
      expect(resposta.status, JSON.stringify(corpo)).toBe(400)
    }
  })

  it('GET /sessao devolve {usuarioId, papel, expiraEm} com cookie e 401 sem (contrato 4)', async () => {
    const { agente } = await criarSessaoDeTeste()
    const sessao = await agente.get('/api/v1/auth/sessao')
    expect(sessao.status).toBe(200)
    expect(sessao.body.usuarioId).toEqual(expect.any(String))
    expect(sessao.body.papel).toBe('estudante')
    expect(new Date(sessao.body.expiraEm).getTime()).toBeGreaterThan(Date.now())

    const semCookie = await api.get('/api/v1/auth/sessao')
    expect(semCookie.status).toBe(401)
    expect(semCookie.body.erro.codigo).toBe('nao_autenticado')
  })

  it('sessão expirada é rejeitada com 401 (AC-08/E-07)', async () => {
    const { agente } = await criarSessaoDeTeste()
    const atual = await agente.get('/api/v1/auth/sessao')
    expect(atual.status).toBe(200)
    await prisma.sessao.updateMany({
      where: { usuario_id: atual.body.usuarioId },
      data: { expira_em: new Date(Date.now() - 1000) },
    })
    const depois = await agente.get('/api/v1/auth/sessao')
    expect(depois.status).toBe(401)
    expect(depois.body.erro.codigo).toBe('nao_autenticado')
  })

  it('logout revoga a sessão, descarta o cookie e torna o cookie antigo inutilizável (E-08/E-10)', async () => {
    const { agente } = await criarSessaoDeTeste()
    const antes = await agente.get('/api/v1/auth/sessao')
    expect(antes.status).toBe(200)

    const saida = await agente.post('/api/v1/auth/logout')
    expect(saida.status).toBe(204)
    expect(primeiroCookie(saida)).toContain('eduquest_session=')
    expect(primeiroCookie(saida)).toContain('Expires=Thu, 01 Jan 1970')

    const depois = await agente.get('/api/v1/auth/sessao')
    expect(depois.status).toBe(401)

    const repetir = await agente.post('/api/v1/auth/logout')
    expect(repetir.status).toBe(401)

    const sessao = await prisma.sessao.findFirst({
      where: { usuario_id: antes.body.usuarioId },
      orderBy: { criado_em: 'desc' },
    })
    expect(sessao!.revogada_em).not.toBeNull()
  })

  it('logout sem sessão responde 401 (E-09)', async () => {
    const resposta = await api.post('/api/v1/auth/logout')
    expect(resposta.status).toBe(401)
  })
})
