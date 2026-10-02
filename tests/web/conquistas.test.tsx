// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { App } from '../../src/web/App'
import { AvisoConquistas } from '../../src/web/componentes/AvisoXp'

// SPEC/2026-10-02-conquistas.md §6.4 — T5.6: conquistas no perfil e avisos de desbloqueio

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

const usuarioId = '77777777-7777-4777-8777-777777777777'
const cursoId = '55555555-5555-4555-8555-555555555555'
const moduloId = '66666666-6666-4666-8666-666666666666'
const questaoId = '88888888-8888-4888-8888-888888888888'

const desbloqueadaEm = '2026-10-02T15:00:00.000Z'
const catalogo = [
  {
    codigo: 'primeiros_passos',
    nome: 'Primeiros passos',
    descricao: 'Concluiu a primeira aula',
    meta: 1,
    progresso: 1,
    desbloqueada: true,
    desbloqueadaEm,
  },
  {
    codigo: 'mente_afiada',
    nome: 'Mente afiada',
    descricao: 'Acertou 50 questões de exercício diferentes',
    meta: 50,
    progresso: 37,
    desbloqueada: false,
    desbloqueadaEm: null,
  },
]

function mock(papel: string, extra: (alvo: string, metodo: string) => unknown = () => undefined) {
  return vi.fn(async (url: unknown, init?: { method?: string }) => {
    const alvo = String(url)
    const metodo = init?.method ?? 'GET'
    const especifico = extra(alvo, metodo)
    if (especifico) return especifico
    if (alvo.includes('/auth/sessao')) {
      return respostaJson({ usuarioId, papel, expiraEm: new Date(Date.now() + 60_000).toISOString() })
    }
    if (alvo.includes('/perfis/')) {
      return respostaJson({
        id: usuarioId,
        papel,
        nivel: papel === 'estudante' ? 1 : null,
        conquistas:
          papel === 'estudante' ? [{ codigo: 'primeiros_passos', nome: 'Primeiros passos', desbloqueadaEm }] : [],
        inventario: [],
      })
    }
    if (alvo.endsWith('/api/v1/conquistas')) return respostaJson(catalogo)
    return respostaJson({ erro: { codigo: 'nao_encontrado', mensagem: 'nao encontrado' } }, 404)
  })
}

describe('T5.6 — conquistas no perfil (R-C9/R-C10)', () => {
  it('estudante vê as desbloqueadas e o catálogo com progresso', async () => {
    vi.stubGlobal('fetch', mock('estudante'))
    render(<App />)

    const secao = (await screen.findByText(/Catálogo de conquistas/)).closest('section')!
    expect(within(secao).getByText('(1 de 2)')).toBeTruthy()
    expect(within(secao).getByText(`Desbloqueada em ${new Date(desbloqueadaEm).toLocaleDateString('pt-BR')}`)).toBeTruthy()
    expect(within(secao).getByText('37 / 50')).toBeTruthy()
    const barra = within(secao).getByRole('progressbar', { name: 'Progresso de Mente afiada' })
    expect(barra.getAttribute('aria-valuenow')).toBe('37')
    expect(within(secao).queryByRole('progressbar', { name: 'Progresso de Primeiros passos' })).toBeNull()

    const desbloqueadas = screen.getByText('Conquistas').closest('section')!
    expect(within(desbloqueadas).getByText('Primeiros passos')).toBeTruthy()
  })

  it('professor não consulta F5-06 nem vê o catálogo', async () => {
    const fetchMock = mock('professor')
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)

    await screen.findByText('Nenhuma conquista ainda.')
    expect(screen.queryByText(/Catálogo de conquistas/)).toBeNull()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/api/v1/conquistas'))).toBe(false)
  })
})

describe('T5.6 — avisos de conquista (D8-i)', () => {
  it('uma linha por conquista; nada quando a lista é vazia', () => {
    const { rerender, container } = render(
      <AvisoConquistas
        conquistas={[
          { codigo: 'avaliado', nome: 'Avaliado' },
          { codigo: 'nota_maxima', nome: 'Nota máxima' },
        ]}
      />
    )
    expect(screen.getAllByText('Conquista desbloqueada:')).toHaveLength(2)
    expect(screen.getByText('Nota máxima')).toBeTruthy()
    rerender(<AvisoConquistas conquistas={[]} />)
    expect(container.textContent).toBe('')
  })

  it('exercício: acerto exibe a conquista devolvida pelo servidor', async () => {
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
              xp: { ganho: 5, total: 5, nivel: 1, subiuNivel: false },
              conquistas: [{ codigo: 'primeiro_acerto', nome: 'Primeiro acerto' }],
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

    await screen.findByText('Primeiro acerto')
    expect(screen.getByText('Conquista desbloqueada:')).toBeTruthy()
    expect(screen.getByText('+5 XP')).toBeTruthy()
  })
})
