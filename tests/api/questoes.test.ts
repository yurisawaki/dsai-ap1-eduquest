import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { api, criarUsuarioComSessao } from '../utilidades/aplicacao'

type Agente = ReturnType<typeof request.agent>

const MULTIPLA = {
  tipo: 'multipla_escolha',
  enunciado: 'Quais sao primos?',
  explicacao: '2 e 3 sao primos; 4 nao.',
  alternativas: [
    { texto: '2', correta: true },
    { texto: '3', correta: true },
    { texto: '4', correta: false },
  ],
}
const VERDADEIRO_FALSO = { tipo: 'verdadeiro_falso', enunciado: 'A Terra e plana.', gabarito: { valor: false } }
const NUMERICA = { tipo: 'numerica', enunciado: 'Quanto e pi?', gabarito: { valor: 3.14, tolerancia: 0.01 } }
const DISSERTATIVA = { tipo: 'dissertativa', enunciado: 'Explique a fotossintese.' }

async function criarModuloProprio() {
  const professor = await criarUsuarioComSessao('professor')
  const curso = await professor.agente.post('/api/v1/cursos').send({ titulo: 'Curso' })
  const modulo = await professor.agente
    .post(`/api/v1/cursos/${curso.body.cursoId}/modulos`)
    .send({ titulo: 'Modulo' })
  return {
    professor,
    cursoId: curso.body.cursoId as string,
    moduloId: modulo.body.moduloId as string,
  }
}

async function criarQuestao(agente: Agente, moduloId: string, corpo: object) {
  return agente.post(`/api/v1/modulos/${moduloId}/questoes`).send(corpo)
}

// questão publicada em módulo e curso publicados, pronta para o estudante responder
async function questaoPublicada(corpo: object) {
  const base = await criarModuloProprio()
  const criada = await criarQuestao(base.professor.agente, base.moduloId, corpo)
  const questaoId = criada.body.questaoId as string
  await base.professor.agente.patch(`/api/v1/cursos/${base.cursoId}`).send({ publicado: true })
  await base.professor.agente.patch(`/api/v1/modulos/${base.moduloId}`).send({ publicado: true })
  await base.professor.agente.patch(`/api/v1/questoes/${questaoId}`).send({ publicado: true })
  const estudante = await criarUsuarioComSessao('estudante')
  const autorizada = await base.professor.agente.get(`/api/v1/questoes/${questaoId}`)
  return { ...base, questaoId, estudante, questaoDoDono: autorizada.body }
}

function responder(agente: Agente, questaoId: string, corpo: unknown) {
  return agente.post(`/api/v1/questoes/${questaoId}/tentativas`).send(corpo as object)
}

