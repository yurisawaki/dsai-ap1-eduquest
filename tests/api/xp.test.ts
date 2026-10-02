import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { criarUsuarioComSessao } from '../utilidades/aplicacao'

// SPEC/2026-10-02-xp-niveis.md (D7) — T5.2: concessão de XP por ações verificadas

type Agente = ReturnType<typeof request.agent>

const HORA = 60 * 60 * 1000
const VF = { tipo: 'verdadeiro_falso', enunciado: 'O ceu e azul.', gabarito: { valor: true } }
const DISS = { tipo: 'dissertativa', enunciado: 'Explique.' }
const CERTO = { valor: true }
const ERRADO = { valor: false }

// curso publicado com módulo publicado; devolve o professor dono
async function cursoPublicado() {
  const professor = await criarUsuarioComSessao('professor')
  const curso = await professor.agente.post('/api/v1/cursos').send({ titulo: 'Curso' })
  const cursoId = curso.body.cursoId as string
  const modulo = await professor.agente.post(`/api/v1/cursos/${cursoId}/modulos`).send({ titulo: 'Modulo' })
  const moduloId = modulo.body.moduloId as string
  await professor.agente.patch(`/api/v1/cursos/${cursoId}`).send({ publicado: true })
  await professor.agente.patch(`/api/v1/modulos/${moduloId}`).send({ publicado: true })
  return { professor, cursoId, moduloId }
}

async function aulaPublicada(agente: Agente, moduloId: string) {
  const aula = await agente.post(`/api/v1/modulos/${moduloId}/aulas`).send({ titulo: 'Aula' })
  await agente.patch(`/api/v1/aulas/${aula.body.aulaId}`).send({ publicado: true })
  return aula.body.aulaId as string
}

async function questaoPublicada(agente: Agente, moduloId: string, corpo: object = VF) {
  const criada = await agente.post(`/api/v1/modulos/${moduloId}/questoes`).send(corpo)
  await agente.patch(`/api/v1/questoes/${criada.body.questaoId}`).send({ publicado: true })
  return criada.body.questaoId as string
}

// avaliação publicada e aberta, composta por questões novas do módulo (VF ou dissertativa)
async function avaliacaoAberta(itens: { corpo: object; peso: number }[], tentativasMax = 3) {
  const base = await cursoPublicado()
  const questoes: string[] = []
  for (const item of itens) questoes.push(await questaoPublicada(base.professor.agente, base.moduloId, item.corpo))
  const criada = await base.professor.agente.post(`/api/v1/cursos/${base.cursoId}/avaliacoes`).send({
    titulo: 'Prova',
    tentativasMax,
    abreEm: new Date(Date.now() - HORA).toISOString(),
    fechaEm: new Date(Date.now() + HORA).toISOString(),
    questoes: questoes.map((questaoId, i) => ({ questaoId, peso: itens[i].peso })),
  })
  const avaliacaoId = criada.body.avaliacaoId as string
  await base.professor.agente.patch(`/api/v1/avaliacoes/${avaliacaoId}`).send({ publicado: true })
  return { ...base, avaliacaoId, questoes }
}

function concluir(agente: Agente, aulaId: string, corpo: object = {}) {
  return agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send(corpo)
}

function responder(agente: Agente, questaoId: string, corpo: object) {
  return agente.post(`/api/v1/questoes/${questaoId}/tentativas`).send(corpo)
}

function realizar(agente: Agente, avaliacaoId: string, respostas: unknown[]) {
  return agente.post(`/api/v1/avaliacoes/${avaliacaoId}/tentativas`).send({ respostas })
}

async function eventos(usuarioId: string) {
  return prisma.eventoXp.findMany({ where: { usuario_id: usuarioId }, orderBy: { criado_em: 'asc' } })
}

async function saldo(usuarioId: string) {
  return prisma.saldoXp.findUnique({ where: { usuario_id: usuarioId } })
}

