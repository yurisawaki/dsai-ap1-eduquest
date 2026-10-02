import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { api, criarUsuarioComSessao } from '../utilidades/aplicacao'

type Agente = ReturnType<typeof request.agent>

const HORA = 60 * 60 * 1000
const janelaAberta = () => ({
  abreEm: new Date(Date.now() - HORA).toISOString(),
  fechaEm: new Date(Date.now() + HORA).toISOString(),
})
const janelaFutura = () => ({
  abreEm: new Date(Date.now() + HORA).toISOString(),
  fechaEm: new Date(Date.now() + 2 * HORA).toISOString(),
})
const janelaPassada = () => ({
  abreEm: new Date(Date.now() - 2 * HORA).toISOString(),
  fechaEm: new Date(Date.now() - HORA).toISOString(),
})

const VF = { tipo: 'verdadeiro_falso', enunciado: 'O ceu e azul.', gabarito: { valor: true } }
const NUM = { tipo: 'numerica', enunciado: '2 + 2?', gabarito: { valor: 4, tolerancia: 0 } }
const DISS = { tipo: 'dissertativa', enunciado: 'Explique.', explicacao: 'Resposta esperada.' }

// curso com módulo e questões (em rascunho de D4); devolve ids das questões
async function cursoComQuestoes(corpos: object[]) {
  const professor = await criarUsuarioComSessao('professor')
  const curso = await professor.agente.post('/api/v1/cursos').send({ titulo: 'Curso' })
  const modulo = await professor.agente
    .post(`/api/v1/cursos/${curso.body.cursoId}/modulos`)
    .send({ titulo: 'Modulo' })
  const questoes: string[] = []
  for (const corpo of corpos) {
    const criada = await professor.agente
      .post(`/api/v1/modulos/${modulo.body.moduloId}/questoes`)
      .send(corpo)
    questoes.push(criada.body.questaoId)
  }
  return { professor, cursoId: curso.body.cursoId as string, moduloId: modulo.body.moduloId as string, questoes }
}

function criarAvaliacao(agente: Agente, cursoId: string, corpo: object) {
  return agente.post(`/api/v1/cursos/${cursoId}/avaliacoes`).send(corpo)
}

// avaliação publicada (curso publicado) com janela aberta, pronta para o estudante
async function avaliacaoAberta(itens: { corpo: object; peso: number }[], extra: object = {}) {
  const base = await cursoComQuestoes(itens.map((item) => item.corpo))
  const criada = await criarAvaliacao(base.professor.agente, base.cursoId, {
    titulo: 'Prova 1',
    tentativasMax: 2,
    ...janelaAberta(),
    questoes: base.questoes.map((questaoId, i) => ({ questaoId, peso: itens[i].peso })),
    ...extra,
  })
  const avaliacaoId = criada.body.avaliacaoId as string
  await base.professor.agente.patch(`/api/v1/cursos/${base.cursoId}`).send({ publicado: true })
  await base.professor.agente.patch(`/api/v1/avaliacoes/${avaliacaoId}`).send({ publicado: true })
  const estudante = await criarUsuarioComSessao('estudante')
  return { ...base, avaliacaoId, estudante }
}

function realizar(agente: Agente, avaliacaoId: string, respostas: unknown[]) {
  return agente.post(`/api/v1/avaliacoes/${avaliacaoId}/tentativas`).send({ respostas })
}

