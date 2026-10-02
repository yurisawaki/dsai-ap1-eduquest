import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { criarUsuarioComSessao } from '../utilidades/aplicacao'

async function criarCadeiaPublicada() {
  const professor = await criarUsuarioComSessao('professor')
  const curso = await professor.agente.post('/api/v1/cursos').send({ titulo: 'Curso' })
  const modulo = await professor.agente
    .post(`/api/v1/cursos/${curso.body.cursoId}/modulos`)
    .send({ titulo: 'Modulo' })
  const aula = await professor.agente
    .post(`/api/v1/modulos/${modulo.body.moduloId}/aulas`)
    .send({ titulo: 'Aula' })
  return {
    professor,
    cursoId: curso.body.cursoId as string,
    moduloId: modulo.body.moduloId as string,
    aulaId: aula.body.aulaId as string,
  }
}

describe('T2.5 — consumo e conclusão de aula (F2-14, E-21–E-23)', () => {
  it('conclusão exige papel estudante: professor e admin recebem 403 (E-21/R-15)', async () => {
    const { professor, cursoId, moduloId, aulaId } = await criarCadeiaPublicada()
    await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })
    const admin = await criarUsuarioComSessao('administrador')

    for (const agente of [professor.agente, admin.agente]) {
      const resposta = await agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
      expect(resposta.status).toBe(403)
      expect(resposta.body.erro.codigo).toBe('proibido')
    }
  })

  it('aula inexistente ou fora da cadeia publicada responde 404 para estudante (E-22/R-14/R-17)', async () => {
    const estudante = await criarUsuarioComSessao('estudante')

    const inexistente = await estudante.agente
      .post(`/api/v1/aulas/${randomUUID()}/conclusao`)
      .send({})
    expect(inexistente.status).toBe(404)
    expect(inexistente.body.erro.codigo).toBe('nao_encontrado')

    const invalido = await estudante.agente
      .post('/api/v1/aulas/nao-e-uuid/conclusao')
      .send({})
    expect(invalido.status).toBe(404)

    const { professor, cursoId, moduloId, aulaId } = await criarCadeiaPublicada()
    const rascunho = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(rascunho.status).toBe(404)

    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })
    const semModulo = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(semModulo.status).toBe(404)

    await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
    const semCurso = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(semCurso.status).toBe(404)

    await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
    const sucesso = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(sucesso.status).toBe(201)
  })

  it('corpo malformado responde 400 (F2-14)', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { professor, cursoId, moduloId, aulaId } = await criarCadeiaPublicada()
    await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })

    const malformado = await estudante.agente
      .post(`/api/v1/aulas/${aulaId}/conclusao`)
      .set('Content-Type', 'application/json')
      .send('{invalido')
    expect(malformado.status).toBe(400)
    expect(malformado.body.erro.codigo).toBe('validacao')
  })

  it('sucesso devolve 201 {aulaId, concluidaEm} com data ISO (F2-14/AC-08)', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { professor, cursoId, moduloId, aulaId } = await criarCadeiaPublicada()
    await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })

    const resposta = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(resposta.status).toBe(201)
    expect(Object.keys(resposta.body).sort()).toEqual(['aulaId', 'concluidaEm', 'conquistas', 'xp']) // campos aditivos de D7/D8 (§6.3)
    expect(resposta.body.aulaId).toBe(aulaId)
    expect(new Date(resposta.body.concluidaEm).toISOString()).toBe(resposta.body.concluidaEm)
  })

  it('repetição não dá 5xx e preserva a primeira concluidaEm (E-23/AC-09/P-14)', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { professor, cursoId, moduloId, aulaId } = await criarCadeiaPublicada()
    await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })

    const primeira = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(primeira.status).toBe(201)

    const repeticao = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(repeticao.status).toBeLessThan(500)
    expect(repeticao.status).toBeGreaterThanOrEqual(200)
    expect(repeticao.body.concluidaEm).toBe(primeira.body.concluidaEm)
    expect(repeticao.body.aulaId).toBe(primeira.body.aulaId)

    const terceira = await estudante.agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
    expect(terceira.body.concluidaEm).toBe(primeira.body.concluidaEm)
    expect(terceira.status).toBeLessThan(500)
  })

  it('conclusão é por estudante: outro estudante da mesma aula registra o próprio evento', async () => {
    const outroEstudante = await criarUsuarioComSessao('estudante')
    const { professor, cursoId, moduloId, aulaId } = await criarCadeiaPublicada()
    await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })

    const resposta = await outroEstudante.agente
      .post(`/api/v1/aulas/${aulaId}/conclusao`)
      .send({})
    expect(resposta.status).toBe(201)
    expect(resposta.body.aulaId).toBe(aulaId)
  })
})