describe('T5.2 — concessão de XP por ações verificadas (SPEC D7)', () => {
  it('TX-01/R-X2: primeira conclusão de aula paga 10 XP; repetição paga 0', async () => {
    const { professor, moduloId, cursoId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')

    const primeira = await concluir(estudante.agente, aulaId)
    expect(primeira.status).toBe(201)
    expect(primeira.body.xp).toEqual({ ganho: 10, total: 10, nivel: 1, subiuNivel: false })

    const repetida = await concluir(estudante.agente, aulaId)
    expect(repetida.status).toBe(200)
    expect(repetida.body.xp).toEqual({ ganho: 0, total: 10, nivel: 1, subiuNivel: false })

    const gravados = await eventos(estudante.id)
    expect(gravados).toHaveLength(1)
    expect(gravados[0]).toMatchObject({
      origem: 'conclusao_aula',
      referencia_id: aulaId,
      curso_id: cursoId,
      chave: `aula:${aulaId}`,
      xp: 10,
    })
  })

  it('TX-02/R-X3: erro, erro, acerto → 0, 0, 5; acertos seguintes → 0', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')

    const ganhos: number[] = []
    for (const corpo of [ERRADO, ERRADO, CERTO, CERTO, ERRADO]) {
      const tentativa = await responder(estudante.agente, questaoId, corpo)
      expect(tentativa.status).toBe(201)
      ganhos.push(tentativa.body.xp.ganho)
    }
    expect(ganhos).toEqual([0, 0, 5, 0, 0])
    expect((await saldo(estudante.id))?.xp_total).toBe(5)
    expect(await prisma.tentativa.count({ where: { usuario_id: estudante.id } })).toBe(5)
  })

  it('TX-03/R-X3: tentativa de dissertativa em exercício paga 0', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const questaoId = await questaoPublicada(professor.agente, moduloId, DISS)
    const estudante = await criarUsuarioComSessao('estudante')

    const tentativa = await responder(estudante.agente, questaoId, { texto: 'Minha resposta.' })
    expect(tentativa.status).toBe(201)
    expect(tentativa.body.acerto).toBeNull()
    expect(tentativa.body.xp.ganho).toBe(0)
    expect(await eventos(estudante.id)).toHaveLength(0)
  })

  it('TX-04/R-X4/R-X5: entrega 20 + 3 por ponto de melhoria; nota menor não paga', async () => {
    // pesos 6/2/1/1: A → 6,00; A+B → 8,00; A+C → 7,00
    const aberta = await avaliacaoAberta([
      { corpo: VF, peso: 6 },
      { corpo: VF, peso: 2 },
      { corpo: VF, peso: 1 },
      { corpo: VF, peso: 1 },
    ])
    const [a, b, c, d] = aberta.questoes
    const estudante = await criarUsuarioComSessao('estudante')
    const respostas = (corretas: string[]) =>
      [a, b, c, d].map((questaoId) => ({ questaoId, resposta: corretas.includes(questaoId) ? CERTO : ERRADO }))

    const primeira = await realizar(estudante.agente, aberta.avaliacaoId, respostas([a]))
    expect(primeira.status).toBe(201)
    expect(primeira.body.nota).toBe(6)
    expect(primeira.body.xp).toEqual({ ganho: 38, total: 38, nivel: 1, subiuNivel: false })

    const segunda = await realizar(estudante.agente, aberta.avaliacaoId, respostas([a, b]))
    expect(segunda.body.nota).toBe(8)
    expect(segunda.body.xp.ganho).toBe(6)

    const terceira = await realizar(estudante.agente, aberta.avaliacaoId, respostas([a, c]))
    expect(terceira.body.nota).toBe(7)
    expect(terceira.body.xp.ganho).toBe(0)

    const gravados = await eventos(estudante.id)
    expect(gravados.map((evento) => [evento.origem, evento.xp])).toEqual([
      ['entrega_avaliacao', 20],
      ['nota_avaliacao', 18],
      ['nota_avaliacao', 6],
    ])
    expect(gravados[2].chave).toBe(`nota:${aberta.avaliacaoId}:800`)
    expect(gravados[2].nota_referencia?.toNumber()).toBe(8)
  })

  it('TX-05/TX-06/R-X9/R-X21: dissertativa paga a nota na correção, ao estudante; recorreção só paga se subir', async () => {
    const aberta = await avaliacaoAberta([{ corpo: DISS, peso: 10 }])
    const [diss] = aberta.questoes
    const estudante = await criarUsuarioComSessao('estudante')

    const envio = await realizar(estudante.agente, aberta.avaliacaoId, [
      { questaoId: diss, resposta: { texto: 'Resposta.' } },
    ])
    expect(envio.body.status).toBe('aguardando_correcao')
    expect(envio.body.xp).toEqual({ ganho: 20, total: 20, nivel: 1, subiuNivel: false })

    const rota = `/api/v1/tentativas-avaliacao/${envio.body.tentativaId}/correcoes/${diss}`
    const correcao = await aberta.professor.agente.put(rota).send({ pontos: 5 })
    expect(correcao.status).toBe(200)
    expect(correcao.body).not.toHaveProperty('xp')
    expect((await saldo(estudante.id))?.xp_total).toBe(35)
    expect(await saldo(aberta.professor.id)).toBeNull()

    await aberta.professor.agente.put(rota).send({ pontos: 3 })
    expect((await saldo(estudante.id))?.xp_total).toBe(35)

    await aberta.professor.agente.put(rota).send({ pontos: 7 })
    expect((await saldo(estudante.id))?.xp_total).toBe(41)
    expect(await prisma.eventoXp.count({ where: { usuario_id: aberta.professor.id } })).toBe(0)
  })

  it('TX-07/R-X6: acertos dentro de avaliação não geram evento de acerto', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    const estudante = await criarUsuarioComSessao('estudante')
    await realizar(estudante.agente, aberta.avaliacaoId, [{ questaoId: aberta.questoes[0], resposta: CERTO }])
    const origens = (await eventos(estudante.id)).map((evento) => evento.origem)
    expect(origens).toEqual(['entrega_avaliacao', 'nota_avaliacao'])
  })

  it('TX-08/R-X7: envios simultâneos geram um único evento por chave', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')

    const conclusoes = await Promise.all([concluir(estudante.agente, aulaId), concluir(estudante.agente, aulaId)])
    expect(conclusoes.map((r) => r.status).sort()).toEqual([200, 201])
    const acertos = await Promise.all([
      responder(estudante.agente, questaoId, CERTO),
      responder(estudante.agente, questaoId, CERTO),
    ])
    expect(acertos.map((r) => r.status)).toEqual([201, 201])
    const ganhos = [...conclusoes, ...acertos].map((r) => r.body.xp.ganho).sort((x, y) => x - y)
    expect(ganhos).toEqual([0, 0, 5, 10])

    expect(await prisma.eventoXp.count({ where: { usuario_id: estudante.id } })).toBe(2)
    expect((await saldo(estudante.id))?.xp_total).toBe(15)
  })

  it('TX-09/R-X1: o cliente não define XP — corpo ignorado na conclusão, rejeitado na tentativa', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')

    const conclusao = await concluir(estudante.agente, aulaId, { xp: 9999, nivel: 50 })
    expect(conclusao.body.xp).toEqual({ ganho: 10, total: 10, nivel: 1, subiuNivel: false })
    const tentativa = await responder(estudante.agente, questaoId, { valor: true, xp: 100 })
    expect(tentativa.status).toBe(400)
    expect((await saldo(estudante.id))?.xp_total).toBe(10)
  })

  it('R-X9: professor e administrador não ganham XP (rotas restritas a estudante)', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const admin = await criarUsuarioComSessao('administrador')
    expect((await concluir(professor.agente, aulaId)).status).toBe(403)
    expect((await concluir(admin.agente, aulaId)).status).toBe(403)
    expect(await prisma.eventoXp.count({ where: { usuario_id: { in: [professor.id, admin.id] } } })).toBe(0)
  })

  it('TX-13/R-X15: saldo = soma dos eventos após ações mistas', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulas = [await aulaPublicada(professor.agente, moduloId), await aulaPublicada(professor.agente, moduloId)]
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    for (const aulaId of [...aulas, aulas[0]]) await concluir(estudante.agente, aulaId)
    for (const corpo of [ERRADO, CERTO, CERTO]) await responder(estudante.agente, questaoId, corpo)

    const soma = await prisma.eventoXp.aggregate({ where: { usuario_id: estudante.id }, _sum: { xp: true } })
    expect(soma._sum.xp).toBe(25)
    expect((await saldo(estudante.id))?.xp_total).toBe(25)
  })

  it('R-X17: subir de faixa devolve subiuNivel e grava o nível', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    await prisma.saldoXp.create({ data: { usuario_id: estudante.id, xp_total: 95, nivel: 1 } })

    const conclusao = await concluir(estudante.agente, aulaId)
    expect(conclusao.body.xp).toEqual({ ganho: 10, total: 105, nivel: 2, subiuNivel: true })
    expect((await saldo(estudante.id))?.nivel).toBe(2)
  })

  it('R-X13: ajuste do curso vale, limitado a 2× o global', async () => {
    const { professor, moduloId, cursoId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    await prisma.configXpCurso.create({
      data: { curso_id: cursoId, xp_conclusao_aula: 50, xp_acerto_questao: 7 },
    })
    const estudante = await criarUsuarioComSessao('estudante')
    expect((await concluir(estudante.agente, aulaId)).body.xp.ganho).toBe(20)
    expect((await responder(estudante.agente, questaoId, CERTO)).body.xp.ganho).toBe(7)
  })

  it('TX-17/D7-a: valor efetivo 0 grava evento de 0; subir a configuração não faz a ação pagar de novo', async () => {
    const { professor, moduloId, cursoId } = await cursoPublicado()
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    await prisma.configXpCurso.create({ data: { curso_id: cursoId, xp_acerto_questao: 0 } })
    const estudante = await criarUsuarioComSessao('estudante')

    expect((await responder(estudante.agente, questaoId, CERTO)).body.xp.ganho).toBe(0)
    const gravados = await eventos(estudante.id)
    expect(gravados).toHaveLength(1)
    expect(gravados[0]).toMatchObject({ origem: 'acerto_questao', xp: 0 })

    await prisma.configXpCurso.update({ where: { curso_id: cursoId }, data: { xp_acerto_questao: 10 } })
    expect((await responder(estudante.agente, questaoId, CERTO)).body.xp.ganho).toBe(0)
    expect(await eventos(estudante.id)).toHaveLength(1)
  })

  it('TX-20/R-X8: falha ao gravar o evento desfaz a conclusão', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    const sufixo = randomUUID().replace(/-/g, '')
    // gatilho restrito a este estudante: não interfere nos demais testes
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION falha_xp_${sufixo}() RETURNS trigger AS $$ BEGIN
         IF NEW.usuario_id = '${estudante.id}'::uuid THEN RAISE EXCEPTION 'falha simulada'; END IF;
         RETURN NEW; END $$ LANGUAGE plpgsql`
    )
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER falha_xp_${sufixo} BEFORE INSERT ON evento_xp
       FOR EACH ROW EXECUTE FUNCTION falha_xp_${sufixo}()`
    )
    try {
      const conclusao = await concluir(estudante.agente, aulaId)
      expect(conclusao.status).toBe(500)
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER falha_xp_${sufixo} ON evento_xp`)
      await prisma.$executeRawUnsafe(`DROP FUNCTION falha_xp_${sufixo}()`)
    }
    expect(await prisma.conclusaoAula.count({ where: { usuario_id: estudante.id } })).toBe(0)
    expect(await eventos(estudante.id)).toHaveLength(0)

    const novamente = await concluir(estudante.agente, aulaId)
    expect(novamente.status).toBe(201)
    expect(novamente.body.xp.ganho).toBe(10)
  })
})