describe('T3.5 — avaliações: montagem e visibilidade (F3-07–F3-11, SPEC D5)', () => {
  it('TA-01: dono cria em rascunho; 401 sem sessão; 404 curso inexistente; 403 não-dono e estudante', async () => {
    const { professor, cursoId, questoes } = await cursoComQuestoes([VF])
    const corpo = { titulo: 'P1', tentativasMax: 1, ...janelaAberta(), questoes: [{ questaoId: questoes[0], peso: 1 }] }
    const criada = await criarAvaliacao(professor.agente, cursoId, corpo)
    expect(criada.status).toBe(201)
    expect(criada.body).toEqual({ avaliacaoId: expect.any(String) })
    const lida = await professor.agente.get(`/api/v1/avaliacoes/${criada.body.avaliacaoId}`)
    expect(lida.body).toMatchObject({ titulo: 'P1', publicado: false, cursoId, tentativasMax: 1 })

    const outro = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    expect((await api.post(`/api/v1/cursos/${cursoId}/avaliacoes`).send(corpo)).status).toBe(401)
    expect((await criarAvaliacao(outro.agente, randomUUID(), corpo)).status).toBe(404)
    expect((await criarAvaliacao(outro.agente, cursoId, corpo)).status).toBe(403)
    expect((await criarAvaliacao(estudante.agente, cursoId, corpo)).status).toBe(403)
  })

  it('TA-02: composição, pesos, janela e tentativas inválidos → 400', async () => {
    const { professor, cursoId, questoes } = await cursoComQuestoes([VF, NUM])
    const outroCurso = await cursoComQuestoes([VF])
    const base = { titulo: 'P1', tentativasMax: 1, ...janelaAberta(), questoes: [{ questaoId: questoes[0], peso: 1 }] }
    const invalidos = [
      { ...base, questoes: [] },
      { ...base, questoes: [{ questaoId: questoes[0], peso: 1 }, { questaoId: questoes[0], peso: 2 }] },
      { ...base, questoes: [{ questaoId: outroCurso.questoes[0], peso: 1 }] },
      { ...base, questoes: [{ questaoId: randomUUID(), peso: 1 }] },
      { ...base, questoes: [{ questaoId: questoes[0], peso: 0 }] },
      { ...base, questoes: [{ questaoId: questoes[0], peso: 1_000.01 }] },
      { ...base, questoes: [{ questaoId: questoes[0], peso: 1.005 }] },
      { ...base, abreEm: base.fechaEm },
      { ...base, abreEm: '2026-10-01 10:00' },
      { ...base, tentativasMax: 0 },
      { ...base, tentativasMax: 101 },
      { ...base, tentativasMax: 1.5 },
      { ...base, titulo: '  ' },
      { ...base, extra: true },
    ]
    for (const corpo of invalidos) {
      expect((await criarAvaliacao(professor.agente, cursoId, corpo)).status, JSON.stringify(corpo).slice(0, 120)).toBe(400)
    }
    const cemQuestoes = { ...base, tentativasMax: 100, questoes: [{ questaoId: questoes[0], peso: 1_000 }, { questaoId: questoes[1], peso: 0.25 }] }
    expect((await criarAvaliacao(professor.agente, cursoId, cemQuestoes)).status).toBe(201)
  })

  it('TA-03: questão em rascunho de D4 (e módulo em rascunho) pode compor a avaliação', async () => {
    const { professor, cursoId, questoes } = await cursoComQuestoes([DISS])
    const questao = await professor.agente.get(`/api/v1/questoes/${questoes[0]}`)
    expect(questao.body.publicado).toBe(false)
    const criada = await criarAvaliacao(professor.agente, cursoId, {
      titulo: 'P1', tentativasMax: 1, ...janelaAberta(), questoes: [{ questaoId: questoes[0], peso: 1 }],
    })
    expect(criada.status).toBe(201)
  })

  it('TA-04: estudante só vê avaliação publicada de curso publicado; questões só na janela e sem gabarito', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }, { corpo: DISS, peso: 1 }])
    const rota = `/api/v1/avaliacoes/${aberta.avaliacaoId}`
    const lida = await aberta.estudante.agente.get(rota)
    expect(lida.status).toBe(200)
    expect(lida.body.questoes).toHaveLength(2)
    for (const { questao, peso } of lida.body.questoes) {
      expect(peso).toBe(1)
      expect(questao).not.toHaveProperty('gabarito')
      expect(questao).not.toHaveProperty('explicacao')
    }
    expect((await aberta.estudante.agente.get(`/api/v1/cursos/${aberta.cursoId}/avaliacoes`)).body).toHaveLength(1)

    await aberta.professor.agente.patch(rota).send(janelaFutura())
    const fora = await aberta.estudante.agente.get(rota)
    expect(fora.status).toBe(200)
    expect(fora.body).not.toHaveProperty('questoes')
    expect((await aberta.professor.agente.get(rota)).body.questoes[0].questao.gabarito).toEqual({ valor: true })

    await aberta.professor.agente.patch(rota).send({ publicado: false })
    expect((await aberta.estudante.agente.get(rota)).status).toBe(404)
    await aberta.professor.agente.patch(rota).send({ publicado: true })
    await aberta.professor.agente.patch(`/api/v1/cursos/${aberta.cursoId}`).send({ publicado: false })
    expect((await aberta.estudante.agente.get(rota)).status).toBe(404)
    expect((await aberta.estudante.agente.get(`/api/v1/cursos/${aberta.cursoId}/avaliacoes`)).status).toBe(404)
  })

  it('TA-12: com tentativa, PATCH de questões → 409; demais campos continuam editáveis', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    const rota = `/api/v1/avaliacoes/${aberta.avaliacaoId}`
    const composicao = { questoes: [{ questaoId: aberta.questoes[0], peso: 2 }] }
    expect((await aberta.professor.agente.patch(rota).send(composicao)).status).toBe(200)

    await realizar(aberta.estudante.agente, aberta.avaliacaoId, [])
    expect((await aberta.professor.agente.patch(rota).send(composicao)).status).toBe(409)
    expect((await aberta.professor.agente.patch(rota).send({ questoes: 'invalido' })).status).toBe(409)
    const novaJanela = await aberta.professor.agente.patch(rota).send({ fechaEm: new Date(Date.now() + 3 * HORA).toISOString() })
    expect(novaJanela.status).toBe(200)
    expect((await aberta.professor.agente.patch(rota).send({ tentativasMax: 1 })).status).toBe(200)
    expect((await aberta.professor.agente.patch(rota).send({ abreEm: new Date(Date.now() + 4 * HORA).toISOString() })).status).toBe(400)
  })

  it('TA-14: excluir avaliação ou curso remove composição, tentativas e respostas (CASCADE)', async () => {
    const primeira = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    const envio = await realizar(primeira.estudante.agente, primeira.avaliacaoId, [{ questaoId: primeira.questoes[0], resposta: { valor: true } }])
    expect((await primeira.professor.agente.delete(`/api/v1/avaliacoes/${primeira.avaliacaoId}`)).status).toBe(204)
    expect(await prisma.avaliacaoQuestao.count({ where: { avaliacao_id: primeira.avaliacaoId } })).toBe(0)
    expect(await prisma.respostaAvaliacao.count({ where: { tentativa_id: envio.body.tentativaId } })).toBe(0)

    const segunda = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    await realizar(segunda.estudante.agente, segunda.avaliacaoId, [])
    expect((await segunda.professor.agente.delete(`/api/v1/cursos/${segunda.cursoId}`)).status).toBe(204)
    expect(await prisma.avaliacao.count({ where: { id: segunda.avaliacaoId } })).toBe(0)
    expect(await prisma.tentativaAvaliacao.count({ where: { avaliacao_id: segunda.avaliacaoId } })).toBe(0)
  })
})

