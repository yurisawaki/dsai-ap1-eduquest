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
      return respostaJson({ id: aulaId, titulo: 'Equacoes', publicado: true, conteudo })
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
  await screen.findByText('Algebra — Publicado')
  fireEvent.click(screen.getByText('Abrir'))
  await screen.findByText('Fundamentos — Publicado')
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

  it('estudante lê o conteúdo como texto legível (não JSON) e conclui a aula (F2-13/F2-14)', async () => {
    const fetchMock = fetchDeAula(sessaoEstudante, [
      {
        id: 'bloco-1',
        tipo: 'texto',
        dados: { texto: 'Resolva a equacao x + y = z para encontrar y.' },
      },
    ])
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    expect(await screen.findByText(/x \+ y = z/)).toBeTruthy()
    expect(screen.queryByText(/"texto"/)).toBeNull()
    expect(document.querySelector('pre')).toBeNull()
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
      {
        id: 'bloco-3',
        tipo: 'material_anexo',
        dados: { arquivoId: '3f1c2b4a-0000-4000-8000-000000000001', nome: 'texto.pdf' },
      },
    ])
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    expect(await screen.findByText(/ainda não é exibido nesta versão/)).toBeTruthy()
    expect(screen.queryByText(/arquivoId/)).toBeNull()
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
})
