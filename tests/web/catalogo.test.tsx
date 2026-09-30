// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from '../../src/web/App'

function respostaJson(dados: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(dados),
  }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const sessaoProfessor = {
  usuarioId: '22222222-2222-4222-8222-222222222222',
  papel: 'professor',
  expiraEm: new Date(Date.now() + 60_000).toISOString(),
}

const sessaoEstudante = {
  usuarioId: '33333333-3333-4333-8333-333333333333',
  papel: 'estudante',
  expiraEm: new Date(Date.now() + 60_000).toISOString(),
}

function mockDeSessao(sessao: typeof sessaoProfessor) {
  return async (url: unknown, _init?: { method?: string; body?: string }) => {
    const alvo = String(url)
    if (alvo.includes('/auth/sessao')) return respostaJson(sessao)
    if (alvo.includes('/perfis/')) {
      return respostaJson({
        id: sessao.usuarioId,
        papel: sessao.papel,
        nivel: null,
        conquistas: [],
        inventario: [],
      })
    }
    return respostaJson({ erro: { codigo: 'nao_encontrado', mensagem: 'nao encontrado' } }, 404)
  }
}

describe('T2.6 — superfície web do catálogo (F2-01, F2-13, F2-14)', () => {
  it('professor cria um curso pelo formulário: POST {titulo} e o curso aparece na lista', async () => {
    let cursos: { id: string; titulo: string; publicado: boolean; donoId: string }[] = []
    const base = mockDeSessao(sessaoProfessor)
    const fetchMock = vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
      const alvo = String(url)
      const metodo = init?.method ?? 'GET'
      if (alvo.endsWith('/api/v1/cursos') && metodo === 'POST') {
        const corpo = JSON.parse(init?.body ?? '{}') as { titulo: string }
        cursos = [
          {
            id: '44444444-4444-4444-8444-444444444444',
            titulo: corpo.titulo,
            publicado: false,
            donoId: sessaoProfessor.usuarioId,
          },
        ]
        return respostaJson({ cursoId: cursos[0].id }, 201)
      }
      if (alvo.endsWith('/api/v1/cursos')) return respostaJson(cursos)
      return base(url, init)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    await screen.findByText('Nenhum curso disponível.')

    const entrada = screen.getByLabelText('Novo curso')
    fireEvent.change(entrada, { target: { value: 'Curso novo' } })
    fireEvent.submit(entrada.closest('form')!)

    await waitFor(() => expect(screen.getByText('Curso novo — Rascunho')).toBeTruthy())
    expect(screen.getByText('Curso criado.')).toBeTruthy()

    const chamada = fetchMock.mock.calls.find((chamada) => {
      const [, init] = chamada as [unknown, { method?: string }?]
      return init?.method === 'POST'
    })
    expect(chamada).toBeTruthy()
    const [, init] = chamada as [unknown, { body?: string }]
    expect(JSON.parse(init?.body ?? '{}')).toEqual({ titulo: 'Curso novo' })
  })

  it('estudante abre a estrutura, consome o conteúdo da aula e conclui (F2-03/F2-13/F2-14)', async () => {
    const cursoId = '55555555-5555-4555-8555-555555555555'
    const moduloId = '66666666-6666-4666-8666-666666666666'
    const aulaId = '77777777-7777-4777-8777-777777777777'
    const base = mockDeSessao(sessaoEstudante)
    const fetchMock = vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
      const alvo = String(url)
      const metodo = init?.method ?? 'GET'
      if (alvo.endsWith('/api/v1/cursos') && metodo === 'GET') {
        return respostaJson([{ id: cursoId, titulo: 'Algebra', publicado: true, donoId: 'dono' }])
      }
      if (alvo === `/api/v1/cursos/${cursoId}`) {
        return respostaJson({
          id: cursoId,
          titulo: 'Algebra',
          publicado: true,
          donoId: 'dono',
          modulos: [
            {
              id: moduloId,
              titulo: 'Fundamentos',
              publicado: true,
              aulas: [{ id: aulaId, titulo: 'Equacoes', publicado: true }],
            },
          ],
        })
      }
      if (alvo === `/api/v1/aulas/${aulaId}` && metodo === 'GET') {
        return respostaJson({
          id: aulaId,
          titulo: 'Equacoes',
          publicado: true,
          conteudo: [
            { id: 'bloco-1', tipo: 'texto', posicao: 0, dados: { texto: 'x + y = z\n<b>nao e html</b>' } },
            {
              id: 'bloco-2',
              tipo: 'midia_embedada',
              posicao: 1,
              dados: { url: 'https://provedor.example/embed/abc' },
            },
            {
              id: 'bloco-3',
              tipo: 'material_anexo',
              posicao: 2,
              dados: { arquivoId: 'arq-1', nome: 'lista.pdf', mime: 'application/pdf', tamanho: 2048 },
            },
          ],
        })
      }
      if (alvo === `/api/v1/aulas/${aulaId}/conclusao` && metodo === 'POST') {
        return respostaJson({ aulaId, concluidaEm: '2026-09-30T12:00:00.000Z' }, 201)
      }
      return base(url, init)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    await screen.findByText('Algebra — Publicado')

    fireEvent.click(screen.getByText('Abrir'))
    await screen.findByText('Fundamentos — Publicado')
    expect(screen.getByText('Equacoes — Publicado')).toBeTruthy()

    fireEvent.click(screen.getByText('Abrir aula'))
    await screen.findByText('Conteudo')
    const texto = screen.getByText(/x \+ y = z/)
    expect(texto.textContent).toBe('x + y = z\n<b>nao e html</b>')
    expect(texto.querySelector('b')).toBeNull()
    const iframe = screen.getByTitle('Midia da aula')
    expect(iframe.getAttribute('src')).toBe('https://provedor.example/embed/abc')
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-popups allow-presentation')
    expect(screen.getByText('Abrir midia em nova aba').getAttribute('rel')).toContain('noopener')
    expect(screen.getByText('Baixar lista.pdf').getAttribute('href')).toBe('/api/v1/arquivos/arq-1')
    const ordem = Array.from(document.querySelectorAll('ol > li')).map((item) => item.textContent ?? '')
    expect(ordem[0]).toContain('x + y = z')
    expect(ordem[1]).toContain('Abrir midia')
    expect(ordem[2]).toContain('Baixar lista.pdf')
    expect(screen.queryByLabelText('Tipo do bloco')).toBeNull()

    fireEvent.click(screen.getByText('Marcar aula como concluida'))
    await waitFor(() => expect(screen.getByText('Conclusao registrada.')).toBeTruthy())
    const conclusao = fetchMock.mock.calls.find((chamada) => {
      const [, init] = chamada as [unknown, { method?: string }?]
      return init?.method === 'POST' && String(chamada[0]).includes('/conclusao')
    })
    expect(conclusao).toBeTruthy()
  })

  it('professor dono edita por formulário: texto, mídia https e anexo via F2-15, reenviando anexo como {arquivoId} (R-C8/A-3)', async () => {
    const cursoId = '88888888-8888-4888-8888-888888888888'
    const aulaId = '99999999-9999-4999-8999-999999999999'
    const base = mockDeSessao(sessaoProfessor)
    let conteudo: unknown[] = [
      {
        id: 'bloco-1',
        tipo: 'material_anexo',
        posicao: 0,
        dados: { arquivoId: 'arq-1', nome: 'antigo.pdf', mime: 'application/pdf', tamanho: 10 },
      },
    ]
    const envios: unknown[] = []
    const uploads: { nome: string; mime: string; base64: string }[] = []
    const fetchMock = vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
      const alvo = String(url)
      const metodo = init?.method ?? 'GET'
      if (alvo.endsWith('/api/v1/cursos') && metodo === 'GET') {
        return respostaJson([
          { id: cursoId, titulo: 'Fisica', publicado: false, donoId: sessaoProfessor.usuarioId },
        ])
      }
      if (alvo === `/api/v1/cursos/${cursoId}`) {
        return respostaJson({
          id: cursoId,
          titulo: 'Fisica',
          publicado: false,
          donoId: sessaoProfessor.usuarioId,
          modulos: [
            { id: 'mod-1', titulo: 'Cinematica', publicado: false, aulas: [{ id: aulaId, titulo: 'MRU', publicado: false }] },
          ],
        })
      }
      if (alvo === `/api/v1/aulas/${aulaId}` && metodo === 'GET') {
        return respostaJson({ id: aulaId, titulo: 'MRU', publicado: false, conteudo })
      }
      if (alvo === `/api/v1/aulas/${aulaId}/arquivos` && metodo === 'POST') {
        const corpo = JSON.parse(init?.body ?? '{}')
        uploads.push(corpo)
        return respostaJson({ arquivoId: 'arq-2', nome: corpo.nome, mime: corpo.mime, tamanho: 4 }, 201)
      }
      if (alvo === `/api/v1/aulas/${aulaId}/conteudo` && metodo === 'PUT') {
        const corpo = JSON.parse(init?.body ?? '[]') as { tipo: string; dados: unknown }[]
        envios.push(corpo)
        conteudo = corpo.map((bloco, posicao) => ({ id: `novo-${posicao}`, posicao, ...bloco }))
        return { ok: true, status: 204, text: async () => '' }
      }
      return base(url, init)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Abrir aula'))
    await screen.findByText('Baixar antigo.pdf')
    expect(screen.queryByLabelText(/JSON/)).toBeNull()

    const texto = screen.getByLabelText('Texto')
    fireEvent.change(texto, { target: { value: 'Velocidade constante.' } })
    fireEvent.submit(texto.closest('form')!)
    await waitFor(() => expect(envios).toHaveLength(1))
    expect(envios[0]).toEqual([
      { tipo: 'material_anexo', dados: { arquivoId: 'arq-1' } },
      { tipo: 'texto', dados: { texto: 'Velocidade constante.' } },
    ])
    await screen.findByText('Velocidade constante.')

    fireEvent.change(screen.getByLabelText('Tipo do bloco'), { target: { value: 'midia_embedada' } })
    const url = screen.getByLabelText('URL da midia (https)')
    fireEvent.change(url, { target: { value: 'http://inseguro.example/v' } })
    fireEvent.submit(url.closest('form')!)
    await screen.findByText('A URL da midia precisa comecar com https://.')
    expect(envios).toHaveLength(1)

    fireEvent.change(screen.getByLabelText('Tipo do bloco'), { target: { value: 'material_anexo' } })
    const campoArquivo = screen.getByLabelText(/Arquivo \(PDF/)
    expect(campoArquivo.getAttribute('accept')).toContain('application/pdf')
    const arquivo = new File(['%PDF'], 'nova.pdf', { type: 'application/pdf' })
    fireEvent.change(campoArquivo, { target: { files: [arquivo] } })
    fireEvent.submit(campoArquivo.closest('form')!)
    await waitFor(() => expect(envios).toHaveLength(2))
    expect(uploads).toEqual([{ nome: 'nova.pdf', mime: 'application/pdf', base64: 'JVBERg==' }])
    expect(envios[1]).toEqual([
      { tipo: 'material_anexo', dados: { arquivoId: 'arq-1' } },
      { tipo: 'texto', dados: { texto: 'Velocidade constante.' } },
      { tipo: 'material_anexo', dados: { arquivoId: 'arq-2' } },
    ])
  })
})
