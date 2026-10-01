import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { api, app, emailUnico, senhaPadrao } from '../utilidades/aplicacao'

const tentativasDeEscalada: Record<string, unknown>[] = [
  { papel: 'administrador' },
  { papel: 'professor' },
  { papel: 'admin' },
  { papel: 'ADMINISTRADOR' },
  { Papel: 'administrador' },
  { perfil: 'ADMIN' },
  { perfil: { papel: 'administrador' } },
  { usuario: { papel: 'administrador' } },
  { role: 'admin' },
  { administrador: true },
  { isAdmin: true },
  { admin: true },
  { tipo: 'professor' },
  { privilegio: 'admin' },
  { nivel: 'admin' },
  { papel: ['administrador'] },
  { papel: { valor: 'administrador' } },
  { papel: 1 },
  { papel: null },
]

describe('T1.2 — cadastro de contas (contrato 1; R-12)', () => {
  it('cadastro público cria conta de estudante com 201 {usuarioId, papel} e sem sessão automática', async () => {
    const resposta = await api
      .post('/api/v1/auth/registro')
      .send({ email: emailUnico(), senha: senhaPadrao })
    expect(resposta.status).toBe(201)
    expect(resposta.body).toEqual({ usuarioId: expect.any(String), papel: 'estudante' })
    expect(resposta.headers['set-cookie']).toBeUndefined()
  })

  it('armazena apenas hash bcrypt e cria a linha de perfil de estudante (transação)', async () => {
    const email = emailUnico()
    const senha = 'outra-senha-456'
    const resposta = await api
      .post('/api/v1/auth/registro')
      .send({ email, senha })
    expect(resposta.status).toBe(201)

    const usuario = await prisma.usuario.findUnique({
      where: { id: resposta.body.usuarioId },
      include: { credencial: true, perfil_estudante: true, perfil_professor: true },
    })
    expect(usuario).not.toBeNull()
    expect(usuario!.papel).toBe('estudante')
    expect(usuario!.credencial).not.toBeNull()
    const hash = usuario!.credencial!.hash_senha
    expect(hash).not.toBe(senha)
    expect(hash).toMatch(/^\$2[aby]\$/)
    expect(usuario!.perfil_estudante).not.toBeNull()
    expect(usuario!.perfil_professor).toBeNull()
    expect(JSON.stringify(resposta.body)).not.toContain(senha)

    const login = await api.post('/api/v1/auth/login').send({ email, senha })
    expect(login.status).toBe(200)
  })

  it('ignora campos de privilégio enviados pelo cliente (R-12): nenhum vira papel', async () => {
    for (const campos of tentativasDeEscalada) {
      const email = emailUnico()
      const resposta = await api
        .post('/api/v1/auth/registro')
        .send({ email, senha: senhaPadrao, ...campos })
      expect(resposta.status, JSON.stringify(campos)).toBe(201)
      expect(resposta.body.papel, JSON.stringify(campos)).toBe('estudante')

      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { perfil_estudante: true, perfil_professor: true },
      })
      expect(usuario?.papel, JSON.stringify(campos)).toBe('estudante')
      expect(usuario?.perfil_estudante, JSON.stringify(campos)).not.toBeNull()
      expect(usuario?.perfil_professor, JSON.stringify(campos)).toBeNull()
    }
  })

  it('ignora campos de privilégio em query string e headers (R-12)', async () => {
    const email = emailUnico()
    const resposta = await api
      .post('/api/v1/auth/registro?papel=administrador&role=admin&isAdmin=true')
      .set('x-papel', 'administrador')
      .set('x-is-admin', 'true')
      .send({ email, senha: senhaPadrao })
    expect(resposta.status).toBe(201)
    expect(resposta.body.papel).toBe('estudante')
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    expect(usuario?.papel).toBe('estudante')
  })

  it('corpo não-JSON (form-urlencoded) não é interpretado: 400 e nenhuma conta criada', async () => {
    const email = emailUnico()
    const resposta = await api
      .post('/api/v1/auth/registro')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(
        `email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senhaPadrao)}&papel=administrador`
      )
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('validacao')
    expect(await prisma.usuario.count({ where: { email } })).toBe(0)
  })

  it('JSON com __proto__/constructor não contamina o protótipo nem vira papel', async () => {
    const email = emailUnico()
    const resposta = await api
      .post('/api/v1/auth/registro')
      .set('Content-Type', 'application/json')
      .send(
        `{"email":"${email}","senha":"${senhaPadrao}","__proto__":{"papel":"administrador"},"constructor":{"prototype":{"papel":"administrador"}}}`
      )
    expect(resposta.status).toBe(201)
    expect(resposta.body.papel).toBe('estudante')
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    expect(usuario?.papel).toBe('estudante')
    expect(({} as Record<string, unknown>).papel).toBeUndefined()
  })

  it('não existe endpoint público de promoção de usuário (404)', async () => {
    const id = '22222222-2222-4222-8222-222222222222'
    const respostas = [
      await api.post('/api/v1/auth/promover').send({ papel: 'administrador' }),
      await api.post('/api/v1/auth/registro/administrador').send({ email: emailUnico(), senha: senhaPadrao }),
      await api.post(`/api/v1/usuarios/${id}/papel`).send({ papel: 'administrador' }),
      await api.patch(`/api/v1/usuarios/${id}`).send({ papel: 'administrador' }),
      await api.put(`/api/v1/usuarios/${id}/papel`).send({ papel: 'administrador' }),
      await api.post(`/api/v1/perfis/${id}/papel`).send({ papel: 'administrador' }),
    ]
    for (const [indice, resposta] of respostas.entries()) {
      expect(resposta.status, `caso ${indice}: ${resposta.status}`).toBe(404)
      expect(resposta.body.erro.codigo).toBe('nao_encontrado')
    }
  })

  it('escalada bloqueada de ponta a ponta: cadastro "administrador" não administra cursos (403)', async () => {
    const email = emailUnico()
    const registro = await api.post('/api/v1/auth/registro').send({
      email,
      senha: senhaPadrao,
      nome: 'Atacante',
      papel: 'administrador',
      perfil: 'ADMIN',
      role: 'admin',
      isAdmin: true,
      administrador: true,
      tipo: 'professor',
    })
    expect(registro.status).toBe(201)

    const atacante = request.agent(app)
    const login = await atacante
      .post('/api/v1/auth/login')
      .send({ email, senha: senhaPadrao, papel: 'administrador', role: 'admin' })
    expect(login.status).toBe(200)

    const sessao = await atacante.get('/api/v1/auth/sessao')
    expect(sessao.status).toBe(200)
    expect(sessao.body.papel).toBe('estudante')

    const criacao = await atacante.post('/api/v1/cursos').send({ titulo: 'Curso roubado' })
    expect(criacao.status).toBe(403)
    expect(criacao.body).toEqual({
      erro: { codigo: 'proibido', mensagem: expect.any(String) },
    })
  })

  it('rejeita e-mail duplicado com 409 e não cria conta duplicada (AC-05)', async () => {
    const email = emailUnico()
    const primeira = await api
      .post('/api/v1/auth/registro')
      .send({ email, senha: senhaPadrao })
    expect(primeira.status).toBe(201)

    const segunda = await api
      .post('/api/v1/auth/registro')
      .send({ email, senha: 'outra-senha-789', papel: 'professor' })
    expect(segunda.status).toBe(409)
    expect(segunda.body).toEqual({
      erro: { codigo: 'email_em_uso', mensagem: expect.any(String) },
    })
    expect(await prisma.usuario.count({ where: { email } })).toBe(1)
  })

  it('valida dados de entrada com 400 (E-02; escopo: presença/tipo/tamanho do modelo)', async () => {
    const casos: Record<string, unknown>[] = [
      {},
      { email: '', senha: senhaPadrao },
      { email: emailUnico(), senha: '' },
      { email: 123, senha: senhaPadrao },
      { email: `${'a'.repeat(250)}@x.test`, senha: senhaPadrao },
    ]
    for (const corpo of casos) {
      const resposta = await api.post('/api/v1/auth/registro').send(corpo)
      expect(resposta.status, JSON.stringify(corpo)).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }
  })
})
