import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { app, criarUsuarioComSessao } from '../utilidades/aplicacao'

// SPEC/2026-10-02-conquistas.md (D8) — T5.6: desbloqueio de conquistas

type Agente = ReturnType<typeof request.agent>

const HORA = 60 * 60 * 1000
const VF = { tipo: 'verdadeiro_falso', enunciado: 'O ceu e azul.', gabarito: { valor: true } }
const DISS = { tipo: 'dissertativa', enunciado: 'Explique.' }
const CERTO = { valor: true }
const ERRADO = { valor: false }

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

async function novaAula(agente: Agente, moduloId: string, publicada = true) {
  const aula = await agente.post(`/api/v1/modulos/${moduloId}/aulas`).send({ titulo: 'Aula' })
  if (publicada) await agente.patch(`/api/v1/aulas/${aula.body.aulaId}`).send({ publicado: true })
  return aula.body.aulaId as string
}

async function questaoPublicada(agente: Agente, moduloId: string, corpo: object = VF) {
  const criada = await agente.post(`/api/v1/modulos/${moduloId}/questoes`).send(corpo)
  await agente.patch(`/api/v1/questoes/${criada.body.questaoId}`).send({ publicado: true })
  return criada.body.questaoId as string
}

async function avaliacaoAberta(itens: { corpo: object; peso: number }[]) {
  const base = await cursoPublicado()
  const questoes: string[] = []
  for (const item of itens) questoes.push(await questaoPublicada(base.professor.agente, base.moduloId, item.corpo))
  const criada = await base.professor.agente.post(`/api/v1/cursos/${base.cursoId}/avaliacoes`).send({
    titulo: 'Prova',
    tentativasMax: 3,
    abreEm: new Date(Date.now() - HORA).toISOString(),
    fechaEm: new Date(Date.now() + HORA).toISOString(),
    questoes: questoes.map((questaoId, i) => ({ questaoId, peso: itens[i].peso })),
  })
  const avaliacaoId = criada.body.avaliacaoId as string
  await base.professor.agente.patch(`/api/v1/avaliacoes/${avaliacaoId}`).send({ publicado: true })
  return { ...base, avaliacaoId, questoes }
}

function concluir(agente: Agente, aulaId: string) {
  return agente.post(`/api/v1/aulas/${aulaId}/conclusao`).send({})
}

function responder(agente: Agente, questaoId: string, corpo: object) {
  return agente.post(`/api/v1/questoes/${questaoId}/tentativas`).send(corpo)
}

function realizar(agente: Agente, avaliacaoId: string, respostas: unknown[]) {
  return agente.post(`/api/v1/avaliacoes/${avaliacaoId}/tentativas`).send({ respostas })
}

const codigos = (resposta: { body: { conquistas: { codigo: string }[] } }) =>
  resposta.body.conquistas.map((conquista) => conquista.codigo)

async function desbloqueadas(usuarioId: string) {
  const linhas = await prisma.desbloqueioConquista.findMany({
    where: { usuario_id: usuarioId },
    include: { conquista: { select: { codigo: true } } },
  })
  return linhas.map((linha) => linha.conquista.codigo).sort()
}

async function catalogo(agente: Agente) {
  const resposta = await agente.get('/api/v1/conquistas')
  return new Map((resposta.body as { codigo: string }[]).map((item) => [item.codigo, item]))
}

