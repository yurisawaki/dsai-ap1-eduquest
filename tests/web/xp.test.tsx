// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from '../../src/web/App'
import { AvisoXp } from '../../src/web/componentes/AvisoXp'

// SPEC/2026-10-02-xp-niveis.md §6.4 — T5.3: XP no perfil e avisos "+N XP"

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

const usuarioId = '44444444-4444-4444-8444-444444444444'
const cursoId = '55555555-5555-4555-8555-555555555555'
const moduloId = '66666666-6666-4666-8666-666666666666'
const questaoId = '88888888-8888-4888-8888-888888888888'

function sessao(papel: string) {
  return { usuarioId, papel, expiraEm: new Date(Date.now() + 60_000).toISOString() }
}

function mock(papel: string, extra: (alvo: string, metodo: string) => unknown = () => undefined) {
  return vi.fn(async (url: unknown, init?: { method?: string }) => {
    const alvo = String(url)
    const metodo = init?.method ?? 'GET'
    const especifico = extra(alvo, metodo)
    if (especifico) return especifico
    if (alvo.includes('/auth/sessao')) return respostaJson(sessao(papel))
    if (alvo.includes('/perfis/')) {
      return respostaJson({
        id: usuarioId,
        papel,
        nivel: papel === 'estudante' ? 2 : null,
        conquistas: [],
        inventario: [],
      })
    }
    if (alvo.endsWith('/api/v1/xp')) {
      return respostaJson({ xpTotal: 150, xpSemana: 40, nivel: 2, xpNivelAtual: 100, xpProximoNivel: 300 })
    }
    return respostaJson({ erro: { codigo: 'nao_encontrado', mensagem: 'nao encontrado' } }, 404)
  })
}

describe('T5.3 — XP no perfil (F5-01)', () => {
  it('estudante vê nível, XP total, XP da semana e a barra até o próximo nível', async () => {
    vi.stubGlobal('fetch', mock('estudante'))
    render(<App />)

    await screen.findByText('Experiência')
    expect(screen.getByText('XP total')).toBeTruthy()
    expect(screen.getByText('150')).toBeTruthy()
    expect(screen.getByText('XP desta semana')).toBeTruthy()
    expect(screen.getByText('40')).toBeTruthy()
    const barra = screen.getByRole('progressbar', { name: 'Progresso para o nível 3' })
    expect(barra.getAttribute('aria-valuenow')).toBe('25')
    expect(screen.getByText(/faltam 150 XP para o nível 3/)).toBeTruthy()
  })

  it('professor não consulta F5-01 nem vê o bloco de XP', async () => {
    const fetchMock = mock('professor')
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)

    await screen.findByText('Sem nível ainda.')
    expect(screen.queryByText('Experiência')).toBeNull()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/api/v1/xp'))).toBe(false)
  })

  it('falha em F5-01 não impede o perfil', async () => {
    vi.stubGlobal(
      'fetch',
      mock('estudante', (alvo) =>
        alvo.endsWith('/api/v1/xp') ? respostaJson({ erro: { codigo: 'erro_interno', mensagem: 'x' } }, 500) : undefined
      )
    )
    render(<App />)

    await screen.findByText('Conquistas')
    expect(screen.queryByText('Experiência')).toBeNull()
  })
})

describe('T5.3 — avisos "+N XP" (D7-i)', () => {
  it('mostra ganho e subida de nível; nada quando o ganho é 0', () => {
    const { rerender, container } = render(
      <AvisoXp xp={{ ganho: 10, total: 105, nivel: 2, subiuNivel: true }} />
    )
    expect(screen.getByText('+10 XP')).toBeTruthy()
    expect(screen.getByText('Subiu para o nível 2!')).toBeTruthy()

    rerender(<AvisoXp xp={{ ganho: 5, total: 50, nivel: 1, subiuNivel: false }} />)
    expect(screen.getByText('+5 XP')).toBeTruthy()
    expect(screen.queryByText(/Subiu para o nível/)).toBeNull()

    rerender(<AvisoXp xp={{ ganho: 0, total: 50, nivel: 1, subiuNivel: false }} />)
    expect(container.textContent).toBe('')
    rerender(<AvisoXp xp={null} />)
    expect(container.textContent).toBe('')
  })

  it('exercício: acerto exibe "+5 XP" a partir da resposta do servidor', async () => {
    vi.stubGlobal(
      'fetch',
      mock('estudante', (alvo, metodo) => {
        if (alvo.endsWith('/api/v1/cursos') && metodo === 'GET') {
          return respostaJson([{ id: cursoId, titulo: 'Algebra', publicado: true, donoId: 'outro' }])
        }
        if (alvo === `/api/v1/cursos/${cursoId}`) {
          return respostaJson({
            id: cursoId,
            titulo: 'Algebra',
            publicado: true,
            donoId: 'outro',
            modulos: [{ id: moduloId, titulo: 'Fundamentos', publicado: true, aulas: [] }],
          })
        }
        if (alvo.includes('/cursos') && alvo.includes('/avaliacoes')) return respostaJson([])
        if (alvo.includes('/modulos/') && alvo.includes('/questoes') && metodo === 'GET') {
          return respostaJson([
            { id: questaoId, moduloId, tipo: 'verdadeiro_falso', enunciado: 'O ceu e azul?', publicado: true },
          ])
        }
        if (alvo.includes(`/questoes/${questaoId}/tentativas`) && metodo === 'POST') {
          return respostaJson(
            {
              tentativaId: 't1',
              acerto: true,
              feedback: { explicacao: null },
              xp: { ganho: 5, total: 155, nivel: 2, subiuNivel: false },
            },
            201
          )
        }
        return undefined
      })
    )
    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Ver questões'))
    await screen.findByText('O ceu e azul?')

    fireEvent.click(screen.getByLabelText('Verdadeiro'))
    fireEvent.click(screen.getByText('Enviar resposta'))

    await screen.findByText('✓ Resposta correta')
    await waitFor(() => expect(screen.getByText('+5 XP')).toBeTruthy())
  })
})
