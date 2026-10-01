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

const cursoId = '55555555-5555-4555-8555-555555555555'
const moduloId = '66666666-6666-4666-8666-666666666666'
const aulaId = '77777777-7777-4777-8777-777777777777'

interface OpcoesRoteiro {
  falharConclusao?: boolean
}

function fetchDeAula(
  sessao: typeof sessaoProfessor,
  conteudo: unknown[],
  opcoes: OpcoesRoteiro = {}
) {
  const base = mockDeSessao(sessao)
  return vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
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
      return respostaJson({ id: aulaId, titulo: 'Equacoes', publicado: true, conteudo, concluida: false })
    }
    if (alvo === `/api/v1/aulas/${aulaId}/conclusao` && metodo === 'POST') {
      if (opcoes.falharConclusao) {
        return respostaJson(
          { erro: { codigo: 'interno', mensagem: 'falha ao registrar' } },
          500
        )
      }
      return respostaJson({ aulaId, concluidaEm: '2026-09-30T12:00:00.000Z' }, 201)
    }
    return base(url, init)
  })
}

async function abrirAula() {
  render(<App />)
  fireEvent.click(await screen.findByText('Catálogo'))
  await screen.findByText('Algebra')
  expect(screen.getByText('Publicado')).toBeTruthy()
  fireEvent.click(screen.getByText('Abrir'))
  await screen.findByText('Fundamentos')
  fireEvent.click(screen.getByText('Abrir aula'))
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

    await waitFor(() => expect(screen.getByText('Curso novo')).toBeTruthy())
    expect(screen.getByText('Rascunho')).toBeTruthy()
    expect(screen.getByText('Curso criado.')).toBeTruthy()

    const chamada = fetchMock.mock.calls.find((chamada) => {
      const [, init] = chamada as [unknown, { method?: string }?]
      return init?.method === 'POST'
    })
    expect(chamada).toBeTruthy()
    const [, init] = chamada as [unknown, { body?: string }]
    expect(JSON.parse(init?.body ?? '{}')).toEqual({ titulo: 'Curso novo' })
  })

  it('estudante consome texto, mídia e anexo na ordem do servidor, sem JSON, e conclui (F2-13/F2-14/R-C8)', async () => {
    const fetchMock = fetchDeAula(sessaoEstudante, [
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
    ])
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    const texto = await screen.findByText(/x \+ y = z/)
    expect(texto.textContent).toBe('x + y = z\n<b>nao e html</b>')
    expect(texto.querySelector('b')).toBeNull()
    expect(screen.queryByText(/"texto"/)).toBeNull()
    expect(document.querySelector('pre')).toBeNull()

    const iframe = screen.getByTitle('Mídia da aula')
    expect(iframe.getAttribute('src')).toBe('https://provedor.example/embed/abc')
    expect(iframe.getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-popups allow-presentation'
    )
    expect(screen.getByText('Abrir em nova aba').getAttribute('rel')).toContain('noopener')

    expect(screen.getByText('Baixar lista.pdf').getAttribute('href')).toBe(
      '/api/v1/arquivos/arq-1'
    )

    const blocos = Array.from(document.querySelectorAll('.conteudo-aula > *'))
    expect(blocos).toHaveLength(3)
    expect(blocos[0].textContent).toContain('x + y = z')
    expect(blocos[1].querySelector('iframe')).toBeTruthy()
    expect(blocos[2].textContent).toContain('Baixar lista.pdf')

    expect(screen.queryByLabelText('Tipo do bloco')).toBeNull()

    expect(screen.getByText('Marcar como concluída')).toBeTruthy()

    fireEvent.click(screen.getByText('Marcar como concluída'))
    await screen.findByText('✓ Aula concluída')
    expect(screen.getByText('Conclusao registrada.')).toBeTruthy()

    const botao = screen.getByText('✓ Aula concluída')
    expect((botao as HTMLButtonElement).disabled).toBe(true)

    const conclusao = fetchMock.mock.calls.find((chamada) => {
      const [, init] = chamada as [unknown, { method?: string }?]
      return init?.method === 'POST' && String(chamada[0]).includes('/conclusao')
    })
    expect(conclusao).toBeTruthy()
  })

  it('bloco {id:1, tipo:texto, dados:{texto:"Olá mundo"}} renderiza "Olá mundo" e nunca o JSON', async () => {
    const fetchMock = fetchDeAula(sessaoEstudante, [
      { id: '1', tipo: 'texto', dados: { texto: 'Olá mundo' } },
    ])
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    expect(await screen.findByText(/Olá mundo/)).toBeTruthy()
    expect(screen.queryByText(/"texto": "Olá mundo"/)).toBeNull()
    expect(screen.queryByText(/\{\s*"texto"/)).toBeNull()
    expect(document.querySelector('pre')).toBeNull()
  })

  it('mídia embedada renderiza iframe responsivo sem expor a URL como texto (R-C8)', async () => {
    const url = 'https://player.vimeo.com/video/76979871'
    const fetchMock = fetchDeAula(sessaoEstudante, [
      { id: 'bloco-2', tipo: 'midia_embedada', dados: { url } },
    ])
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    const iframe = await screen.findByTitle('Mídia da aula')
    expect(iframe.getAttribute('src')).toBe(url)
    expect(iframe.getAttribute('sandbox')).toContain('allow-scripts')
    expect(screen.queryByText(/player\.vimeo\.com/)).toBeNull()

    const link = screen.getByText('Abrir em nova aba')
    expect(link.getAttribute('href')).toBe(url)
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('tipo de conteúdo não suportado mostra aviso amigável, sem JSON bruto', async () => {
    const fetchMock = fetchDeAula(sessaoEstudante, [
      { id: 'bloco-3', tipo: 'video', dados: { url: 'https://exemplo.example/v' } },
    ])
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    expect(await screen.findByText(/ainda não é exibido nesta versão/)).toBeTruthy()
    expect(screen.queryByText(/exemplo\.example/)).toBeNull()
    expect(document.querySelector('pre')).toBeNull()
  })

  it('falha na conclusão mostra erro amigável e mantém o botão acionável', async () => {
    const fetchMock = fetchDeAula(
      sessaoEstudante,
      [{ id: 'bloco-4', tipo: 'texto', dados: { texto: 'Conteudo da aula.' } }],
      { falharConclusao: true }
    )
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    fireEvent.click(await screen.findByText('Marcar como concluída'))
    await screen.findByText('falha ao registrar')

    expect(screen.queryByText('✓ Aula concluída')).toBeNull()
    const botao = screen.getByText('Marcar como concluída')
    expect((botao as HTMLButtonElement).disabled).toBe(false)
  })

  it('professor dono edita por formulário: texto, mídia https e anexo via F2-15, reenviando anexo como {arquivoId} (R-C8/A-3)', async () => {
    const cursoId = '88888888-8888-4888-8888-888888888888'
    const aulaId = '99999999-9999-4999-9999-999999999999'
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