describe('T5.6 — desbloqueio de conquistas (SPEC D8)', () => {
  it('TC-01: a migração grava o catálogo fixo de §4.1', async () => {
    const linhas = await prisma.conquista.findMany({ orderBy: { ordem: 'asc' } })
    expect(linhas.map((linha) => [linha.ordem, linha.codigo, linha.tipo_criterio, linha.meta])).toEqual([
      [1, 'primeiros_passos', 'aulas_concluidas', 1],
      [2, 'maratonista', 'aulas_concluidas', 25],
      [3, 'curso_concluido', 'cursos_concluidos', 1],
      [4, 'colecionador_de_cursos', 'cursos_concluidos', 3],
      [5, 'primeiro_acerto', 'questoes_acertadas', 1],
      [6, 'mente_afiada', 'questoes_acertadas', 50],
      [7, 'avaliado', 'avaliacoes_entregues', 1],
      [8, 'nota_maxima', 'nota_avaliacao', 10],
      [9, 'subindo_de_nivel', 'nivel', 5],
      [10, 'veterano', 'nivel', 10],
    ])
    expect(linhas[0].nome).toBe('Primeiros passos')
  })

  it('TC-02: primeira conclusão desbloqueia "Primeiros passos"; a seguinte não repete', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulas = [
      await novaAula(professor.agente, moduloId),
      await novaAula(professor.agente, moduloId),
      await novaAula(professor.agente, moduloId),
    ]
    const estudante = await criarUsuarioComSessao('estudante')

    const primeira = await concluir(estudante.agente, aulas[0])
    expect(primeira.body.conquistas).toEqual([{ codigo: 'primeiros_passos', nome: 'Primeiros passos' }])
    expect(codigos(await concluir(estudante.agente, aulas[1]))).toEqual([])
    expect(codigos(await concluir(estudante.agente, aulas[1]))).toEqual([])
    expect(await desbloqueadas(estudante.id)).toEqual(['primeiros_passos'])
  })

  it('TC-03/U-3: curso concluído = 100% das aulas visíveis; rascunhos não impedem', async () => {
    const { professor, cursoId, moduloId } = await cursoPublicado()
    const visiveis = [await novaAula(professor.agente, moduloId), await novaAula(professor.agente, moduloId)]
    await novaAula(professor.agente, moduloId, false)
    const oculto = await professor.agente.post(`/api/v1/cursos/${cursoId}/modulos`).send({ titulo: 'Oculto' })
    await novaAula(professor.agente, oculto.body.moduloId)
    const estudante = await criarUsuarioComSessao('estudante')

    expect(codigos(await concluir(estudante.agente, visiveis[0]))).toEqual(['primeiros_passos'])
    expect(codigos(await concluir(estudante.agente, visiveis[1]))).toEqual(['curso_concluido'])
    expect((await catalogo(estudante.agente)).get('colecionador_de_cursos')).toMatchObject({ progresso: 1, meta: 3 })
  })

  it('TC-04: primeiro acerto de exercício desbloqueia; repetir a questão ou acertar em avaliação não conta', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')

    expect(codigos(await responder(estudante.agente, questaoId, ERRADO))).toEqual([])
    expect(codigos(await responder(estudante.agente, questaoId, CERTO))).toEqual(['primeiro_acerto'])
    await responder(estudante.agente, questaoId, CERTO)
    expect((await catalogo(estudante.agente)).get('mente_afiada')).toMatchObject({ progresso: 1, meta: 50 })

    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    const outro = await criarUsuarioComSessao('estudante')
    await realizar(outro.agente, aberta.avaliacaoId, [{ questaoId: aberta.questoes[0], resposta: CERTO }])
    expect((await catalogo(outro.agente)).get('primeiro_acerto')).toMatchObject({ progresso: 0, desbloqueada: false })
  })

  it('TC-05: entrega desbloqueia "Avaliado"; nota 10 desbloqueia "Nota máxima" no envio', async () => {
    const aberta = await avaliacaoAberta([{ corpo: VF, peso: 1 }])
    const estudante = await criarUsuarioComSessao('estudante')
    const envio = await realizar(estudante.agente, aberta.avaliacaoId, [
      { questaoId: aberta.questoes[0], resposta: CERTO },
    ])
    expect(envio.body.nota).toBe(10)
    expect(codigos(envio)).toEqual(['avaliado', 'nota_maxima'])
  })

  it('TC-05/R-C2: com dissertativa, "Nota máxima" vem na correção e é do estudante, não do professor', async () => {
    const aberta = await avaliacaoAberta([{ corpo: DISS, peso: 10 }])
    const estudante = await criarUsuarioComSessao('estudante')
    const envio = await realizar(estudante.agente, aberta.avaliacaoId, [
      { questaoId: aberta.questoes[0], resposta: { texto: 'Resposta.' } },
    ])
    expect(codigos(envio)).toEqual(['avaliado'])

    const correcao = await aberta.professor.agente
      .put(`/api/v1/tentativas-avaliacao/${envio.body.tentativaId}/correcoes/${aberta.questoes[0]}`)
      .send({ pontos: 10 })
    expect(correcao.status).toBe(200)
    expect(correcao.body).not.toHaveProperty('conquistas')
    expect(await desbloqueadas(estudante.id)).toEqual(['avaliado', 'nota_maxima'])
    expect(await desbloqueadas(aberta.professor.id)).toEqual([])
  })

  it('TC-06: o XP da própria ação que leva ao nível 5 desbloqueia "Subindo de nível" na mesma resposta', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await novaAula(professor.agente, moduloId)
    await novaAula(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    await prisma.saldoXp.create({ data: { usuario_id: estudante.id, xp_total: 995, nivel: 4 } })

    const conclusao = await concluir(estudante.agente, aulaId)
    expect(conclusao.body.xp).toMatchObject({ nivel: 5, subiuNivel: true })
    expect(codigos(conclusao)).toEqual(['primeiros_passos', 'subindo_de_nivel'])
  })

  it('TC-07/R-C4: ações simultâneas desbloqueiam uma única vez', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulas = [
      await novaAula(professor.agente, moduloId),
      await novaAula(professor.agente, moduloId),
      await novaAula(professor.agente, moduloId),
    ]
    const estudante = await criarUsuarioComSessao('estudante')
    const respostas = await Promise.all([concluir(estudante.agente, aulas[0]), concluir(estudante.agente, aulas[1])])
    expect(respostas.map((r) => r.status)).toEqual([201, 201])
    expect(respostas.flatMap(codigos)).toEqual(['primeiros_passos'])
    expect(await desbloqueadas(estudante.id)).toEqual(['primeiros_passos'])
  })

  it('TC-08/U-4/R-C8: histórico anterior conta; leitura não desbloqueia, a próxima ação sim', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const questaoId = await questaoPublicada(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    // 25 conclusões já registradas (aulas em rascunho — D8-d: toda conclusão registrada conta)
    const aulas = Array.from({ length: 25 }, () => randomUUID())
    await prisma.aula.createMany({ data: aulas.map((id) => ({ id, modulo_id: moduloId, titulo: 'Antiga' })) })
    await prisma.conclusaoAula.createMany({
      data: aulas.map((aulaId) => ({ id: randomUUID(), aula_id: aulaId, usuario_id: estudante.id, concluida_em: new Date() })),
    })

    const antes = await catalogo(estudante.agente)
    expect(antes.get('maratonista')).toMatchObject({ progresso: 25, meta: 25, desbloqueada: false, desbloqueadaEm: null })
    expect(await desbloqueadas(estudante.id)).toEqual([])

    const acao = await responder(estudante.agente, questaoId, ERRADO)
    expect(codigos(acao)).toEqual(['primeiros_passos', 'maratonista'])
    expect((await catalogo(estudante.agente)).get('maratonista')).toMatchObject({ desbloqueada: true })
  })

  it('TC-09/R-C6: desbloqueio é permanente — nova aula ou exclusão do curso não o remove', async () => {
    const { professor, cursoId, moduloId } = await cursoPublicado()
    const aulaId = await novaAula(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    expect(codigos(await concluir(estudante.agente, aulaId))).toEqual(['primeiros_passos', 'curso_concluido'])

    await novaAula(professor.agente, moduloId)
    expect((await catalogo(estudante.agente)).get('curso_concluido')).toMatchObject({ progresso: 1, desbloqueada: true })

    expect((await professor.agente.delete(`/api/v1/cursos/${cursoId}`)).status).toBe(204)
    expect(await desbloqueadas(estudante.id)).toEqual(['curso_concluido', 'primeiros_passos'])
    const perfil = await estudante.agente.get(`/api/v1/perfis/${estudante.id}`)
    expect(perfil.body.conquistas.map((item: { codigo: string }) => item.codigo).sort()).toEqual([
      'curso_concluido',
      'primeiros_passos',
    ])
  })

  it('TC-10/R-C10: F5-06 devolve os 10 itens na ordem, com progresso limitado à meta; só estudante', async () => {
    const estudante = await criarUsuarioComSessao('estudante')
    const resposta = await estudante.agente.get('/api/v1/conquistas')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toHaveLength(10)
    expect(resposta.body[0]).toEqual({
      codigo: 'primeiros_passos',
      nome: 'Primeiros passos',
      descricao: 'Concluiu a primeira aula',
      meta: 1,
      progresso: 0,
      desbloqueada: false,
      desbloqueadaEm: null,
    })
    expect(resposta.body.map((item: { codigo: string }) => item.codigo)).toEqual([
      'primeiros_passos', 'maratonista', 'curso_concluido', 'colecionador_de_cursos', 'primeiro_acerto',
      'mente_afiada', 'avaliado', 'nota_maxima', 'subindo_de_nivel', 'veterano',
    ])
    expect(resposta.body.find((item: { codigo: string }) => item.codigo === 'veterano').progresso).toBe(1)

    const professor = await criarUsuarioComSessao('professor')
    const admin = await criarUsuarioComSessao('administrador')
    expect((await professor.agente.get('/api/v1/conquistas')).status).toBe(403)
    expect((await admin.agente.get('/api/v1/conquistas')).status).toBe(403)
    expect((await request(app).get('/api/v1/conquistas')).status).toBe(401)
  })

  it('TC-11/R-C9: perfil lista desbloqueadas a outro usuário, sem progresso; professor → []', async () => {
    const { professor, moduloId } = await cursoPublicado()
    await novaAula(professor.agente, moduloId)
    const aulaId = await novaAula(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    await concluir(estudante.agente, aulaId)

    const outro = await criarUsuarioComSessao('estudante')
    const perfil = await outro.agente.get(`/api/v1/perfis/${estudante.id}`)
    expect(perfil.body.conquistas).toEqual([
      { codigo: 'primeiros_passos', nome: 'Primeiros passos', desbloqueadaEm: expect.any(String) },
    ])
    expect(JSON.stringify(perfil.body)).not.toContain('progresso')
    expect((await outro.agente.get(`/api/v1/perfis/${professor.id}`)).body.conquistas).toEqual([])
  })

  it('TC-12/U-5: desbloqueio não concede XP nem cria eventos', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await novaAula(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    const conclusao = await concluir(estudante.agente, aulaId)
    expect(codigos(conclusao)).toEqual(['primeiros_passos', 'curso_concluido'])
    expect(conclusao.body.xp).toMatchObject({ ganho: 10, total: 10 })
    expect(await prisma.eventoXp.count({ where: { usuario_id: estudante.id } })).toBe(1)
    expect((await prisma.saldoXp.findUnique({ where: { usuario_id: estudante.id } }))?.xp_total).toBe(10)
  })

  it('TC-13/R-C5: falha ao gravar o desbloqueio desfaz a ação e o XP', async () => {
    const { professor, moduloId } = await cursoPublicado()
    const aulaId = await novaAula(professor.agente, moduloId)
    const estudante = await criarUsuarioComSessao('estudante')
    const sufixo = randomUUID().replace(/-/g, '')
    // gatilho restrito a este estudante: não interfere nos demais testes
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION falha_conquista_${sufixo}() RETURNS trigger AS $$ BEGIN
         IF NEW.usuario_id = '${estudante.id}'::uuid THEN RAISE EXCEPTION 'falha simulada'; END IF;
         RETURN NEW; END $$ LANGUAGE plpgsql`
    )
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER falha_conquista_${sufixo} BEFORE INSERT ON desbloqueio_conquista
       FOR EACH ROW EXECUTE FUNCTION falha_conquista_${sufixo}()`
    )
    try {
      expect((await concluir(estudante.agente, aulaId)).status).toBe(500)
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER falha_conquista_${sufixo} ON desbloqueio_conquista`)
      await prisma.$executeRawUnsafe(`DROP FUNCTION falha_conquista_${sufixo}()`)
    }
    expect(await prisma.conclusaoAula.count({ where: { usuario_id: estudante.id } })).toBe(0)
    expect(await prisma.eventoXp.count({ where: { usuario_id: estudante.id } })).toBe(0)
    expect(await prisma.saldoXp.findUnique({ where: { usuario_id: estudante.id } })).toBeNull()

    const novamente = await concluir(estudante.agente, aulaId)
    expect(novamente.status).toBe(201)
    expect(codigos(novamente)).toEqual(['primeiros_passos', 'curso_concluido'])
  })
})
