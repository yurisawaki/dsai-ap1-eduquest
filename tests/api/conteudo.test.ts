import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/server/prisma'
import { api, criarUsuarioComSessao } from '../utilidades/aplicacao'

type Agente = ReturnType<typeof request.agent>

const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(100, 0x20)])
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

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

function enviarArquivo(agente: Agente, aulaId: string, nome: string, mime: string, binario: Buffer) {
  return agente
    .post(`/api/v1/aulas/${aulaId}/arquivos`)
    .send({ nome, mime, base64: binario.toString('base64') })
}

describe('T2.3 — conteúdo de aula: F2-12/F2-13 definitivos (SPEC de conteúdo, DP-19)', () => {
  it('TC-01/TC-15: PUT [] → 204 e GET devolve conteudo como array vazio', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const inicial = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(inicial.body.conteudo).toEqual([])

    const escrita = await professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send([])
    expect(escrita.status).toBe(204)
    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(leitura.status).toBe(200)
    expect(leitura.body.conteudo).toEqual([])
  })

  it('TC-02: corpo que não é array de até 50 blocos → 400', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const bloco = { tipo: 'texto', dados: { texto: 'x' } }
    const invalidos: unknown[] = [bloco, Array.from({ length: 51 }, () => bloco), 'corpo textual']
    for (const corpo of invalidos) {
      const resposta = await professor.agente
        .put(`/api/v1/aulas/${aulaId}/conteudo`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(corpo))
      expect(resposta.status, JSON.stringify(corpo).slice(0, 60)).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }
    const cinquenta = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .send(Array.from({ length: 50 }, () => bloco))
    expect(cinquenta.status).toBe(204)
  })

  it('TC-03/AC-12: 3 blocos em ordem mista voltam com posicao 0,1,2 na ordem enviada e dados espelhados', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const blocos = [
      { tipo: 'midia_embedada', dados: { url: 'https://provedor.example/embed/abc' } },
      { tipo: 'texto', dados: { texto: 'Bem-vindos.\nLeiam abaixo.' } },
      { tipo: 'texto', dados: { texto: 'segundo texto' } },
    ]
    const escrita = await professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send(blocos)
    expect(escrita.status).toBe(204)
    expect(escrita.body).toEqual({})

    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(leitura.body.conteudo).toEqual(
      blocos.map((bloco, posicao) => ({ id: expect.any(String), posicao, ...bloco }))
    )

    const invertida = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .send([...blocos].reverse())
    expect(invertida.status).toBe(204)
    const releitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(releitura.body.conteudo.map((bloco: { posicao: number }) => bloco.posicao)).toEqual([0, 1, 2])
    expect(releitura.body.conteudo[0].dados).toEqual({ texto: 'segundo texto' })
  })

  it('TC-04/TC-19: texto vazio ou acima de 20.000 pontos de código → 400; no limite → 204', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const put = (texto: string) =>
      professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send([{ tipo: 'texto', dados: { texto } }])

    expect((await put('   \n  ')).status).toBe(400)
    expect((await put('a'.repeat(20_001))).status).toBe(400)
    expect((await put('a'.repeat(20_000))).status).toBe(204)
    expect((await put('😀'.repeat(20_000))).status).toBe(204)
    expect((await put('😀'.repeat(20_001))).status).toBe(400)
  })

  it('TC-05/TC-13: chaves extras, posicao no corpo, dados nulo e JSON malformado → 400', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const invalidos: unknown[] = [
      [{ tipo: 'texto', dados: { texto: 'x', cor: 'vermelho' } }],
      [{ tipo: 'texto', dados: { markdown: 'x' } }],
      [{ tipo: 'texto', posicao: 0, dados: { texto: 'x' } }],
      [{ tipo: 'texto', dados: null }],
      [{ tipo: 'texto' }],
      [{ tipo: 'video', dados: { url: 'https://provedor.example/v' } }],
      [{ tipo: 42, dados: {} }],
      [{ tipo: 'texto', dados: { texto: 'ok' } }, 'nao-e-bloco'],
    ]
    for (const corpo of invalidos) {
      const resposta = await professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send(corpo as object)
      expect(resposta.status, JSON.stringify(corpo)).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }

    const malformado = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .set('Content-Type', 'application/json')
      .send('{nao-e-json')
    expect(malformado.status).toBe(400)
    expect(malformado.body.erro.codigo).toBe('validacao')

    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(leitura.body.conteudo).toEqual([])
  })

  it('TC-06: mídia só com URL https válida, sem credenciais; URL devolvida sem reescrita', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const put = (url: string) =>
      professor.agente
        .put(`/api/v1/aulas/${aulaId}/conteudo`)
        .send([{ tipo: 'midia_embedada', dados: { url } }])

    for (const url of [
      'http://provedor.example/embed/abc',
      'javascript:alert(1)',
      'data:text/html,oi',
      'https://usuario:senha@provedor.example/embed',
      'nao e url',
      `https://provedor.example/${'a'.repeat(2_048)}`,
    ]) {
      expect((await put(url)).status, url).toBe(400)
    }

    const url = 'https://provedor.example/embed/abc?t=10'
    expect((await put(url)).status).toBe(204)
    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(leitura.body.conteudo[0].dados).toEqual({ url })
  })

  it('TC-17: PUT com 50 blocos de 20.000 caracteres → 204; corpo acima de 8 MiB → 400 (não 413/500)', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const cheio = Array.from({ length: 50 }, () => ({ tipo: 'texto', dados: { texto: 'a'.repeat(20_000) } }))
    const aceito = await professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send(cheio)
    expect(aceito.status).toBe(204)

    const gigante = await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ tipo: 'texto', dados: { texto: 'a'.repeat(9 * 1024 * 1024) } }]))
    expect(gigante.status).toBe(400)
    expect(gigante.body.erro.codigo).toBe('validacao')
  })

  it('R-C10: ordem 401 → 404 → 403 → 400 no PUT', async () => {
    const { aulaId } = await criarAulaPropria()
    const outro = await criarUsuarioComSessao('professor')

    expect((await api.put(`/api/v1/aulas/${aulaId}/conteudo`).send('x')).status).toBe(401)
    expect((await outro.agente.put(`/api/v1/aulas/${randomUUID()}/conteudo`).send([])).status).toBe(404)
    expect((await outro.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send({ x: 1 })).status).toBe(403)
  })

  it('dono e admin leem o rascunho (preview 200); leitor comum vê só após publicar a cadeia (E-20/R-14)', async () => {
    const { professor, cursoId, moduloId, aulaId } = await criarAulaPropria()
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')
    await professor.agente
      .put(`/api/v1/aulas/${aulaId}/conteudo`)
      .send([{ tipo: 'texto', dados: { texto: 'rascunho' } }])

    const rascunho = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(rascunho.status).toBe(200)
    expect(rascunho.body.conteudo).toHaveLength(1)

    const previewAdmin = await admin.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(previewAdmin.status).toBe(200)
    expect(previewAdmin.body.conteudo[0].dados).toEqual({ texto: 'rascunho' })

    const bloqueio = await estudante.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(bloqueio.status).toBe(404)
    expect(bloqueio.body.erro.codigo).toBe('nao_encontrado')

    await publicarCadeia(professor.agente, { cursoId, moduloId, aulaId })
    const publicada = await estudante.agente.get(`/api/v1/aulas/${aulaId}`)
    expect(publicada.status).toBe(200)
    expect(publicada.body.conteudo[0].dados).toEqual({ texto: 'rascunho' })
  })
})

