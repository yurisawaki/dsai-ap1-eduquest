import { describe, expect, it } from 'vitest'
import { api, criarUsuarioComSessao } from '../utilidades/aplicacao'

type Agente = Awaited<ReturnType<typeof criarUsuarioComSessao>>['agente']

async function criarCurso(agente: Agente) {
  const resposta = await agente.post('/api/v1/cursos').send({ titulo: 'Curso base' })
  expect(resposta.status).toBe(201)
  return resposta.body.cursoId as string
}

async function criarModuloEaula(agente: Agente, cursoId: string) {
  const modulo = await agente
    .post(`/api/v1/cursos/${cursoId}/modulos`)
    .send({ titulo: 'Modulo' })
  expect(modulo.status).toBe(201)
  const aula = await agente
    .post(`/api/v1/modulos/${modulo.body.moduloId}/aulas`)
    .send({ titulo: 'Aula' })
  expect(aula.status).toBe(201)
  return { moduloId: modulo.body.moduloId as string, aulaId: aula.body.aulaId as string }
}

const proibido = { erro: { codigo: 'proibido', mensagem: expect.any(String) } }
const naoAutenticado = { erro: { codigo: 'nao_autenticado', mensagem: expect.any(String) } }

describe('autorização de cursos (E-14–E-16, R-13; proteção no backend)', () => {
  it('sem sessão: POST/PATCH/DELETE de cursos, módulos e aulas respondem 401', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const cursoId = await criarCurso(professor.agente)
    const { moduloId, aulaId } = await criarModuloEaula(professor.agente, cursoId)

    expect((await api.post('/api/v1/cursos').send({ titulo: 'novo' })).body).toEqual(
      naoAutenticado
    )
    expect((await api.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })).body).toEqual(
      naoAutenticado
    )
    expect((await api.delete(`/api/v1/cursos/${cursoId}`)).body).toEqual(naoAutenticado)
    expect(
      (await api.post(`/api/v1/cursos/${cursoId}/modulos`).send({ titulo: 'm' })).body
    ).toEqual(naoAutenticado)
    expect((await api.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })).body).toEqual(
      naoAutenticado
    )
    expect((await api.delete(`/api/v1/modulos/${moduloId}`)).body).toEqual(naoAutenticado)
    expect(
      (await api.post(`/api/v1/modulos/${moduloId}/aulas`).send({ titulo: 'a' })).body
    ).toEqual(naoAutenticado)
    expect((await api.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })).body).toEqual(
      naoAutenticado
    )
    expect((await api.delete(`/api/v1/aulas/${aulaId}`)).body).toEqual(naoAutenticado)
    expect(
      (await api.put(`/api/v1/aulas/${aulaId}/conteudo`).send({ blocos: [] })).body
    ).toEqual(naoAutenticado)

    for (const resposta of [
      await api.post('/api/v1/cursos').send({ titulo: 'novo' }),
      await api.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true }),
      await api.delete(`/api/v1/cursos/${cursoId}`),
    ]) {
      expect(resposta.status).toBe(401)
    }
  })

  it('estudante autenticado: 403 em toda mutação de curso (POST/PATCH/DELETE)', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const cursoId = await criarCurso(professor.agente)
    const { moduloId, aulaId } = await criarModuloEaula(professor.agente, cursoId)
    const estudante = await criarUsuarioComSessao('estudante')

    const criacao = await estudante.agente.post('/api/v1/cursos').send({ titulo: 'novo' })
    expect(criacao.status).toBe(403)
    expect(criacao.body).toEqual(proibido)

    const edicao = await estudante.agente
      .patch(`/api/v1/cursos/${cursoId}`)
      .send({ publicado: true })
    expect(edicao.status).toBe(403)
    expect(edicao.body).toEqual(proibido)

    const exclusao = await estudante.agente.delete(`/api/v1/cursos/${cursoId}`)
    expect(exclusao.status).toBe(403)
    expect(exclusao.body).toEqual(proibido)

    expect(
      (await estudante.agente.post(`/api/v1/cursos/${cursoId}/modulos`).send({ titulo: 'm' }))
        .status
    ).toBe(403)
    expect(
      (await estudante.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true }))
        .status
    ).toBe(403)
    expect((await estudante.agente.delete(`/api/v1/modulos/${moduloId}`)).status).toBe(403)
    expect(
      (await estudante.agente.post(`/api/v1/modulos/${moduloId}/aulas`).send({ titulo: 'a' }))
        .status
    ).toBe(403)
    expect(
      (await estudante.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })).status
    ).toBe(403)
    expect((await estudante.agente.delete(`/api/v1/aulas/${aulaId}`)).status).toBe(403)
  })

  it('professor dono: cria, edita e exclui seu curso (201/200/204) — operação legítima preservada', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const cursoId = await criarCurso(professor.agente)

    const edicao = await professor.agente
      .patch(`/api/v1/cursos/${cursoId}`)
      .send({ publicado: true })
    expect(edicao.status).toBe(200)
    expect(edicao.body).toEqual({
      id: cursoId,
      titulo: 'Curso base',
      publicado: true,
      donoId: professor.id,
    })

    const exclusao = await professor.agente.delete(`/api/v1/cursos/${cursoId}`)
    expect(exclusao.status).toBe(204)
  })

  it('administrador: edita e exclui curso de terceiro (200/204) — operação legítima preservada', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const cursoId = await criarCurso(professor.agente)
    const admin = await criarUsuarioComSessao('administrador')

    const edicao = await admin.agente.patch(`/api/v1/cursos/${cursoId}`).send({ titulo: 'Revisado' })
    expect(edicao.status).toBe(200)
    expect(edicao.body.titulo).toBe('Revisado')

    const exclusao = await admin.agente.delete(`/api/v1/cursos/${cursoId}`)
    expect(exclusao.status).toBe(204)
  })

  it('IDOR: professor de outro curso não edita/exclui curso, módulo ou aula alheios (403)', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const cursoId = await criarCurso(dono.agente)
    const { moduloId, aulaId } = await criarModuloEaula(dono.agente, cursoId)
    const intruso = await criarUsuarioComSessao('professor')

    expect(
      (await intruso.agente.patch(`/api/v1/cursos/${cursoId}`).send({ titulo: 'hackeado' })).body
    ).toEqual(proibido)
    expect((await intruso.agente.delete(`/api/v1/cursos/${cursoId}`)).body).toEqual(proibido)
    expect(
      (await intruso.agente.post(`/api/v1/cursos/${cursoId}/modulos`).send({ titulo: 'm' })).body
    ).toEqual(proibido)
    expect(
      (await intruso.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })).body
    ).toEqual(proibido)
    expect((await intruso.agente.delete(`/api/v1/modulos/${moduloId}`)).body).toEqual(proibido)
    expect(
      (await intruso.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })).body
    ).toEqual(proibido)
    expect((await intruso.agente.delete(`/api/v1/aulas/${aulaId}`)).body).toEqual(proibido)

    const conferencia = await dono.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(conferencia.status).toBe(200)
    expect(conferencia.body.titulo).toBe('Curso base')
  })

  it('não é possível escolher dono pelo corpo: PATCH com dono_id responde 400', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const cursoId = await criarCurso(dono.agente)
    const outro = await criarUsuarioComSessao('professor')

    const resposta = await dono.agente
      .patch(`/api/v1/cursos/${cursoId}`)
      .send({ dono_id: outro.id })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('validacao')

    const conferencia = await dono.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(conferencia.body.donoId).toBe(dono.id)
  })
})
