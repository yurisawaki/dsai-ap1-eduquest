import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { criarUsuarioComSessao } from '../utilidades/aplicacao'

type Agente = ReturnType<typeof request.agent>

async function criarAulaPropria() {
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

async function publicarCadeia(agente: Agente, ids: { cursoId: string; moduloId: string; aulaId: string }) {
  await agente.patch(`/api/v1/cursos/${ids.cursoId}`).send({ publicado: true })
  await agente.patch(`/api/v1/modulos/${ids.moduloId}`).send({ publicado: true })
  await agente.patch(`/api/v1/aulas/${ids.aulaId}`).send({ publicado: true })
}

describe('T2.3 — conteúdo de aula (F2-12/F2-13, E-24, R-18/AC-10)', () => {
  it('PUT aceita os 3 tipos declarados e devolve 204; GET devolve a lista preservada (F2-12/F2-13)', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const blocos = [
      { tipo: 'texto', dados: { markdown: 'Bem-vindos' } },
      { tipo: 'midia_embedada', dados: { url: 'https://provedor.example/v/abc' } },
      { tipo: 'material_anexo', dados: { nome: 'lista.pdf' } },
    ]

    const escrita = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .send(blocos)
    expect(escrita.status).toBe(204)
    expect(escrita.body).toEqual({})

    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(leitura.status).toBe(200)
    expect(leitura.body).toEqual({
      id: aulaId,
      titulo: 'Aula',
      publicado: false,
      conteudo: [
        { id: expect.any(String), tipo: 'texto', dados: { markdown: 'Bem-vindos' } },
        { id: expect.any(String), tipo: 'midia_embedada', dados: { url: 'https://provedor.example/v/abc' } },
        { id: expect.any(String), tipo: 'material_anexo', dados: { nome: 'lista.pdf' } },
      ],
    })
    const ids = leitura.body.conteudo.map((bloco: { id: string }) => bloco.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('PUT substitui totalmente: objeto único, lista e lista vazia (cardinalidade aberta — DP-19)', async () => {
    const { professor, aulaId } = await criarAulaPropria()

    const objeto = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .send({ tipo: 'texto', dados: { texto: 'primeiro' } })
    expect(objeto.status).toBe(204)

    const lista = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .send([
        { tipo: 'texto', dados: { texto: 'a' } },
        { tipo: 'texto', dados: { texto: 'b' } },
      ])
    expect(lista.status).toBe(204)
    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(leitura.body.conteudo).toHaveLength(2)

    const limpeza = await professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send([])
    expect(limpeza.status).toBe(204)
    const vazia = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(vazia.body.conteudo).toEqual([])
  })

  it('formato inválido responde 400; validade final fica com DP-19 (E-24/AC-14)', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const invalidos: (object | string)[] = [
      {},
      { tipo: 'video' },
      { tipo: 42, dados: {} },
      { tipo: 'texto' },
      { tipo: 'texto', dados: null },
      [{ tipo: 'texto', dados: {} }, 'nao-e-bloco'],
      'corpo textual',
    ]
    for (const corpo of invalidos) {
      const resposta = await professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send(corpo)
      expect(resposta.status, JSON.stringify(corpo)).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }

    const malformado = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .set('Content-Type', 'application/json')
      .send('{nao-e-json')
    expect(malformado.status).toBe(400)
    expect(malformado.body.erro.codigo).toBe('validacao')

    const numero = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .set('Content-Type', 'application/json')
      .send('7')
    expect(numero.status).toBe(400)
    expect(numero.body.erro.codigo).toBe('validacao')
  })

  it('corpo multipart é rejeitado: não existe caminho de upload no EduQuest (R-18/AC-10)', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const resposta = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .set('Content-Type', 'multipart/form-data; boundary=----x')
      .send(
        '------x\r\nContent-Disposition: form-data; name="arquivo"; filename="video.mp4"\r\n\r\nbinario\r\n------x--\r\n'
      )
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('validacao')

    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(leitura.body.conteudo).toEqual([])
  })

  it('dono lê o próprio rascunho (preview 200); leitor comum vê só após publicar a cadeia (E-20/R-14)', async () => {
    const { professor, cursoId, moduloId, aulaId } = await criarAulaPropria()
    const estudante = await criarUsuarioComSessao('estudante')
    await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .send({ tipo: 'texto', dados: { texto: 'rascunho' } })

    const rascunho = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(rascunho.status).toBe(200)
    expect(rascunho.body.conteudo).toHaveLength(1)

    const bloqueio = await estudante.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(bloqueio.status).toBe(404)
    expect(bloqueio.body.erro.codigo).toBe('nao_encontrado')

    await publicarCadeia(professor.agente, { cursoId, moduloId, aulaId })
    const publicada = await estudante.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(publicada.status).toBe(200)
    expect(publicada.body.conteudo[0].dados).toEqual({ texto: 'rascunho' })
  })
})
