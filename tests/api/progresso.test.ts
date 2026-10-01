import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { api, criarUsuarioComSessao } from '../utilidades/aplicacao'
import { prisma } from '../../src/server/prisma'

type Agente = ReturnType<typeof request.agent>

async function criarCursoPublicado(opcoes: { aulasNoModulo1?: number } = {}) {
  const professor = await criarUsuarioComSessao('professor')
  const aulasNoModulo1 = opcoes.aulasNoModulo1 ?? 2
  const curso = await professor.agente.post('/api/v1/cursos').send({ titulo: 'Progresso' })
  const cursoId = curso.body.cursoId as string
  const modulo1 = await professor.agente
    .post(`/api/v1/cursos/${cursoId}/modulos`)
    .send({ titulo: 'Modulo 1' })
  const modulo2 = await professor.agente
    .post(`/api/v1/cursos/${cursoId}/modulos`)
    .send({ titulo: 'Modulo 2' })
  const aulasModulo1: string[] = []
  for (let indice = 1; indice <= aulasNoModulo1; indice += 1) {
    const aula = await professor.agente
      .post(`/api/v1/modulos/${modulo1.body.moduloId}/aulas`)
      .send({ titulo: `Aula M1-${indice}` })
    aulasModulo1.push(aula.body.aulaId as string)
  }
  const aulaM2 = await professor.agente
    .post(`/api/v1/modulos/${modulo2.body.moduloId}/aulas`)
    .send({ titulo: 'Aula M2-1' })
  const publicar = async (rota: string) => {
    await professor.agente.patch(rota).send({ publicado: true })
  }
  await publicar(`/api/v1/cursos/${cursoId}`)
  await publicar(`/api/v1/modulos/${modulo1.body.moduloId}`)
  await publicar(`/api/v1/modulos/${modulo2.body.moduloId}`)
  for (const aulaId of aulasModulo1) await publicar(`/api/v1/aulas/${aulaId}`)
  await publicar(`/api/v1/aulas/${aulaM2.body.aulaId}`)
  return {
    professor,
    cursoId,
    modulo1Id: modulo1.body.moduloId as string,
    modulo2Id: modulo2.body.moduloId as string,
    aulasModulo1,
    aulaM2Id: aulaM2.body.aulaId as string,
    totalAulas: aulasNoModulo1 + 1,
  }
}

async function concluir(agente: Agente, aulaId: string) {
  return agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
}

