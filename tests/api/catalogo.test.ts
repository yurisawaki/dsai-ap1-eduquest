import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { api, criarUsuarioComSessao } from '../utilidades/aplicacao'

type Agente = ReturnType<typeof request.agent>

async function criarHierarquia(agente: Agente) {
  const curso = await agente.post('/api/v1/cursos').send({ titulo: 'Curso de teste' })
  const modulo = await agente
    .post(`/api/v1/cursos/${curso.body.cursoId}/modulos`)
    .send({ titulo: 'Modulo 1' })
  const aula = await agente
    .post(`/api/v1/modulos/${modulo.body.moduloId}/aulas`)
    .send({ titulo: 'Aula 1' })
  return {
    cursoId: curso.body.cursoId as string,
    moduloId: modulo.body.moduloId as string,
    aulaId: aula.body.aulaId as string,
  }
}

async function publicar(agente: Agente, alvo: 'curso' | 'modulo' | 'aula', id: string) {
  const rota = alvo === 'curso' ? `/api/v1/cursos/${id}` : `/api/v1/${alvo}s/${id}`
  return agente.patch(rota).send({ publicado: true })
}

describe('T2.2/T2.4 — hierarquia, publicação e autoria (F2-01–F2-11)', () => {
  it('as 14 rotas de F2 exigem sessão: 401 sem cookie (E-14/AC-13)', async () => {
    const id = randomUUID()
    const respostas = [
      await api.post('/api/v1/cursos').send({ titulo: 'x' }),
      await api.get('/api/v1/cursos'),
      await api.get(`/api/v1/cursos/${id}`),
      await api.patch(`/api/v1/cursos/${id}`).send({ titulo: 'x' }),
      await api.delete(`/api/v1/cursos/${id}`),
      await api.post(`/api/v1/cursos/${id}/modulos`).send({ titulo: 'x' }),
      await api.patch(`/api/v1/modulos/${id}`).send({ titulo: 'x' }),
      await api.delete(`/api/v1/modulos/${id}`),
      await api.post(`/api/v1/modulos/${id}/aulas`).send({ titulo: 'x' }),
      await api.patch(`/api/v1/aulas/${id}`).send({ titulo: 'x' }),
      await api.delete(`/api/v1/aulas/${id}`),
      await api.put(`/api/v1/aulas/${id}/conteudo`).send({}),
      await api.get(`/api/v1/aulas/${id}`),
      await api.post(`/api/v1/aulas/${id}/conclusao`).send({}),
    ]
    for (const resposta of respostas) {
      expect(resposta.status).toBe(401)
      expect(resposta.body.erro.codigo).toBe('nao_autenticado')
    }
  })

  it('criar curso é exclusivo do professor: estudante e admin recebem 403 (E-15/R-13)', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')
    const negadoEstudante = await estudante.agente
      .post('/api/v1/cursos')
      .send({ titulo: 'Curso do estudante' })
    expect(negadoEstudante.status).toBe(403)
    expect(negadoEstudante.body.erro.codigo).toBe('proibido')
    const negadoAdmin = await admin.agente.post('/api/v1/cursos').send({ titulo: 'Curso do admin' })
    expect(negadoAdmin.status).toBe(403)
    expect(negadoAdmin.body.erro.codigo).toBe('proibido')
  })

  it('professor cria curso em rascunho: 201 {cursoId} e estrutura vazia (F2-01/R-16)', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const resposta = await professor.agente.post('/api/v1/cursos').send({ titulo: 'Algebra' })
    expect(resposta.status).toBe(201)
    expect(Object.keys(resposta.body)).toEqual(['cursoId'])

    const leitura = await professor.agente.get(`/api/v1/cursos/${resposta.body.cursoId}`)
    expect(leitura.status).toBe(200)
    expect(leitura.body).toEqual({
      id: resposta.body.cursoId,
      titulo: 'Algebra',
      publicado: false,
      donoId: professor.id,
      modulos: [],
    })
  })

  it('hierarquia fixa: alvo inexistente 404, payload sem título 400, JSON inválido 400 (E-17/R-12)', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const inexistente = randomUUID()
    expect(
      (await professor.agente.post(`/api/v1/cursos/${inexistente}/modulos`).send({ titulo: 'M' }))
        .status
    ).toBe(404)
    expect(
      (await professor.agente.post(`/api/v1/modulos/${inexistente}/aulas`).send({ titulo: 'A' }))
        .status
    ).toBe(404)
    expect(
      (await professor.agente.post('/api/v1/cursos/nao-e-uuid/modulos').send({ titulo: 'M' }))
        .status
    ).toBe(404)

    const { cursoId, moduloId } = await criarHierarquia(professor.agente)
    const semTitulo = await professor.agente.post(`/api/v1/cursos/${cursoId}/modulos`).send({})
    expect(semTitulo.status).toBe(400)
    expect(semTitulo.body.erro.codigo).toBe('validacao')

    const semTituloAula = await professor.agente.post(`/api/v1/modulos/${moduloId}/aulas`).send({})
    expect(semTituloAula.status).toBe(400)
    expect(semTituloAula.body.erro.codigo).toBe('validacao')

    const malformado = await professor.agente
      .post(`/api/v1/cursos/${cursoId}/modulos`)
      .set('Content-Type', 'application/json')
      .send('{invalido')
    expect(malformado.status).toBe(400)
    expect(malformado.body.erro.codigo).toBe('validacao')
  })

  it('professor não-dono e estudante recebem 403 em toda mutação (E-16/R-13)', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const outro = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const { cursoId, moduloId, aulaId } = await criarHierarquia(dono.agente)

    const negacoes = [
      await outro.agente.patch(`/api/v1/cursos/${cursoId}`).send({ titulo: 'roubo' }),
      await estudante.agente.delete(`/api/v1/cursos/${cursoId}`),
      await outro.agente.post(`/api/v1/cursos/${cursoId}/modulos`).send({ titulo: 'M' }),
      await estudante.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true }),
      await estudante.agente.delete(`/api/v1/modulos/${moduloId}`),
      await outro.agente.post(`/api/v1/modulos/${moduloId}/aulas`).send({ titulo: 'A' }),
      await estudante.agente.patch(`/api/v1/aulas/${aulaId}`).send({ titulo: 'A2' }),
      await outro.agente
        .put(`/api/v1/aulas/${aulaId}/conteudo`)
        .send({ tipo: 'texto', dados: {} }),
      await estudante.agente.delete(`/api/v1/aulas/${aulaId}`),
    ]
    for (const resposta of negacoes) {
      expect(resposta.status).toBe(403)
      expect(resposta.body.erro.codigo).toBe('proibido')
    }

    const intacto = await dono.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(intacto.body.titulo).toBe('Curso de teste')
    expect(intacto.body.modulos).toHaveLength(1)
    expect(intacto.body.modulos[0].aulas).toHaveLength(1)
  })

  it('alvo inexistente em GET/PATCH/DELETE/PUT responde 404 (E-18)', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const id = randomUUID()
    const respostas = [
      await professor.agente.get(`/api/v1/cursos/${id}`),
      await professor.agente.patch(`/api/v1/cursos/${id}`).send({ titulo: 'x' }),
      await professor.agente.delete(`/api/v1/cursos/${id}`),
      await professor.agente.get('/api/v1/cursos/nao-e-uuid'),
      await professor.agente.patch(`/api/v1/modulos/${id}`).send({ titulo: 'x' }),
      await professor.agente.delete(`/api/v1/modulos/${id}`),
      await professor.agente.patch(`/api/v1/aulas/${id}`).send({ titulo: 'x' }),
      await professor.agente.delete(`/api/v1/aulas/${id}`),
      await professor.agente.get(`/api/v1/aulas/${id}`),
      await professor.agente.put(`/api/v1/aulas/${id}/conteudo`).send({}),
    ]
    for (const resposta of respostas) {
      expect(resposta.status).toBe(404)
      expect(resposta.body.erro.codigo).toBe('nao_encontrado')
    }
  })

  it('listagem do catálogo: rascunho só para dono/admin, publicado para todos, shape do F2-02 (R-17)', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const outro = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')
    const { cursoId } = await criarHierarquia(dono.agente)

    const doDono = await dono.agente.get('/api/v1/cursos')
    expect(doDono.status).toBe(200)
    const criado = doDono.body.find((curso: { id: string }) => curso.id === cursoId)
    expect(Object.keys(criado).sort()).toEqual(['donoId', 'id', 'publicado', 'titulo'])

    for (const leitor of [outro, estudante]) {
      const lista = await leitor.agente.get('/api/v1/cursos')
      expect(lista.body.some((curso: { id: string }) => curso.id === cursoId)).toBe(false)
      const abertura = await leitor.agente.get(`/api/v1/cursos/${cursoId}`)
      expect(abertura.status).toBe(404)
    }
    const doAdmin = await admin.agente.get('/api/v1/cursos')
    expect(doAdmin.body.some((curso: { id: string }) => curso.id === cursoId)).toBe(true)

    await publicar(dono.agente, 'curso', cursoId)
    const doEstudante = await estudante.agente.get('/api/v1/cursos')
    expect(doEstudante.body.some((curso: { id: string }) => curso.id === cursoId)).toBe(true)
    for (const curso of doEstudante.body) {
      expect(curso.publicado).toBe(true)
    }
  })

  it('estrutura do curso filtra rascunhos do leitor comum e mostra tudo ao dono (F2-03/R-17)', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const { cursoId, moduloId } = await criarHierarquia(dono.agente)

    const modulo2 = await dono.agente
      .post(`/api/v1/cursos/${cursoId}/modulos`)
      .send({ titulo: 'Modulo rascunho' })
    await dono.agente
      .post(`/api/v1/modulos/${modulo2.body.moduloId}/aulas`)
      .send({ titulo: 'Aula rascunho' })
    const aula2 = await dono.agente
      .post(`/api/v1/modulos/${moduloId}/aulas`)
      .send({ titulo: 'Aula rascunho no modulo publico' })

    const comoDono = await dono.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(comoDono.body.modulos).toHaveLength(2)
    expect(comoDono.body.modulos[0].aulas).toHaveLength(2)

    await publicar(dono.agente, 'curso', cursoId)
    await publicar(dono.agente, 'modulo', moduloId)
    await publicar(dono.agente, 'aula', aula2.body.aulaId)

    const comoEstudante = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(comoEstudante.status).toBe(200)
    expect(comoEstudante.body).toEqual({
      id: cursoId,
      titulo: 'Curso de teste',
      publicado: true,
      donoId: dono.id,
      modulos: [
        {
          id: moduloId,
          titulo: 'Modulo 1',
          publicado: true,
          aulas: [
            { id: aula2.body.aulaId, titulo: 'Aula rascunho no modulo publico', publicado: true },
          ],
        },
      ],
      progresso: {
        aulasConcluidas: 0,
        aulasTotal: 1,
        percentual: 0,
        modulos: [
          { moduloId, aulasConcluidas: 0, aulasTotal: 1, percentual: 0 },
        ],
      },
    })
  })

  it('admin edita curso alheio; despublicação devolve 200 e volta a esconder (E-26)', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const admin = await criarUsuarioComSessao('administrador')
    const estudante = await criarUsuarioComSessao('estudante')
    const { cursoId } = await criarHierarquia(dono.agente)

    const edicao = await admin.agente
      .patch(`/api/v1/cursos/${cursoId}`)
      .send({ titulo: 'Renomeado' })
    expect(edicao.status).toBe(200)
    expect(edicao.body.titulo).toBe('Renomeado')

    await publicar(dono.agente, 'curso', cursoId)
    expect((await estudante.agente.get(`/api/v1/cursos/${cursoId}`)).status).toBe(200)

    const despublicado = await admin.agente
      .patch(`/api/v1/cursos/${cursoId}`)
      .send({ publicado: false })
    expect(despublicado.status).toBe(200)
    expect(despublicado.body.publicado).toBe(false)
    expect((await estudante.agente.get(`/api/v1/cursos/${cursoId}`)).status).toBe(404)
  })

  it('exclusão: 204 com dependentes em cascata; excluído depois vira 404 (E-25)', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const { cursoId, moduloId, aulaId } = await criarHierarquia(dono.agente)
    await publicar(dono.agente, 'curso', cursoId)
    await publicar(dono.agente, 'modulo', moduloId)
    await publicar(dono.agente, 'aula', aulaId)
    await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})

    expect((await dono.agente.delete(`/api/v1/cursos/${cursoId}`)).status).toBe(204)
    expect((await dono.agente.get(`/api/v1/cursos/${cursoId}`)).status).toBe(404)
    expect((await dono.agente.get(`/api/v1/aulas/${aulaId}`)).status).toBe(404)
    expect((await dono.agente.delete(`/api/v1/modulos/${moduloId}`)).status).toBe(404)

    const outra = await criarHierarquia(dono.agente)
    expect((await dono.agente.delete(`/api/v1/modulos/${outra.moduloId}`)).status).toBe(204)
    expect((await dono.agente.get(`/api/v1/aulas/${outra.aulaId}`)).status).toBe(404)
    expect((await dono.agente.delete(`/api/v1/aulas/${outra.aulaId}`)).status).toBe(404)
  })

  it('título ausente/vazio/não-string é 400; campos além de titulo/publicado são 400 (E-27/P-17)', async () => {
    const professor = await criarUsuarioComSessao('professor')
    const invalidos: object[] = [{}, { titulo: '' }, { titulo: '   ' }, { titulo: 123 }]
    for (const corpo of invalidos) {
      const resposta = await professor.agente.post('/api/v1/cursos').send(corpo)
      expect(resposta.status, JSON.stringify(corpo)).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }

    const { cursoId, moduloId, aulaId } = await criarHierarquia(professor.agente)
    const patchesInvalidos: object[] = [{}, { descricao: 'x' }, { publicado: 'sim' }]
    const rotasPatch = [
      `/api/v1/cursos/${cursoId}`,
      `/api/v1/modulos/${moduloId}`,
      `/api/v1/aulas/${aulaId}`,
    ]
    for (const rota of rotasPatch) {
      for (const corpo of patchesInvalidos) {
        const resposta = await professor.agente.patch(rota).send(corpo)
        expect(resposta.status, `${rota} ${JSON.stringify(corpo)}`).toBe(400)
        expect(resposta.body.erro.codigo).toBe('validacao')
      }
    }

    const editado = await professor.agente
      .patch(`/api/v1/cursos/${cursoId}`)
      .send({ titulo: 'Titulo longo '.repeat(10), publicado: true })
    expect(editado.status).toBe(200)
    expect(editado.body.publicado).toBe(true)
  })
})
