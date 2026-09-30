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

describe('T1.2 — cadastro disponível na aplicação', () => {
  it('formulário envia POST /api/v1/auth/registro com e-mail, senha e papel', async () => {
    const fetchMock = vi.fn(
      async (url: unknown, init?: { method?: string; body?: string }) => {
        const alvo = String(url)
        if (alvo.includes('/auth/sessao')) {
          return respostaJson(
            { erro: { codigo: 'nao_autenticado', mensagem: 'sessão ausente' } },
            401
          )
        }
        if (alvo.includes('/auth/registro')) {
          return respostaJson(
            { usuarioId: '22222222-2222-4222-8222-222222222222', papel: 'professor' },
            201
          )
        }
        return respostaJson({ erro: { codigo: 'nao_encontrado', mensagem: 'não encontrado' } }, 404)
      }
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    fireEvent.click(await screen.findByText('Criar conta'))
    const campoEmail = await screen.findByLabelText('E-mail')
    fireEvent.change(campoEmail, { target: { value: 'novo@exemplo.test' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-larga-123' } })
    fireEvent.change(screen.getByLabelText('Papel'), { target: { value: 'professor' } })
    const formulario = campoEmail.closest('form')!
    fireEvent.submit(formulario)

    await waitFor(() => expect(screen.getByText('Conta criada')).toBeTruthy())

    const chamada = fetchMock.mock.calls.find((chamada) =>
      String(chamada[0]).includes('/auth/registro')
    )
    expect(chamada).toBeTruthy()
    const init = chamada![1]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body ?? '{}')).toEqual({
      email: 'novo@exemplo.test',
      senha: 'senha-larga-123',
      papel: 'professor',
    })
  })
})