describe('T3.5 — avaliações: realização, nota, correção e resultado (F3-12–F3-15, SPEC D5)', () => {
  it('TA-05: envio fora da janela ou além do limite de tentativas → 409', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }], { tentativasMax: 1 })
    expect((await realizar(aberta.estudante.agente, aberta.avaliacaoId, [])).status).toBe(201)
    expect((await realizar(aberta.estudante.agente, aberta.avaliacaoId, [])).status).toBe(409)

    const outra = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    const rota = `/api/v1/avaliacoes/${outra.avaliacaoId}`
    await outra.professor.agente.patch(rota).send(janelaFutura())
    expect((await realizar(outra.estudante.agente, outra.avaliacaoId, [])).status).toBe(409)
    await outra.professor.agente.patch(rota).send(janelaPassada())
    expect((await realizar(outra.estudante.agente, outra.avaliacaoId, [])).status).toBe(409)
  })

  it('TA-06: resposta fora da composição, repetida ou mal formada → 400; questão omitida vale 0', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }, { corpo: NUM, peso: 3 }])
    const [vf, num] = aberta.questoes
    const invalidos = [
      [{ questaoId: randomUUID(), resposta: { valor: true } }],
      [{ questaoId: vf, resposta: { valor: true } }, { questaoId: vf, resposta: { valor: false } }],
      [{ questaoId: vf, resposta: { valor: 'sim' } }],
      [{ questaoId: num, resposta: { valor: 4 }, extra: 1 }],
    ]
    for (const respostas of invalidos) {
      expect((await realizar(aberta.estudante.agente, aberta.avaliacaoId, respostas)).status, JSON.stringify(respostas)).toBe(400)
    }
    expect((await aberta.estudante.agente.post(`/api/v1/avaliacoes/${aberta.avaliacaoId}/tentativas`).send({ respostas: 'x' })).status).toBe(400)

    const parcial = await realizar(aberta.estudante.agente, aberta.avaliacaoId, [{ questaoId: vf, resposta: { valor: true } }])
    expect(parcial.body).toEqual({
      tentativaId: expect.any(String),
      status: 'corrigida',
      nota: 2.5,
      // campo aditivo de D7 (§6.3)
      xp: expect.objectContaining({ ganho: expect.any(Number) }),
      conquistas: expect.any(Array), // campo aditivo de D8 (§6.3)
    })
  })

  it('TA-07/TA-13: sem dissertativa, nota = 10 × pesos acertados ÷ pesos, 2 casas; sem gabarito nem acerto por questão', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }, { corpo: NUM, peso: 2 }])
    const [vf, num] = aberta.questoes
    const envio = await realizar(aberta.estudante.agente, aberta.avaliacaoId, [
      { questaoId: vf, resposta: { valor: true } },
      { questaoId: num, resposta: { valor: 5 } },
    ])
    expect(envio.status).toBe(201)
    expect(envio.body).toEqual({
      tentativaId: expect.any(String),
      status: 'corrigida',
      nota: 3.33,
      xp: expect.objectContaining({ ganho: expect.any(Number) }),
      conquistas: expect.any(Array), // campo aditivo de D8 (§6.3)
    })

    const segunda = await realizar(aberta.estudante.agente, aberta.avaliacaoId, [
      { questaoId: vf, resposta: { valor: false } },
      { questaoId: num, resposta: { valor: 4 } },
    ])
    expect(segunda.body.nota).toBe(6.67)
    const resultado = await aberta.estudante.agente.get(`/api/v1/avaliacoes/${aberta.avaliacaoId}/resultado`)
    const texto = JSON.stringify([envio.body, segunda.body, resultado.body])
    expect(texto).not.toContain('acerto')
    expect(texto).not.toContain('gabarito')
  })

  it('TA-08/TA-09: dissertativa aguarda correção; professor pontua, valida limites e recorrige', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 2 }, { corpo: DISS, peso: 3 }])
    const [vf, diss] = aberta.questoes
    const envio = await realizar(aberta.estudante.agente, aberta.avaliacaoId, [
      { questaoId: vf, resposta: { valor: true } },
      { questaoId: diss, resposta: { texto: 'Minha explicacao.' } },
    ])
    expect(envio.body).toMatchObject({ status: 'aguardando_correcao', nota: null })
    const rota = `/api/v1/tentativas-avaliacao/${envio.body.tentativaId}/correcoes/${diss}`

    const outro = await criarUsuarioComSessao('professor')
    expect((await outro.agente.put(rota).send({ pontos: 1 })).status).toBe(403)
    expect((await aberta.estudante.agente.put(rota).send({ pontos: 1 })).status).toBe(403)
    expect((await aberta.professor.agente.put(`/api/v1/tentativas-avaliacao/${randomUUID()}/correcoes/${diss}`).send({ pontos: 1 })).status).toBe(404)
    for (const pontos of [-1, 3.01, 1.005, '2']) {
      expect((await aberta.professor.agente.put(rota).send({ pontos })).status, String(pontos)).toBe(400)
    }
    expect((await aberta.professor.agente.put(`/api/v1/tentativas-avaliacao/${envio.body.tentativaId}/correcoes/${vf}`).send({ pontos: 1 })).status).toBe(400)

    const corrigida = await aberta.professor.agente.put(rota).send({ pontos: 1.5 })
    expect(corrigida.status).toBe(200)
    expect(corrigida.body).toMatchObject({ status: 'corrigida', nota: 7 })
    const recorrigida = await aberta.professor.agente.put(rota).send({ pontos: 3 })
    expect(recorrigida.body.nota).toBe(10)

    const lista = await aberta.professor.agente.get(`/api/v1/avaliacoes/${aberta.avaliacaoId}/tentativas`)
    expect(lista.status).toBe(200)
    expect(lista.body[0].respostas).toEqual(
      expect.arrayContaining([
        { questaoId: vf, resposta: { valor: true }, acerto: true, pontos: 2 },
        { questaoId: diss, resposta: { texto: 'Minha explicacao.' }, acerto: null, pontos: 3 },
      ])
    )
    expect((await aberta.estudante.agente.get(`/api/v1/avaliacoes/${aberta.avaliacaoId}/tentativas`)).status).toBe(403)
  })

  it('F-3: dissertativa omitida vale 0 e a tentativa já sai corrigida', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }, { corpo: DISS, peso: 1 }])
    const envio = await realizar(aberta.estudante.agente, aberta.avaliacaoId, [
      { questaoId: aberta.questoes[0], resposta: { valor: true } },
    ])
    expect(envio.body).toMatchObject({ status: 'corrigida', nota: 5 })
  })

  it('TA-10: resultado = maior nota corrigida; null sem corrigidas; tentativas restantes', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }, { corpo: DISS, peso: 1 }], { tentativasMax: 3 })
    const [vf, diss] = aberta.questoes
    const rota = `/api/v1/avaliacoes/${aberta.avaliacaoId}/resultado`
    expect((await aberta.estudante.agente.get(rota)).body).toEqual({ tentativas: [], tentativasRestantes: 3, resultado: null })

    const pendente = await realizar(aberta.estudante.agente, aberta.avaliacaoId, [{ questaoId: diss, resposta: { texto: 'a' } }])
    expect((await aberta.estudante.agente.get(rota)).body).toMatchObject({ tentativasRestantes: 2, resultado: null })

    await realizar(aberta.estudante.agente, aberta.avaliacaoId, [{ questaoId: vf, resposta: { valor: true } }])
    await aberta.professor.agente
      .put(`/api/v1/tentativas-avaliacao/${pendente.body.tentativaId}/correcoes/${diss}`)
      .send({ pontos: 1 })
    const resultado = await aberta.estudante.agente.get(rota)
    expect(resultado.body.tentativasRestantes).toBe(1)
    expect(resultado.body.tentativas.map((t: { nota: number }) => t.nota)).toEqual([5, 5])
    expect(resultado.body.resultado).toBe(5)

    await realizar(aberta.estudante.agente, aberta.avaliacaoId, [{ questaoId: vf, resposta: { valor: true } }])
    expect((await aberta.estudante.agente.get(rota)).body).toMatchObject({ tentativasRestantes: 0, resultado: 5 })

    const outro = await criarUsuarioComSessao('estudante')
    expect((await outro.agente.get(rota)).body).toEqual({ tentativas: [], tentativasRestantes: 3, resultado: null })
  })

  it('TA-11: professor e admin não realizam nem consultam resultado (403); sem sessão → 401', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    const admin = await criarUsuarioComSessao('administrador')
    for (const agente of [aberta.professor.agente, admin.agente]) {
      expect((await realizar(agente, aberta.avaliacaoId, [])).status).toBe(403)
      expect((await agente.get(`/api/v1/avaliacoes/${aberta.avaliacaoId}/resultado`)).status).toBe(403)
    }
    expect((await api.post(`/api/v1/avaliacoes/${aberta.avaliacaoId}/tentativas`).send({ respostas: [] })).status).toBe(401)
    expect((await realizar(aberta.estudante.agente, randomUUID(), [])).status).toBe(404)
  })
})