describe('T3.2 — questões e gabarito protegido (F3-01–F3-05, SPEC D4)', () => {
  it('TQ-01: cria questão dos 4 tipos em rascunho; tipo fora do conjunto → 400', async () => {
    const { professor, moduloId } = await criarModuloProprio()
    for (const corpo of [MULTIPLA, VERDADEIRO_FALSO, NUMERICA, DISSERTATIVA]) {
      const resposta = await criarQuestao(professor.agente, moduloId, corpo)
      expect(resposta.status, corpo.tipo).toBe(201)
      expect(resposta.body).toEqual({ questaoId: expect.any(String) })
      const lida = await professor.agente.get(`/api/v1/questoes/${resposta.body.questaoId}`)
      expect(lida.body).toMatchObject({ tipo: corpo.tipo, publicado: false, moduloId })
    }
    expect((await criarQuestao(professor.agente, moduloId, { ...DISSERTATIVA, tipo: 'ordenacao' })).status).toBe(400)
    expect((await criarQuestao(professor.agente, moduloId, { ...DISSERTATIVA, enunciado: '   ' })).status).toBe(400)
    expect((await criarQuestao(professor.agente, moduloId, { ...DISSERTATIVA, explicacao: '' })).status).toBe(400)
    expect((await criarQuestao(professor.agente, moduloId, { ...DISSERTATIVA, extra: 1 })).status).toBe(400)
  })

  it('TQ-02: múltipla escolha exige 2–10 alternativas e ao menos uma correta; sem gabarito', async () => {
    const { professor, moduloId } = await criarModuloProprio()
    const alternativa = (correta: boolean) => ({ texto: 'x', correta })
    const invalidos = [
      { ...MULTIPLA, alternativas: [alternativa(true)] },
      { ...MULTIPLA, alternativas: Array.from({ length: 11 }, () => alternativa(true)) },
      { ...MULTIPLA, alternativas: [alternativa(false), alternativa(false)] },
      { ...MULTIPLA, alternativas: [{ texto: 'x', correta: 'sim' }, alternativa(true)] },
      { ...MULTIPLA, alternativas: [{ texto: 'x'.repeat(1_001), correta: true }, alternativa(false)] },
      { ...MULTIPLA, gabarito: { valor: true } },
      { tipo: 'multipla_escolha', enunciado: 'sem alternativas' },
    ]
    for (const corpo of invalidos) {
      expect((await criarQuestao(professor.agente, moduloId, corpo)).status, JSON.stringify(corpo).slice(0, 80)).toBe(400)
    }
    const dez = { ...MULTIPLA, alternativas: Array.from({ length: 10 }, (_v, i) => alternativa(i === 0)) }
    expect((await criarQuestao(professor.agente, moduloId, dez)).status).toBe(201)
  })

  it('TQ-03/TQ-04: gabarito de V/F e numérica validado; dissertativa sem gabarito nem alternativas', async () => {
    const { professor, moduloId } = await criarModuloProprio()
    const invalidos = [
      { ...VERDADEIRO_FALSO, gabarito: { valor: 'falso' } },
      { tipo: 'verdadeiro_falso', enunciado: 'sem gabarito' },
      { ...NUMERICA, gabarito: { valor: 1, tolerancia: -0.1 } },
      { ...NUMERICA, gabarito: { valor: '1', tolerancia: 0 } },
      { ...NUMERICA, gabarito: { valor: 1 } },
      { ...NUMERICA, alternativas: MULTIPLA.alternativas },
      { ...DISSERTATIVA, gabarito: { valor: true } },
      { ...DISSERTATIVA, alternativas: MULTIPLA.alternativas },
    ]
    for (const corpo of invalidos) {
      expect((await criarQuestao(professor.agente, moduloId, corpo)).status, JSON.stringify(corpo)).toBe(400)
    }
  })

  it('TQ-05: autoria — 401 sem sessão, 404 módulo inexistente, 403 não-dono e estudante; admin pode', async () => {
    const { professor, moduloId } = await criarModuloProprio()
    const outro = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')
    const criada = await criarQuestao(professor.agente, moduloId, DISSERTATIVA)
    const rota = `/api/v1/questoes/${criada.body.questaoId}`

    expect((await api.post(`/api/v1/modulos/${moduloId}/questoes`).send(DISSERTATIVA)).status).toBe(401)
    expect((await criarQuestao(outro.agente, randomUUID(), DISSERTATIVA)).status).toBe(404)
    for (const agente of [outro.agente, estudante.agente]) {
      expect((await criarQuestao(agente, moduloId, DISSERTATIVA)).status).toBe(403)
      expect((await agente.patch(rota).send({ enunciado: 'x' })).status).toBe(403)
      expect((await agente.delete(rota)).status).toBe(403)
    }
    expect((await outro.agente.patch(`/api/v1/questoes/${randomUUID()}`).send({})).status).toBe(404)
    expect((await criarQuestao(admin.agente, moduloId, DISSERTATIVA)).status).toBe(201)
    expect((await admin.agente.patch(rota).send({ enunciado: 'pelo admin' })).status).toBe(200)
  })

  it('TQ-06: estudante só vê questão publicada em módulo e curso publicados; dono e admin veem tudo', async () => {
    const { professor, cursoId, moduloId } = await criarModuloProprio()
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')
    const criada = await criarQuestao(professor.agente, moduloId, DISSERTATIVA)
    const rota = `/api/v1/questoes/${criada.body.questaoId}`
    const lista = `/api/v1/modulos/${moduloId}/questoes`

    expect((await estudante.agente.get(rota)).status).toBe(404)
    expect((await estudante.agente.get(lista)).status).toBe(404)
    expect((await professor.agente.get(rota)).status).toBe(200)
    expect((await admin.agente.get(lista)).body).toHaveLength(1)

    await professor.agente.patch(rota).send({ publicado: true })
    await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
    expect((await estudante.agente.get(rota)).status).toBe(404)

    await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
    expect((await estudante.agente.get(rota)).status).toBe(200)
    await criarQuestao(professor.agente, moduloId, DISSERTATIVA)
    expect((await estudante.agente.get(lista)).body).toHaveLength(1)
    expect((await professor.agente.get(lista)).body).toHaveLength(2)
  })

  it('TQ-07: leitura do estudante não contém correta, gabarito nem explicação; o dono vê tudo', async () => {
    const multipla = await questaoPublicada(MULTIPLA)
    const doEstudante = await multipla.estudante.agente.get(`/api/v1/questoes/${multipla.questaoId}`)
    expect(doEstudante.status).toBe(200)
    expect(doEstudante.body).not.toHaveProperty('explicacao')
    expect(doEstudante.body).not.toHaveProperty('gabarito')
    expect(doEstudante.body.alternativas).toHaveLength(3)
    for (const alternativa of doEstudante.body.alternativas) {
      expect(Object.keys(alternativa).sort()).toEqual(['id', 'posicao', 'texto'])
    }
    expect(multipla.questaoDoDono.explicacao).toBe(MULTIPLA.explicacao)
    expect(multipla.questaoDoDono.alternativas.map((a: { correta: boolean }) => a.correta)).toEqual([true, true, false])

    const numerica = await questaoPublicada(NUMERICA)
    const lista = await numerica.estudante.agente.get(`/api/v1/modulos/${numerica.moduloId}/questoes`)
    expect(lista.body[0]).not.toHaveProperty('gabarito')
    expect(numerica.questaoDoDono.gabarito).toEqual(NUMERICA.gabarito)
  })

  it('TQ-15: PATCH não aceita tipo; alternativas/gabarito só no tipo certo; editar gabarito não recalcula tentativas', async () => {
    const { professor, questaoId, estudante } = await questaoPublicada(VERDADEIRO_FALSO)
    const rota = `/api/v1/questoes/${questaoId}`
    expect((await professor.agente.patch(rota).send({ tipo: 'numerica' })).status).toBe(400)
    expect((await professor.agente.patch(rota).send({})).status).toBe(400)
    expect((await professor.agente.patch(rota).send({ alternativas: MULTIPLA.alternativas })).status).toBe(400)

    const antes = await responder(estudante.agente, questaoId, { valor: false })
    expect(antes.body.acerto).toBe(true)
    const editada = await professor.agente.patch(rota).send({ gabarito: { valor: true } })
    expect(editada.status).toBe(200)
    expect(editada.body.gabarito).toEqual({ valor: true })
    const registro = await prisma.tentativa.findUnique({ where: { id: antes.body.tentativaId } })
    expect(registro?.acerto).toBe(true)
    expect((await responder(estudante.agente, questaoId, { valor: false })).body.acerto).toBe(false)

    const multipla = await questaoPublicada(MULTIPLA)
    const trocadas = await multipla.professor.agente
      .patch(`/api/v1/questoes/${multipla.questaoId}`)
      .send({ alternativas: [{ texto: 'a', correta: false }, { texto: 'b', correta: true }] })
    expect(trocadas.status).toBe(200)
    expect(trocadas.body.alternativas.map((a: { texto: string; posicao: number }) => `${a.posicao}:${a.texto}`)).toEqual(['0:a', '1:b'])
    expect((await multipla.professor.agente.patch(`/api/v1/questoes/${multipla.questaoId}`).send({ gabarito: { valor: true } })).status).toBe(400)
  })

  it('TQ-16: excluir questão, módulo ou curso remove questões, alternativas e tentativas (CASCADE)', async () => {
    const primeira = await questaoPublicada(MULTIPLA)
    const correta = primeira.questaoDoDono.alternativas.filter((a: { correta: boolean }) => a.correta).map((a: { id: string }) => a.id)
    await responder(primeira.estudante.agente, primeira.questaoId, { alternativas: correta })
    expect((await primeira.professor.agente.delete(`/api/v1/questoes/${primeira.questaoId}`)).status).toBe(204)
    expect(await prisma.alternativa.count({ where: { questao_id: primeira.questaoId } })).toBe(0)
    expect(await prisma.tentativa.count({ where: { questao_id: primeira.questaoId } })).toBe(0)
    expect((await primeira.professor.agente.get(`/api/v1/questoes/${primeira.questaoId}`)).status).toBe(404)

    const segunda = await questaoPublicada(DISSERTATIVA)
    await responder(segunda.estudante.agente, segunda.questaoId, { texto: 'resposta' })
    expect((await segunda.professor.agente.delete(`/api/v1/cursos/${segunda.cursoId}`)).status).toBe(204)
    expect(await prisma.questao.count({ where: { id: segunda.questaoId } })).toBe(0)
    expect(await prisma.tentativa.count({ where: { questao_id: segunda.questaoId } })).toBe(0)
  })
})