describe('T2.3 — material anexo: F2-15/F2-16 (SPEC de conteúdo, DP-19)', () => {
  it('TC-07/TC-14/AC-10: multipart e tipos proibidos (vídeo, HTML, SVG) → 400; nada é gravado', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const multipart = '------x\r\nContent-Disposition: form-data; name="arquivo"; filename="video.mp4"\r\n\r\nbinario\r\n------x--\r\n'
    for (const rota of [`/api/v1/aulas/${aulaId}/arquivos`, `/api/v1/aulas/${aulaId}/conteudo`]) {
      const envio = rota.endsWith('arquivos')
        ? professor.agente.post(rota)
        : professor.agente.put(rota)
      const resposta = await envio.set('Content-Type', 'multipart/form-data; boundary=----x').send(multipart)
      expect(resposta.status, rota).toBe(400)
      expect(resposta.body.erro.codigo).toBe('validacao')
    }

    for (const [nome, mime] of [
      ['aula.mp4', 'video/mp4'],
      ['pagina.html', 'text/html'],
      ['desenho.svg', 'image/svg+xml'],
      ['som.mp3', 'audio/mpeg'],
    ]) {
      const resposta = await enviarArquivo(professor.agente, aulaId, nome, mime, PDF)
      expect(resposta.status, mime).toBe(400)
    }
    expect(await prisma.arquivo.count({ where: { aula_id: aulaId } })).toBe(0)
  })

  it('TC-08: PDF válido → 201 com tamanho decodificado; PNG declarado como PDF → 400', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const aceito = await enviarArquivo(professor.agente, aulaId, 'lista.pdf', 'application/pdf', PDF)
    expect(aceito.status).toBe(201)
    expect(aceito.body).toEqual({
      arquivoId: expect.any(String),
      nome: 'lista.pdf',
      mime: 'application/pdf',
      tamanho: PDF.length,
    })

    const divergente = await enviarArquivo(professor.agente, aulaId, 'lista.pdf', 'application/pdf', PNG)
    expect(divergente.status).toBe(400)
    const png = await enviarArquivo(professor.agente, aulaId, 'figura.png', 'image/png', PNG)
    expect(png.status).toBe(201)
  })

  it('TC-09/TC-18: limites de tamanho, quantidade, nome e extensão', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const acimaDe5MB = Buffer.concat([PDF, Buffer.alloc(5_242_880)])
    expect((await enviarArquivo(professor.agente, aulaId, 'grande.pdf', 'application/pdf', acimaDe5MB)).status).toBe(400)
    const seisMB = Buffer.concat([PDF, Buffer.alloc(6 * 1024 * 1024)])
    const corpoGrande = await enviarArquivo(professor.agente, aulaId, 'grande.pdf', 'application/pdf', seisMB)
    expect(corpoGrande.status).toBe(400)

    for (const nome of ['../../etc/passwd', 'pasta\\lista.pdf', 'lista', 'lista.png', '', `${'a'.repeat(252)}.pdf`, 'lis\nta.pdf']) {
      const resposta = await enviarArquivo(professor.agente, aulaId, nome, 'application/pdf', PDF)
      expect(resposta.status, JSON.stringify(nome)).toBe(400)
    }
    const maiuscula = await enviarArquivo(professor.agente, aulaId, 'LISTA.PDF', 'application/pdf', PDF)
    expect(maiuscula.status).toBe(201)

    const invalidos: unknown[] = [
      { nome: 'a.pdf', mime: 'application/pdf', base64: '%%%' },
      { nome: 'a.pdf', mime: 'application/pdf', base64: '' },
      { nome: 'a.pdf', mime: 'application/pdf', base64: PDF.toString('base64'), extra: 1 },
      { nome: 'a.pdf', mime: 'application/pdf' },
    ]
    for (const corpo of invalidos) {
      const resposta = await professor.agente.post(`/api/v1/aulas/${aulaId}/arquivos`).send(corpo as object)
      expect(resposta.status, JSON.stringify(corpo).slice(0, 80)).toBe(400)
    }

    for (let indice = 1; indice < 25; indice++) {
      const resposta = await enviarArquivo(professor.agente, aulaId, `f${indice}.pdf`, 'application/pdf', PDF)
      expect(resposta.status).toBe(201)
    }
    const excedente = await enviarArquivo(professor.agente, aulaId, 'f26.pdf', 'application/pdf', PDF)
    expect(excedente.status).toBe(400)
  })

  it('TC-10: F2-15 sem sessão → 401; aula inexistente → 404; não-dono → 403; admin → 201', async () => {
    const { aulaId } = await criarAulaPropria()
    const outro = await criarUsuarioComSessao('professor')
    const estudante = await criarUsuarioComSessao('estudante')
    const admin = await criarUsuarioComSessao('administrador')
    const corpo = { nome: 'a.pdf', mime: 'application/pdf', base64: PDF.toString('base64') }

    expect((await api.post(`/api/v1/aulas/${aulaId}/arquivos`).send(corpo)).status).toBe(401)
    expect((await outro.agente.post(`/api/v1/aulas/${randomUUID()}/arquivos`).send(corpo)).status).toBe(404)
    expect((await outro.agente.post(`/api/v1/aulas/${aulaId}/arquivos`).send({})).status).toBe(403)
    expect((await estudante.agente.post(`/api/v1/aulas/${aulaId}/arquivos`).send(corpo)).status).toBe(403)
    expect((await admin.agente.post(`/api/v1/aulas/${aulaId}/arquivos`).send(corpo)).status).toBe(201)
  })

  it('TC-11/TC-16: PUT referencia arquivo da mesma aula; GET enriquece; reenvio só com arquivoId', async () => {
    const { professor, aulaId } = await criarAulaPropria()
    const outraAula = await criarAulaPropria()
    const doOutro = await enviarArquivo(outraAula.professor.agente, outraAula.aulaId, 'x.pdf', 'application/pdf', PDF)
    const proprio = await enviarArquivo(professor.agente, aulaId, 'lista.pdf', 'application/pdf', PDF)
    const put = (dados: object) =>
      professor.agente.put(`/api/v1/aulas/${aulaId}/conteudo`).send([{ tipo: 'material_anexo', dados }])

    expect((await put({ arquivoId: doOutro.body.arquivoId })).status).toBe(400)
    expect((await put({ arquivoId: randomUUID() })).status).toBe(400)
    expect((await put({ arquivoId: 'nao-e-uuid' })).status).toBe(400)
    expect((await put({ arquivoId: proprio.body.arquivoId })).status).toBe(204)

    const leitura = await professor.agente.get(`/api/v1/aulas/${aulaId}`)
    const enriquecido = leitura.body.conteudo[0].dados
    expect(enriquecido).toEqual({
      arquivoId: proprio.body.arquivoId,
      nome: 'lista.pdf',
      mime: 'application/pdf',
      tamanho: PDF.length,
    })

    expect((await put(enriquecido)).status).toBe(400)
    expect((await put({ arquivoId: enriquecido.arquivoId })).status).toBe(204)
  })

  it('TC-12/R-C7: F2-16 replica a visibilidade da aula e baixa como attachment com nosniff', async () => {
    const { professor, cursoId, moduloId, aulaId } = await criarAulaPropria()
    const estudante = await criarUsuarioComSessao('estudante')
    const envio = await enviarArquivo(professor.agente, aulaId, 'lista de exercícios ✓.pdf', 'application/pdf', PDF)
    const rota = `/api/v1/arquivos/${envio.body.arquivoId}`

    expect((await api.get(rota)).status).toBe(401)
    expect((await estudante.agente.get(rota)).status).toBe(404)
    expect((await estudante.agente.get(`/api/v1/arquivos/${randomUUID()}`)).status).toBe(404)

    const dono = await professor.agente.get(rota).buffer(true).parse((resposta, pronto) => {
      const partes: Buffer[] = []
      resposta.on('data', (parte: Buffer) => partes.push(parte))
      resposta.on('end', () => pronto(null, Buffer.concat(partes)))
    })
    expect(dono.status).toBe(200)
    expect(dono.headers['content-type']).toBe('application/pdf')
    expect(dono.headers['x-content-type-options']).toBe('nosniff')
    expect(dono.headers['content-disposition']).toMatch(/^attachment;/)
    expect(dono.headers['content-disposition']).toContain("filename*=UTF-8''lista%20de%20exerc%C3%ADcios%20%E2%9C%93.pdf")
    expect(Buffer.compare(dono.body as Buffer, PDF)).toBe(0)

    await publicarCadeia(professor.agente, { cursoId, moduloId, aulaId })
    expect((await estudante.agente.get(rota)).status).toBe(200)
  })

  it('TC-20: excluir o curso remove os arquivos da aula (CASCADE, binário incluso)', async () => {
    const { professor, cursoId, aulaId } = await criarAulaPropria()
    const envio = await enviarArquivo(professor.agente, aulaId, 'lista.pdf', 'application/pdf', PDF)
    expect(await prisma.arquivo.count({ where: { aula_id: aulaId } })).toBe(1)

    expect((await professor.agente.delete(`/api/v1/cursos/${cursoId}`)).status).toBe(204)
    expect(await prisma.arquivo.count({ where: { id: envio.body.arquivoId } })).toBe(0)
    expect((await professor.agente.get(`/api/v1/arquivos/${envio.body.arquivoId}`)).status).toBe(404)
  })
})
