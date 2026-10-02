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

describe('T5.4 — telas de configuração de XP (F5-02–F5-05)', () => {
  const global = { xpConclusaoAula: 10, xpAcertoQuestao: 5, xpEntregaAvaliacao: 20, xpPorPontoNota: 3 }
  const configCurso = {
    xpConclusaoAula: { global: 10, curso: 20, efetivo: 20 },
    xpAcertoQuestao: { global: 5, curso: null, efetivo: 5 },
    xpEntregaAvaliacao: { global: 20, curso: null, efetivo: 20 },
    xpPorPontoNota: { global: 3, curso: null, efetivo: 3 },
  }

  function cursoDe(donoId: string) {
    return (alvo: string, metodo: string) => {
      if (alvo.endsWith('/api/v1/cursos') && metodo === 'GET') {
        return respostaJson([{ id: cursoId, titulo: 'Algebra', publicado: true, donoId }])
      }
      if (alvo === `/api/v1/cursos/${cursoId}`) {
        return respostaJson({ id: cursoId, titulo: 'Algebra', publicado: true, donoId, modulos: [] })
      }
      if (alvo.includes('/cursos') && alvo.includes('/avaliacoes')) return respostaJson([])
      return undefined
    }
  }

  it('administrador vê "Administração", carrega o global e envia PUT com os 4 inteiros', async () => {
    const fetchMock = mock('administrador', (alvo, metodo) => {
      if (alvo.endsWith('/api/v1/config/xp') && metodo === 'GET') return respostaJson(global)
      if (alvo.endsWith('/api/v1/config/xp') && metodo === 'PUT') {
        return respostaJson({ ...global, xpConclusaoAula: 15 })
      }
      return undefined
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)

    fireEvent.click(await screen.findByText('Administração'))
    const campo = (await screen.findByLabelText('Concluir aula (1ª conclusão)')) as HTMLInputElement
    expect(campo.value).toBe('10')
    fireEvent.change(campo, { target: { value: '15' } })
    fireEvent.click(screen.getByText('Salvar valores globais'))

    await screen.findByText(/Valores globais salvos/)
    const put = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/config/xp') && init?.method === 'PUT')
    expect(JSON.parse(String((put?.[1] as { body?: string }).body))).toEqual({ ...global, xpConclusaoAula: 15 })
  })

  it('professor e estudante não veem "Administração"', async () => {
    for (const papel of ['professor', 'estudante']) {
      vi.stubGlobal('fetch', mock(papel))
      render(<App />)
      await screen.findByText('Catálogo')
      expect(screen.queryByText('Administração')).toBeNull()
      cleanup()
    }
  })

  it('dono vê "XP do curso" com global/efetivo e campo vazio vira null no PATCH', async () => {
    const fetchMock = mock('professor', (alvo, metodo) => {
      if (alvo.endsWith(`/cursos/${cursoId}/config-xp`) && metodo === 'GET') return respostaJson(configCurso)
      if (alvo.endsWith(`/cursos/${cursoId}/config-xp`) && metodo === 'PATCH') {
        return respostaJson({ ...configCurso, xpConclusaoAula: { global: 10, curso: null, efetivo: 10 } })
      }
      return cursoDe(usuarioId)(alvo, metodo)
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))

    await screen.findByText('XP do curso')
    const campo = (await screen.findByLabelText('Concluir aula (1ª conclusão)')) as HTMLInputElement
    expect(campo.value).toBe('20')
    expect(screen.getByText('Global 10 · efetivo 20 XP')).toBeTruthy()

    fireEvent.change(campo, { target: { value: '' } })
    fireEvent.click(screen.getByText('Salvar XP do curso'))
    await screen.findByText('Ajustes de XP do curso salvos.')
    const patch = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/config-xp') && init?.method === 'PATCH'
    )
    expect(JSON.parse(String((patch?.[1] as { body?: string }).body))).toEqual({
      xpConclusaoAula: null,
      xpAcertoQuestao: null,
      xpEntregaAvaliacao: null,
      xpPorPontoNota: null,
    })
    expect(screen.getByText('Global 10 · efetivo 10 XP')).toBeTruthy()
  })

  it('estudante não vê a seção nem consulta F5-04', async () => {
    const fetchMock = mock('estudante', cursoDe('outro'))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    await screen.findByText('Nenhuma avaliação disponível.')
    expect(screen.queryByText('XP do curso')).toBeNull()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/config-xp'))).toBe(false)
  })
})