describe('T4.2 — progresso de aprendizagem derivado de conclusões (D6, AC-D6-6–AC-D6-12)', () => {
  it('AC-D6-6: aula devolve concluida=false, vira true após POST e persiste em nova requisição', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { cursoId, aulasModulo1 } = await criarCursoPublicado()
    const aulaId = aulasModulo1[0]

    const antes = await estudante.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(antes.status).toBe(200)
    expect(antes.body.concluida).toBe(false)
    expect(Object.keys(antes.body).sort()).toEqual([
      'concluida',
      'conteudo',
      'id',
      'publicado',
      'titulo',
    ])

    const primeira = await concluir(estudante.agente, aulaId)
    expect(primeira.status).toBe(201)

    const depois = await estudante.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(depois.body.concluida).toBe(true)

    const novaSessao = await estudante.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(novaSessao.body.concluida).toBe(true)
  })

  it('AC-D6-7: repetição é idempotente (201, depois 200 com a mesma data) e nunca duplica o registro', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { aulasModulo1 } = await criarCursoPublicado()
    const aulaId = aulasModulo1[0]

    const primeira = await concluir(estudante.agente, aulaId)
    expect(primeira.status).toBe(201)

    const repeticao = await concluir(estudante.agente, aulaId)
    expect(repeticao.status).toBe(200)
    expect(repeticao.body.concluidaEm).toBe(primeira.body.concluidaEm)

    const total = await prisma.conclusaoAula.count({
      where: { aula_id: aulaId, usuario_id: estudante.id },
    })
    expect(total).toBe(1)
  })

  it('AC-D6-7: dois POSTs simultâneos geram um 201 e um 200, com uma única conclusão no banco', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { aulasModulo1 } = await criarCursoPublicado()
    const aulaId = aulasModulo1[0]

    const [primeira, segunda] = await Promise.all([
      concluir(estudante.agente, aulaId),
      concluir(estudante.agente, aulaId),
    ])
    expect([primeira.status, segunda.status].sort()).toEqual([200, 201])
    expect(primeira.body.concluidaEm).toBe(segunda.body.concluidaEm)

    const total = await prisma.conclusaoAula.count({
      where: { aula_id: aulaId, usuario_id: estudante.id },
    })
    expect(total).toBe(1)
  })

  it('AC-D6-8: progresso do curso e dos módulos usa floor (1 de 3 = 33%) e chega a 100%', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { cursoId, modulo1Id, modulo2Id, aulasModulo1, aulaM2Id } =
      await criarCursoPublicado()

    const inicial = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(inicial.status).toBe(200)
    expect(inicial.body.progresso).toEqual({
      aulasConcluidas: 0,
      aulasTotal: 3,
      percentual: 0,
      modulos: [
        { moduloId: modulo1Id, aulasConcluidas: 0, aulasTotal: 2, percentual: 0 },
        { moduloId: modulo2Id, aulasConcluidas: 0, aulasTotal: 1, percentual: 0 },
      ],
    })

    await concluir(estudante.agente, aulasModulo1[0])
    const comUma = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(comUma.body.progresso.aulasConcluidas).toBe(1)
    expect(comUma.body.progresso.aulasTotal).toBe(3)
    expect(comUma.body.progresso.percentual).toBe(33)
    expect(comUma.body.progresso.modulos[0]).toEqual({
      moduloId: modulo1Id,
      aulasConcluidas: 1,
      aulasTotal: 2,
      percentual: 50,
    })

    await concluir(estudante.agente, aulasModulo1[1])
    await concluir(estudante.agente, aulaM2Id)
    const completa = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(completa.body.progresso).toEqual({
      aulasConcluidas: 3,
      aulasTotal: 3,
      percentual: 100,
      modulos: [
        { moduloId: modulo1Id, aulasConcluidas: 2, aulasTotal: 2, percentual: 100 },
        { moduloId: modulo2Id, aulasConcluidas: 1, aulasTotal: 1, percentual: 100 },
      ],
    })
  })

  it('AC-D6-8: curso sem aulas visíveis devolve percentual 0, sem divisão por zero', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const professor = await criarUsuarioComSessao('professor')
    const curso = await professor.agente.post('/api/v1/cursos').send({ titulo: 'Vazio' })
    await professor.agente.patch(`/api/v1/cursos/${curso.body.cursoId}`).send({ publicado: true })

    const resposta = await estudante.agente.get(`/api/v1/cursos/${curso.body.cursoId}`)
    expect(resposta.status).toBe(200)
    expect(resposta.body.progresso).toEqual({
      aulasConcluidas: 0,
      aulasTotal: 0,
      percentual: 0,
      modulos: [],
    })
  })

  it('AC-D6-9: rascunhos (módulo ou aula) ficam fora do denominador do progresso', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { professor, cursoId, modulo1Id } = await criarCursoPublicado()

    const moduloRascunho = await professor.agente
      .post(`/api/v1/cursos/${cursoId}/modulos`)
      .send({ titulo: 'Modulo rascunho' })
    await professor.agente
      .post(`/api/v1/modulos/${moduloRascunho.body.moduloId}/aulas`)
      .send({ titulo: 'Aula oculta' })
    await professor.agente
      .post(`/api/v1/modulos/${modulo1Id}/aulas`)
      .send({ titulo: 'Aula rascunho' })

    const resposta = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(resposta.body.progresso.aulasTotal).toBe(3)
    expect(resposta.body.progresso.modulos).toHaveLength(2)
    expect(resposta.body.progresso.modulos[0].aulasTotal).toBe(2)
  })

  it('AC-D6-9/R-D6-4: aula despublicada sai do cálculo sem apagar a conclusão e volta ao recalcular', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const { professor, cursoId, aulasModulo1 } = await criarCursoPublicado()
    const aulaId = aulasModulo1[0]

    await concluir(estudante.agente, aulaId)
    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: false })

    const semAula = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(semAula.body.progresso.aulasTotal).toBe(2)
    expect(semAula.body.progresso.aulasConcluidas).toBe(0)
    expect(semAula.body.progresso.percentual).toBe(0)

    await professor.agente.patch(`/api/v1/aulas/${aulaId}`).send({ publicado: true })
    const comAula = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(comAula.body.progresso.aulasTotal).toBe(3)
    expect(comAula.body.progresso.aulasConcluidas).toBe(1)
    expect(comAula.body.progresso.percentual).toBe(33)

    const registro = await prisma.conclusaoAula.findFirst({
      where: { aula_id: aulaId, usuario_id: estudante.id },
    })
    expect(registro).not.toBeNull()
  })

  it('AC-D6-10: progresso é isolado por usuário e usuarioId do corpo é ignorado (vem da sessão)', async () => {
    const estudanteA = await criarUsuarioComSessao('estudante')
    const estudanteB = await criarUsuarioComSessao('estudante')
    const { cursoId, aulasModulo1 } = await criarCursoPublicado()
    const aulaId = aulasModulo1[0]

    await concluir(estudanteA.agente, aulaId)

    const respostaB = await estudanteB.agente
      .post(`/api/v1/aulas/${aulaId}/conclusao`)
      .send({ usuarioId: estudanteA.id, concluidaEm: '2020-01-01T00:00:00.000Z' })
    expect(respostaB.status).toBe(201)
    expect(new Date(respostaB.body.concluidaEm).getTime()).toBeGreaterThan(
      new Date('2021-01-01').getTime()
    )

    const progressoB = await estudanteB.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(progressoB.body.progresso.aulasConcluidas).toBe(1)

    const progressoA = await estudanteA.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(progressoA.body.progresso.aulasConcluidas).toBe(1)

    const aulaDeB = await estudanteB.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(aulaDeB.body.concluida).toBe(true)

    const outro = await criarUsuarioComSessao('estudante')
    const aulaDeOutro = await outro.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(aulaDeOutro.body.concluida).toBe(false)
    const progressoDeOutro = await outro.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(progressoDeOutro.body.progresso.aulasConcluidas).toBe(0)
  })

  it('AC-D6-11: sem sessão 401; aula inexistente ou rascunho 404; professor não conclui (403)', async () => {
    const { professor, cursoId, aulasModulo1 } = await criarCursoPublicado()
    const aulaId = aulasModulo1[0]

    const semSessao = await api.get(`/api/v1/aulas/${aulaId}`)
    expect(semSessao.status).toBe(401)
    expect(semSessao.body.erro.codigo).toBe('nao_autenticado')
    const cursoSemSessao = await api.get(`/api/v1/cursos/${cursoId}`)
    expect(cursoSemSessao.status).toBe(401)

    const estudante = await criarUsuarioComSessao('estudante')
    const inexistente = await estudante.agente.get(`/api/v1/aulas/${randomUUID()}`)
    expect(inexistente.status).toBe(404)
    expect(inexistente.body.erro.codigo).toBe('nao_encontrado')

    const conclusaoDesconhecida = await estudante.agente
      .post(`/api/v1/aulas/${randomUUID()}/conclusao`)
      .send({})
    expect(conclusaoDesconhecida.status).toBe(404)

    const professorConcluindo = await concluir(professor.agente, aulaId)
    expect(professorConcluindo.status).toBe(403)
    expect(professorConcluindo.body.erro.codigo).toBe('proibido')
  })

  it('AC-D6-12: progresso só existe para o papel estudante; aula sempre expõe concluida', async () => {
    const { professor, cursoId, aulasModulo1 } = await criarCursoPublicado()
    const admin = await criarUsuarioComSessao('administrador')
    const aulaId = aulasModulo1[0]

    const doProfessor = await professor.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(doProfessor.status).toBe(200)
    expect('progresso' in doProfessor.body).toBe(false)

    const doAdmin = await admin.agente.get(`/api/v1/cursos/${cursoId}`)
    expect(doAdmin.status).toBe(200)
    expect('progresso' in doAdmin.body).toBe(false)

    const aulaDoProfessor = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(aulaDoProfessor.body.concluida).toBe(false)

    const estudante = await criarUsuarioComSessao('estudante')
    const doEstudante = await estudante.agente.get(`/api/v1/cursos/${cursoId}`)
    expect('progresso' in doEstudante.body).toBe(true)
    expect(doEstudante.body.progresso.aulasTotal).toBe(3)
  })
})
