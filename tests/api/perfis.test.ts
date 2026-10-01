import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import type request from 'supertest'
import { api, criarUsuarioComSessao } from '../utilidades/aplicacao'

describe('T1.5 — perfis (contratos 7 e 8)', () => {
  it('leitura e edição exigem sessão: 401 sem (E-06/R-05/AC-11)', async () => {
    const { id } = await criarUsuarioComSessao('estudante')
    const leitura = await api.get(`/api/v1/perfis/${id}`)
    expect(leitura.status).toBe(401)
    const edicao = await api.patch(`/api/v1/perfis/${id}`).send({ bio: 'x' })
    expect(edicao.status).toBe(401)
  })

  it('GET devolve o shape do contrato 7 com gamificação vazia e sem e-mail', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const resposta = await professor.agente.get(`/api/v1/perfis/${professor.id}`)
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({
      id: professor.id,
      papel: 'professor',
      bio: null,
      nivel: null,
      conquistas: [],
      inventario: [],
    })
    expect(JSON.stringify(resposta.body)).not.toContain('@')
    expect(JSON.stringify(resposta.body)).not.toContain('email')

    const estudante = await criarUsuarioComSessao('estudante')
    const respostaEstudante = await estudante.agente.get(`/api/v1/perfis/${estudante.id}`)
    expect(respostaEstudante.status).toBe(200)
    expect(respostaEstudante.body).toEqual({
      id: estudante.id,
      papel: 'estudante',
      nivel: null,
      conquistas: [],
      inventario: [],
    })
    expect('bio' in respostaEstudante.body).toBe(false)

    const admin = await criarUsuarioComSessao('administrador')
    const respostaAdmin = await admin.agente.get(`/api/v1/perfis/${admin.id}`)
    expect(respostaAdmin.status).toBe(200)
    expect(respostaAdmin.body.papel).toBe('administrador')
    expect(respostaAdmin.body.nivel).toBeNull()
    expect(JSON.stringify(respostaAdmin.body)).not.toContain('@')
  })

  it('GET de id desconhecido ou não-uuid responde 404', async () => {
    const { agente } = await criarUsuarioComSessao('estudante')
    const desconhecido = await agente.get(`/api/v1/perfis/${randomUUID()}`)
    expect(desconhecido.status).toBe(404)
    const invalido = await agente.get('/api/v1/perfis/nao-e-uuid')
    expect(invalido.status).toBe(404)
  })

  it('titular edita a própria bio de professor e a mudança é lida no GET (200)', async () => {
    const { id, agente } = await criarUsuarioComSessao('professor')
    const edicao = await agente.patch(`/api/v1/perfis/${id}`).send({ bio: 'Professora de matematica' })
    expect(edicao.status).toBe(200)
    expect(edicao.body.bio).toBe('Professora de matematica')

    const relido = await agente.get(`/api/v1/perfis/${id}`)
    expect(relido.body.bio).toBe('Professora de matematica')

    const limpeza = await agente.patch(`/api/v1/perfis/${id}`).send({ bio: null })
    expect(limpeza.status).toBe(200)
    expect(limpeza.body.bio).toBeNull()
  })

  it('não-titular recebe 403 e nada é alterado (isolamento de edição)', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const invasor = await criarUsuarioComSessao('estudante')
    const resposta = await invasor.agente
      .patch(`/api/v1/perfis/${dono.id}`)
      .send({ bio: 'invadida' })
    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('proibido')

    const relido = await dono.agente.get(`/api/v1/perfis/${dono.id}`)
    expect(relido.body.bio).toBeNull()
  })

  it('PATCH de id desconhecido responde 404', async () => {
    const { agente } = await criarUsuarioComSessao('professor')
    const resposta = await agente.patch(`/api/v1/perfis/${randomUUID()}`).send({ bio: 'x' })
    expect(resposta.status).toBe(404)
  })

  it('conjunto de campos editáveis: somente bio de professor; demais casos 400 (P-05 preservada)', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')
    const casos: { agente: ReturnType<typeof request.agent>; id: string; corpo: Record<string, unknown> }[] = [
      { agente: professor.agente, id: professor.id, corpo: {} },
      { agente: professor.agente, id: professor.id, corpo: { nome: 'Novo nome' } },
      { agente: professor.agente, id: professor.id, corpo: { bio: 123 } },
      { agente: professor.agente, id: professor.id, corpo: { bio: 'x', nome: 'y' } },
      { agente: estudante.agente, id: estudante.id, corpo: { bio: 'estudante sem coluna de bio' } },
      { agente: estudante.agente, id: estudante.id, corpo: {} },
      { agente: admin.agente, id: admin.id, corpo: { bio: 'admin sem perfil' } },
      { agente: professor.agente, id: professor.id, corpo: { papel: 'administrador' } },
      { agente: estudante.agente, id: estudante.id, corpo: { papel: 'professor' } },
      { agente: professor.agente, id: professor.id, corpo: { bio: 'x', papel: 'administrador' } },
      { agente: estudante.agente, id: estudante.id, corpo: { role: 'admin', isAdmin: true } },
    ]
    for (const caso of casos) {
      const resposta = await caso.agente.patch(`/api/v1/perfis/${caso.id}`).send(caso.corpo)
      expect(resposta.status, JSON.stringify(caso.corpo)).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }
  })
})
