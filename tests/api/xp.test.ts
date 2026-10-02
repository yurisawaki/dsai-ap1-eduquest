import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { semanaDe } from '../../src/server/servicos/xp'
import { app, criarUsuarioComSessao } from '../utilidades/aplicacao'

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

describe('T5.3 — consulta de XP, semana e nível no perfil (F5-01, SPEC D7)', () => {
  it('TX-18: estudante sem eventos recebe {0, 0, 1, 0, 100}; professor/admin 403; sem sessão 401', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const resposta = await estudante.agente.get('/api/v1/xp')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ xpTotal: 0, xpSemana: 0, nivel: 1, xpNivelAtual: 0, xpProximoNivel: 100 })

    const professor = await criarUsuarioComSessao('professor')
    const admin = await criarUsuarioComSessao('administrador')
    expect((await professor.agente.get('/api/v1/xp')).status).toBe(403)
    expect((await admin.agente.get('/api/v1/xp')).status).toBe(403)
    expect((await request(app).get('/api/v1/xp')).status).toBe(401)
  })

  it('TX-18: reflete as concessões e a faixa do nível atual', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    await prisma.saldoXp.create({ data: { usuario_id: estudante.id, xp_total: 295, nivel: 2 } })
    await concluir(estudante.agente, aulaId)

    const resposta = await estudante.agente.get('/api/v1/xp')
    expect(resposta.body).toEqual({ xpTotal: 305, xpSemana: 10, nivel: 3, xpNivelAtual: 300, xpProximoNivel: 600 })
  })

  it('TX-12/R-X18: XP da semana conta só a semana ISO corrente em America/Sao_Paulo', async () => {
    const { cursoId } = await cursoPublicado()
    const estudante = await criarUsuarioComSessao('estudante')
    const { inicio } = semanaDe(new Date())
    const evento = (xp: number, concedidoEm: Date) => ({
      id: randomUUID(),
      usuario_id: estudante.id,
      origem: 'conclusao_aula' as const,
      referencia_id: randomUUID(),
      curso_id: cursoId,
      chave: `aula:${randomUUID()}`,
      xp,
      concedido_em: concedidoEm,
    })
    await prisma.eventoXp.createMany({
      data: [
        evento(7, new Date(inicio.getTime() - 1)), // domingo 23:59:59.999 local: semana anterior
        evento(11, inicio), // segunda 00:00 local: semana corrente
        evento(13, new Date()),
      ],
    })
    await prisma.saldoXp.create({ data: { usuario_id: estudante.id, xp_total: 31, nivel: 1 } })

    const resposta = await estudante.agente.get('/api/v1/xp')
    expect(resposta.body.xpTotal).toBe(31)
    expect(resposta.body.xpSemana).toBe(24)
  })

  it('TX-11/R-X17/R-X20: excluir o curso não altera eventos, saldo nem nível', async () => {
    const { professor, moduloId, cursoId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    await prisma.saldoXp.create({ data: { usuario_id: estudante.id, xp_total: 90, nivel: 1 } })
    await concluir(estudante.agente, aulaId)
    await responder(estudante.agente, questaoId, CERTO)
    const antes = await estudante.agente.get('/api/v1/xp')
    expect(antes.body).toMatchObject({ xpTotal: 105, nivel: 2 })

    expect((await professor.agente.delete(`/api/v1/cursos/${cursoId}`)).status).toBe(204)
    expect(await prisma.eventoXp.count({ where: { usuario_id: estudante.id } })).toBe(2)
    const depois = await estudante.agente.get('/api/v1/xp')
    expect(depois.body).toEqual(antes.body)
  })

  it('R-X17: nível gravado nunca é rebaixado pela leitura', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    await prisma.saldoXp.create({ data: { usuario_id: estudante.id, xp_total: 120, nivel: 3 } })
    const resposta = await estudante.agente.get('/api/v1/xp')
    expect(resposta.body).toMatchObject({ nivel: 3, xpNivelAtual: 300, xpProximoNivel: 600 })
    expect((await estudante.agente.get(`/api/v1/perfis/${estudante.id}`)).body.nivel).toBe(3)
  })

  it('TX-19/R-X23/R-X24: perfil mostra nível do estudante (null para professor) e nunca o XP', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await aulaPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    const outro = await criarUsuarioComSessao('estudante')
    expect((await outro.agente.get(`/api/v1/perfis/${estudante.id}`)).body.nivel).toBe(1)

    await prisma.saldoXp.create({ data: { usuario_id: estudante.id, xp_total: 95, nivel: 1 } })
    await concluir(estudante.agente, aulaId)
    const visto = await outro.agente.get(`/api/v1/perfis/${estudante.id}`)
    expect(visto.status).toBe(200)
    expect(visto.body.nivel).toBe(2)
    expect(visto.body).not.toHaveProperty('xpTotal')
    expect(visto.body).not.toHaveProperty('xpSemana')

    const doProfessor = await estudante.agente.get(`/api/v1/perfis/${professor.id}`)
    expect(doProfessor.body.nivel).toBeNull()
  })
})