describe('T3.3 — tentativas e feedback imediato (F3-06, SPEC D4)', () => {
  it('TQ-08: múltipla escolha só acerta com o conjunto exato; alternativa alheia → 400', async () => {
    const { questaoId, estudante, questaoDoDono } = await questaoPublicada(MULTIPLA)
    const [dois, tres, quatro] = questaoDoDono.alternativas.map((a: { id: string }) => a.id)
    expect((await responder(estudante.agente, questaoId, { alternativas: [tres, dois] })).body.acerto).toBe(true)
    expect((await responder(estudante.agente, questaoId, { alternativas: [dois] })).body.acerto).toBe(false)
    expect((await responder(estudante.agente, questaoId, { alternativas: [dois, tres, quatro] })).body.acerto).toBe(false)

    const outra = await questaoPublicada(MULTIPLA)
    const alheia = outra.questaoDoDono.alternativas[0].id
    for (const corpo of [
      { alternativas: [alheia] },
      { alternativas: [] },
      { alternativas: [dois, dois] },
      { valor: true },
    ]) {
      expect((await responder(estudante.agente, questaoId, corpo)).status, JSON.stringify(corpo)).toBe(400)
    }
  })

  it('TQ-09: verdadeiro/falso por igualdade; numérica dentro da tolerância; tolerância 0 exige igualdade', async () => {
    const vf = await questaoPublicada(VERDADEIRO_FALSO)
    expect((await responder(vf.estudante.agente, vf.questaoId, { valor: false })).body.acerto).toBe(true)
    expect((await responder(vf.estudante.agente, vf.questaoId, { valor: true })).body.acerto).toBe(false)
    expect((await responder(vf.estudante.agente, vf.questaoId, { valor: 'false' })).status).toBe(400)

    const num = await questaoPublicada(NUMERICA)
    expect((await responder(num.estudante.agente, num.questaoId, { valor: 3.145 })).body.acerto).toBe(true)
    expect((await responder(num.estudante.agente, num.questaoId, { valor: 3.2 })).body.acerto).toBe(false)
    expect((await responder(num.estudante.agente, num.questaoId, { valor: '3.14' })).status).toBe(400)

    const exata = await questaoPublicada({ ...NUMERICA, gabarito: { valor: 42, tolerancia: 0 } })
    expect((await responder(exata.estudante.agente, exata.questaoId, { valor: 42 })).body.acerto).toBe(true)
    expect((await responder(exata.estudante.agente, exata.questaoId, { valor: 42.0001 })).body.acerto).toBe(false)
  })

  it('TQ-10: dissertativa registra com acerto null; texto vazio ou acima de 20.000 → 400', async () => {
    const { questaoId, estudante } = await questaoPublicada(DISSERTATIVA)
    const resposta = await responder(estudante.agente, questaoId, { texto: 'Luz vira energia quimica.' })
    expect(resposta.status).toBe(201)
    expect(resposta.body.acerto).toBeNull()
    expect((await responder(estudante.agente, questaoId, { texto: '  \n ' })).status).toBe(400)
    expect((await responder(estudante.agente, questaoId, { texto: 'a'.repeat(20_001) })).status).toBe(400)
    expect((await responder(estudante.agente, questaoId, { texto: 'a'.repeat(20_000) })).status).toBe(201)
  })

  it('TQ-11/TQ-13: cada envio válido grava uma tentativa com resposta e acerto do servidor; acerto do cliente → 400', async () => {
    const { questaoId, estudante } = await questaoPublicada(VERDADEIRO_FALSO)
    const primeira = await responder(estudante.agente, questaoId, { valor: true })
    const segunda = await responder(estudante.agente, questaoId, { valor: false })
    expect(primeira.status).toBe(201)
    expect(segunda.status).toBe(201)
    expect((await responder(estudante.agente, questaoId, { valor: true, acerto: true })).status).toBe(400)

    const registros = await prisma.tentativa.findMany({ where: { questao_id: questaoId }, orderBy: { criado_em: 'asc' } })
    expect(registros.map((r) => [r.resposta, r.acerto])).toEqual([
      [{ valor: true }, false],
      [{ valor: false }, true],
    ])
    expect(registros.every((r) => r.usuario_id === registros[0].usuario_id)).toBe(true)
  })

  it('TQ-12: professor e admin não respondem (403); questão não visível → 404; sem sessão → 401', async () => {
    const { professor, questaoId, moduloId } = await questaoPublicada(VERDADEIRO_FALSO)
    const admin = await criarUsuarioComSessao('administrador')
    const estudante = await criarUsuarioComSessao('estudante')
    expect((await responder(professor.agente, questaoId, { valor: true })).status).toBe(403)
    expect((await responder(admin.agente, questaoId, { valor: true })).status).toBe(403)
    expect((await api.post(`/api/v1/questoes/${questaoId}/tentativas`).send({ valor: true })).status).toBe(401)
    expect((await responder(estudante.agente, randomUUID(), { valor: true })).status).toBe(404)

    const rascunho = await criarQuestao(professor.agente, moduloId, VERDADEIRO_FALSO)
    expect((await responder(estudante.agente, rascunho.body.questaoId, { valor: false })).status).toBe(404)
  })

  it('TQ-14: feedback traz acerto e explicação, nunca o gabarito', async () => {
    const multipla = await questaoPublicada(MULTIPLA)
    const resposta = await responder(multipla.estudante.agente, multipla.questaoId, {
      alternativas: [multipla.questaoDoDono.alternativas[2].id],
    })
    expect(resposta.status).toBe(201)
    expect(resposta.body).toEqual({
      tentativaId: expect.any(String),
      acerto: false,
      feedback: { explicacao: MULTIPLA.explicacao },
      // campo aditivo de D7 (§6.3)
      xp: { ganho: 0, total: 0, nivel: 1, subiuNivel: false },
      conquistas: [], // campo aditivo de D8 (§6.3)
    })

    const semExplicacao = await questaoPublicada(NUMERICA)
    const numerica = await responder(semExplicacao.estudante.agente, semExplicacao.questaoId, { valor: 1 })
    expect(numerica.body).toEqual({
      tentativaId: expect.any(String),
      acerto: false,
      feedback: { explicacao: null },
      // campo aditivo de D7 (§6.3)
      xp: { ganho: 0, total: expect.any(Number), nivel: expect.any(Number), subiuNivel: false },
      conquistas: [],
    })
    expect(JSON.stringify(numerica.body)).not.toContain('3.14')
  })
})
