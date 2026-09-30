import { describe, expect, it } from 'vitest'
import { prisma } from '../../src/server/prisma'
import { solicitarRecuperacao } from '../../src/server/servicos/recuperacao'
import { api, emailUnico, senhaPadrao } from '../utilidades/aplicacao'

describe('T1.3 — recuperação de senha (contratos 5 e 6)', () => {
  it('responde 202 com resposta idêntica e neutra para e-mail existente e inexistente (E-11/R-08)', async () => {
    const email = emailUnico()
    await api.post('/api/v1/auth/registro').send({ email, senha: senhaPadrao, papel: 'estudante' })

    const existente = await api.post('/api/v1/auth/recuperacao-senha').send({ email })
    const inexistente = await api.post('/api/v1/auth/recuperacao-senha').send({ email: emailUnico() })

    expect(existente.status).toBe(202)
    expect(inexistente.status).toBe(202)
    expect(existente.body).toEqual(inexistente.body)
  })

  it('solicitação com dados malformados responde 400', async () => {
    const semEmail = await api.post('/api/v1/auth/recuperacao-senha').send({})
    expect(semEmail.status).toBe(400)
    const emailVazio = await api.post('/api/v1/auth/recuperacao-senha').send({ email: '' })
    expect(emailVazio.status).toBe(400)
  })

  it('redefinição com token válido troca a senha (204) e a nova senha passa a valer', async () => {
    const email = emailUnico()
    await api.post('/api/v1/auth/registro').send({ email, senha: senhaPadrao, papel: 'estudante' })

    const token = await solicitarRecuperacao(email)
    expect(token).toEqual(expect.any(String))

    const redefinicao = await api
      .post('/api/v1/auth/redefinicao-senha')
      .send({ token, senha: 'nova-senha-abc' })
    expect(redefinicao.status).toBe(204)

    const senhaAntiga = await api.post('/api/v1/auth/login').send({ email, senha: senhaPadrao })
    expect(senhaAntiga.status).toBe(401)

    const senhaNova = await api
      .post('/api/v1/auth/login')
      .send({ email, senha: 'nova-senha-abc' })
    expect(senhaNova.status).toBe(200)
  })

  it('token inválido ou expirado responde 400 (E-12)', async () => {
    const invalido = await api
      .post('/api/v1/auth/redefinicao-senha')
      .send({ token: 'token-inexistente', senha: 'qualquer-senha-1' })
    expect(invalido.status).toBe(400)
    expect(invalido.body.erro.codigo).toBe('token_invalido')

    const email = emailUnico()
    await api.post('/api/v1/auth/registro').send({ email, senha: senhaPadrao, papel: 'estudante' })
    const token = await solicitarRecuperacao(email)
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    await prisma.tokenRecuperacao.updateMany({
      where: { usuario_id: usuario!.id },
      data: { expira_em: new Date(Date.now() - 1000) },
    })
    const expirado = await api
      .post('/api/v1/auth/redefinicao-senha')
      .send({ token, senha: 'qualquer-senha-2' })
    expect(expirado.status).toBe(400)
    expect(expirado.body.erro.codigo).toBe('token_invalido')
  })

  it('redefinição com campos ausentes responde 400', async () => {
    const semToken = await api.post('/api/v1/auth/redefinicao-senha').send({})
    expect(semToken.status).toBe(400)
    const semSenha = await api
      .post('/api/v1/auth/redefinicao-senha')
      .send({ token: 'algo-qualquer' })
    expect(semSenha.status).toBe(400)
  })
})
