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

const sessaoDeTeste = {
  usuarioId: '11111111-1111-4111-8111-111111111111',
  papel: 'estudante',
  expiraEm: new Date(Date.now() + 60_000).toISOString(),
}

describe('T1.6 — seções de gamificação do perfil com dados vazios', () => {
  it('renderiza nível, conquistas e inventário em estado vazio, sem expor e-mail', async () => {
    const perfil = {
      id: sessaoDeTeste.usuarioId,
      papel: 'estudante',
      nivel: null,
      conquistas: [],
      inventario: [],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: unknown) => {
        const alvo = String(url)
        if (alvo.includes('/auth/sessao')) return respostaJson(sessaoDeTeste)
        if (alvo.includes('/perfis/')) return respostaJson(perfil)
        return respostaJson({ erro: { codigo: 'nao_encontrado', mensagem: 'não encontrado' } }, 404)
      })
    )

    render(<App />)

    await waitFor(() => expect(screen.getByText('Nível')).toBeTruthy())
    expect(screen.getByText('Sem nível ainda.')).toBeTruthy()
    expect(screen.getByText('Conquistas')).toBeTruthy()
    expect(screen.getByText('Nenhuma conquista ainda.')).toBeTruthy()
    expect(screen.getByText('Inventário')).toBeTruthy()
    expect(screen.getByText('Inventário vazio.')).toBeTruthy()
    expect(document.body.textContent).not.toContain('@')
    expect(screen.getByText('Papel: estudante')).toBeTruthy()
  })

  it('professor vê o editor de bio e salva via PATCH no contrato 8', async () => {
    const perfilProfessor = {
      id: sessaoDeTeste.usuarioId,
      papel: 'professor',
      bio: null,
      nivel: null,
      conquistas: [],
      inventario: [],
    }
    const fetchMock = vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
      const alvo = String(url)
      if (alvo.includes('/auth/sessao')) {
        return respostaJson({ ...sessaoDeTeste, papel: 'professor' })
      }
      if (alvo.includes('/perfis/') && init?.method === 'PATCH') {
        const corpo = JSON.parse(init.body ?? '{}')
        return respostaJson({ ...perfilProfessor, bio: corpo.bio })
      }
      if (alvo.includes('/perfis/')) return respostaJson(perfilProfessor)
      return respostaJson({ erro: { codigo: 'nao_encontrado', mensagem: 'não encontrado' } }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    const caixaBio = await screen.findByLabelText('Bio')
    fireEvent.change(caixaBio, { target: { value: 'Bio da professora' } })
    fireEvent.submit(caixaBio.closest('form')!)

    await waitFor(() => expect(screen.getByText('Bio salva.')).toBeTruthy())
    const chamada = fetchMock.mock.calls.find((chamada) => {
      const [, init] = chamada as [unknown, { method?: string }?]
      return init?.method === 'PATCH'
    })
    expect(chamada).toBeTruthy()
    const [, init] = chamada as [unknown, { body?: string }]
    expect(JSON.parse(init.body ?? '{}')).toEqual({ bio: 'Bio da professora' })
    expect(document.body.textContent).not.toContain('@')
  })
})