// Os testes que alteram o valor global ficam neste arquivo (execução sequencial) e sempre
// restauram os padrões: os demais testes de XP dependem dos valores 10/5/20/3.
const PADROES = { xpConclusaoAula: 10, xpAcertoQuestao: 5, xpEntregaAvaliacao: 20, xpPorPontoNota: 3 }

async function restaurarPadroes() {
  await prisma.configXpGlobal.updateMany({
    data: { xp_conclusao_aula: 10, xp_acerto_questao: 5, xp_entrega_avaliacao: 20, xp_por_ponto_nota: 3 },
  })
}

describe('T5.4 — configuração de XP por escopo (F5-02–F5-05, SPEC D7)', () => {
  it('TX-14/R-X11: administrador lê e substitui o global; demais papéis 403; sem sessão 401', async () => {
    const admin = await criarUsuarioComSessao('administrador')
    const professor = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    try {
      const lida = await admin.agente.get('/api/v1/config/xp')
      expect(lida.status).toBe(200)
      expect(lida.body).toEqual(PADROES)

      const novos = { xpConclusaoAula: 12, xpAcertoQuestao: 0, xpEntregaAvaliacao: 1000, xpPorPontoNota: 4 }
      const salva = await admin.agente.put('/api/v1/config/xp').send(novos)
      expect(salva.status).toBe(200)
      expect(salva.body).toEqual(novos)
      expect((await admin.agente.get('/api/v1/config/xp')).body).toEqual(novos)

      for (const agente of [professor.agente, estudante.agente]) {
        expect((await agente.get('/api/v1/config/xp')).status).toBe(403)
        expect((await agente.put('/api/v1/config/xp').send(PADROES)).status).toBe(403)
      }
      expect((await request(app).get('/api/v1/config/xp')).status).toBe(401)
      expect((await request(app).put('/api/v1/config/xp').send(PADROES)).status).toBe(401)
    } finally {
      await restaurarPadroes()
    }
  })

  it('TX-14/R-X10: corpo inválido do global → 400 sem alterar nada', async () => {
    const admin = await criarUsuarioComSessao('administrador')
    const invalidos: unknown[] = [
      { ...PADROES, xpConclusaoAula: 1001 },
      { ...PADROES, xpAcertoQuestao: -1 },
      { ...PADROES, xpEntregaAvaliacao: 2.5 },
      { ...PADROES, xpPorPontoNota: '3' },
      { xpConclusaoAula: 10, xpAcertoQuestao: 5, xpEntregaAvaliacao: 20 },
      { ...PADROES, extra: 1 },
      [],
    ]
    for (const corpo of invalidos) {
      const resposta = await admin.agente.put('/api/v1/config/xp').send(corpo as object)
      expect(resposta.status).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }
    expect((await admin.agente.get('/api/v1/config/xp')).body).toEqual(PADROES)
  })

  it('TX-15/R-X12: dono lê e ajusta o curso dentro de 0–2× o global; null volta ao global', async () => {
    const { professor, cursoId } = await cursoPublicado()
    const rota = `/api/v1/cursos/${cursoId}/config-xp`

    const inicial = await professor.agente.get(rota)
    expect(inicial.status).toBe(200)
    expect(inicial.body).toEqual({
      xpConclusaoAula: { global: 10, curso: null, efetivo: 10 },
      xpAcertoQuestao: { global: 5, curso: null, efetivo: 5 },
      xpEntregaAvaliacao: { global: 20, curso: null, efetivo: 20 },
      xpPorPontoNota: { global: 3, curso: null, efetivo: 3 },
    })

    const ajustada = await professor.agente.patch(rota).send({ xpConclusaoAula: 20, xpPorPontoNota: 0 })
    expect(ajustada.status).toBe(200)
    expect(ajustada.body.xpConclusaoAula).toEqual({ global: 10, curso: 20, efetivo: 20 })
    expect(ajustada.body.xpPorPontoNota).toEqual({ global: 3, curso: 0, efetivo: 0 })
    expect(ajustada.body.xpAcertoQuestao).toEqual({ global: 5, curso: null, efetivo: 5 })

    for (const corpo of [{ xpConclusaoAula: 21 }, { xpAcertoQuestao: -1 }, { xpAcertoQuestao: 1.5 }, { outro: 1 }, []]) {
      expect((await professor.agente.patch(rota).send(corpo as object)).status).toBe(400)
    }

    const vazio = await professor.agente.patch(rota).send({})
    expect(vazio.body).toEqual(ajustada.body)

    const revertida = await professor.agente.patch(rota).send({ xpConclusaoAula: null })
    expect(revertida.body.xpConclusaoAula).toEqual({ global: 10, curso: null, efetivo: 10 })
    expect(revertida.body.xpPorPontoNota.curso).toBe(0)
  })

  it('TX-15: não-dono e estudante 403; curso inexistente 404; administrador pode ajustar; sem sessão 401', async () => {
    const { cursoId } = await cursoPublicado()
    const rota = `/api/v1/cursos/${cursoId}/config-xp`
    const outro = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')

    for (const agente of [outro.agente, estudante.agente]) {
      expect((await agente.get(rota)).status).toBe(403)
      expect((await agente.patch(rota).send({ xpConclusaoAula: 5 })).status).toBe(403)
    }
    expect((await admin.agente.get(`/api/v1/cursos/${randomUUID()}/config-xp`)).status).toBe(404)
    expect((await admin.agente.patch(`/api/v1/cursos/${randomUUID()}/config-xp`).send({})).status).toBe(404)
    expect((await admin.agente.patch(rota).send({ xpAcertoQuestao: 8 })).body.xpAcertoQuestao.efetivo).toBe(8)
    expect((await request(app).get(rota)).status).toBe(401)
  })

  it('TX-15/EX-02: curso não publicado é invisível a quem não é dono — 404, não 403', async () => {
    const dono = await criarUsuarioComSessao('professor')
    const curso = await dono.agente.post('/api/v1/cursos').send({ titulo: 'Rascunho' })
    const rota = `/api/v1/cursos/${curso.body.cursoId}/config-xp`
    const outro = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')

    for (const agente of [outro.agente, estudante.agente]) {
      const leitura = await agente.get(rota)
      expect(leitura.status).toBe(404)
      expect(leitura.body.erro.codigo).toBe('nao_encontrado')
      expect((await agente.patch(rota).send({ xpConclusaoAula: 5 })).status).toBe(404)
      // corpo inválido não muda a resposta: 404 vem antes de 400
      expect((await agente.patch(rota).send({ outro: 1 })).status).toBe(404)
    }
    expect((await dono.agente.get(rota)).status).toBe(200)
    expect((await admin.agente.patch(rota).send({ xpConclusaoAula: 5 })).status).toBe(200)
    expect(await prisma.configXpCurso.findUnique({ where: { curso_id: curso.body.cursoId } })).toMatchObject({
      xp_conclusao_aula: 5,
    })
  })

  it('TX-16/R-X13/R-X14: ajuste vale na concessão; mudar o global não reescreve eventos e reaplica o teto', async () => {
    const admin = await criarUsuarioComSessao('administrador')
    const { professor, moduloId, cursoId } = await cursoPublicado()
    const aulas = [await aulaPublicada(professor.agente, moduloId), await aulaPublicada(professor.agente, moduloId)]
    const estudante = await criarUsuarioComSessao('estudante')
    await professor.agente.patch(`/api/v1/cursos/${cursoId}/config-xp`).send({ xpConclusaoAula: 20 })
    try {
      expect((await concluir(estudante.agente, aulas[0])).body.xp.ganho).toBe(20)

      await admin.agente.put('/api/v1/config/xp').send({ ...PADROES, xpConclusaoAula: 5 })
      const config = await professor.agente.get(`/api/v1/cursos/${cursoId}/config-xp`)
      expect(config.body.xpConclusaoAula).toEqual({ global: 5, curso: 20, efetivo: 10 })

      expect((await concluir(estudante.agente, aulas[1])).body.xp.ganho).toBe(10)
      expect((await eventos(estudante.id)).map((evento) => evento.xp)).toEqual([20, 10])
      expect((await saldo(estudante.id))?.xp_total).toBe(30)
    } finally {
      await restaurarPadroes()
    }
  })
})
