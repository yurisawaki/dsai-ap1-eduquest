import { describe, expect, it } from 'vitest'
import { prisma } from '../../src/server/prisma'
import { api, emailUnico, senhaPadrao } from '../utilidades/aplicacao'

describe('T1.2 — cadastro de contas (contrato 1)', () => {
  it('cria conta dos três papéis com 201 {usuarioId, papel} e sem sessão automática', async () => {
    for (const papel of ['estudante', 'professor', 'administrador'] as const) {
      const resposta = await api
        .post('/api/v1/auth/registro')
        .send({ email: emailUnico(), senha: senhaPadrao, papel })
      expect(resposta.status, papel).toBe(201)
      expect(resposta.body).toEqual({ usuarioId: expect.any(String), papel })
      expect(resposta.headers['set-cookie']).toBeUndefined()
    }
  })

  it('armazena apenas hash bcrypt e cria a linha de perfil correspondente (transação)', async () => {
    const email = emailUnico()
    const senha = 'outra-senha-456'
    const resposta = await api
      .post('/api/v1/auth/registro')
      .send({ email, senha, papel: 'estudante' })
    expect(resposta.status).toBe(201)

    const usuario = await prisma.usuario.findUnique({
      where: { id: resposta.body.usuarioId },
      include: { credencial: true, perfil_estudante: true, perfil_professor: true },
    })
    expect(usuario).not.toBeNull()
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

  it('professor recebe perfil_professor; administrador não recebe linha de perfil', async () => {
    const registroProfessor = await api.post('/api/v1/auth/registro').send({
      email: emailUnico(),
      senha: senhaPadrao,
      papel: 'professor',
    })
    const professor = await prisma.usuario.findUnique({
      where: { id: registroProfessor.body.usuarioId },
      include: { perfil_professor: true, perfil_estudante: true },
    })
    expect(professor!.perfil_professor).not.toBeNull()
    expect(professor!.perfil_estudante).toBeNull()

    const registroAdmin = await api.post('/api/v1/auth/registro').send({
      email: emailUnico(),
      senha: senhaPadrao,
      papel: 'administrador',
    })
    const admin = await prisma.usuario.findUnique({
      where: { id: registroAdmin.body.usuarioId },
      include: { perfil_professor: true, perfil_estudante: true },
    })
    expect(admin!.perfil_professor).toBeNull()
    expect(admin!.perfil_estudante).toBeNull()
  })

  it('rejeita e-mail duplicado com 409 e não cria conta duplicada (AC-05)', async () => {
    const email = emailUnico()
    const primeira = await api
      .post('/api/v1/auth/registro')
      .send({ email, senha: senhaPadrao, papel: 'estudante' })
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
      { email: '', senha: senhaPadrao, papel: 'estudante' },
      { email: emailUnico(), senha: '', papel: 'estudante' },
      { email: emailUnico(), senha: senhaPadrao, papel: 'super' },
      { email: 123, senha: senhaPadrao, papel: 'estudante' },
      { email: emailUnico(), senha: senhaPadrao },
      { email: `${'a'.repeat(250)}@x.test`, senha: senhaPadrao, papel: 'estudante' },
    ]
    for (const corpo of casos) {
      const resposta = await api.post('/api/v1/auth/registro').send(corpo)
      expect(resposta.status, JSON.stringify(corpo)).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }
  })
})
