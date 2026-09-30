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
            { id: 'bloco-1', tipo: 'texto', dados: { markdown: 'x + y = z' } },
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
    expect(screen.getByText('texto')).toBeTruthy()
    expect(screen.getByText(/x \+ y = z/)).toBeTruthy()
    expect(screen.queryByLabelText('Tipo do bloco')).toBeNull()

    fireEvent.click(screen.getByText('Marcar aula como concluida'))
    await waitFor(() => expect(screen.getByText('Conclusao registrada.')).toBeTruthy())
    const conclusao = fetchMock.mock.calls.find((chamada) => {
      const [, init] = chamada as [unknown, { method?: string }?]
      return init?.method === 'POST' && String(chamada[0]).includes('/conclusao')
    })
    expect(conclusao).toBeTruthy()
  })
})
