// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

const cursoId = '55555555-5555-4555-8555-555555555555'
const moduloId = '66666666-6666-4666-8666-666666666666'
const aulaId = '77777777-7777-4777-8777-777777777777'
const aula2Id = '78888888-7777-4777-8777-777777777777'

interface OpcoesMock {
  sessao: typeof sessaoProfessor
  concluidaInicial?: boolean
  progresso?: unknown
  segurarConclusao?: boolean
  falharConclusao?: boolean
}

function criarFetch(opcoes: OpcoesMock) {
  let concluida = opcoes.concluidaInicial ?? false
  let liberar: (() => void) | undefined
  const pendente = new Promise<void>((resolver) => {
    liberar = () => resolver()
  })
  const sessao = opcoes.sessao

  const base = async (url: unknown) => {
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

  const fetchMock = vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
    const alvo = String(url)
    const metodo = init?.method ?? 'GET'
    if (alvo.endsWith('/api/v1/cursos') && metodo === 'GET') {
      return respostaJson([{ id: cursoId, titulo: 'Algebra', publicado: true, donoId: 'dono' }])
    }
    if (alvo === `/api/v1/cursos/${cursoId}` && metodo === 'GET') {
      const curso: Record<string, unknown> = {
        id: cursoId,
        titulo: 'Algebra',
        publicado: true,
        donoId: 'dono',
        modulos: [
          {
            id: moduloId,
            titulo: 'Fundamentos',
            publicado: true,
            aulas: [
              { id: aulaId, titulo: 'Equacoes', publicado: true },
              { id: aula2Id, titulo: 'Funcoes', publicado: true },
            ],
          },
        ],
      }
      if (opcoes.progresso !== undefined) curso.progresso = opcoes.progresso
      return respostaJson(curso)
    }
    if (alvo === `/api/v1/cursos/${cursoId}/avaliacoes` && metodo === 'GET') {
      return respostaJson([])
    }
    if (alvo === `/api/v1/aulas/${aulaId}` && metodo === 'GET') {
      return respostaJson({ id: aulaId, titulo: 'Equacoes', publicado: true, conteudo: [], concluida })
    }
    if (alvo === `/api/v1/aulas/${aulaId}/conclusao` && metodo === 'POST') {
      if (opcoes.falharConclusao) {
        return respostaJson({ erro: { codigo: 'interno', mensagem: 'falha ao registrar' } }, 500)
      }
      if (opcoes.segurarConclusao) await pendente
      concluida = true
      return respostaJson({ aulaId, concluidaEm: '2026-10-01T12:00:00.000Z' }, 201)
    }
    return base(url)
  })

  return { fetchMock, liberar: () => liberar?.(), concluida: () => concluida }
}

async function abrirCurso() {
  render(<App />)
  fireEvent.click(await screen.findByText('Catálogo'))
  await screen.findByText('Algebra')
  fireEvent.click(screen.getByText('Abrir'))
  await screen.findByText('Fundamentos')
}

async function abrirAula() {
  await abrirCurso()
  fireEvent.click(screen.getAllByText('Abrir aula')[0])
  await screen.findByText('Equacoes')
}

describe('T4.2 — superfície web do progresso (D6, AC-D6-13)', () => {
  it('aula já concluída vem marcada pela API, sem novo clique', async () => {
    const { fetchMock } = criarFetch({ sessao: sessaoEstudante, concluidaInicial: true })
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    const botao = await screen.findByText('✓ Aula concluída')
    expect((botao as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText('Marcar como concluída')).toBeNull()

    const conclusoes = fetchMock.mock.calls.filter((chamada) =>
      String(chamada[0]).includes('/conclusao')
    )
    expect(conclusoes).toHaveLength(0)
  })

  it('fluxo: não concluída → clicar → Salvando… com aria-busy → sucesso reflete na tela', async () => {
    const { fetchMock, liberar } = criarFetch({
      sessao: sessaoEstudante,
      concluidaInicial: false,
      segurarConclusao: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    const botao = screen.getByText('Marcar como concluída')
    expect((botao as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(botao)
    const enviando = await screen.findByText('Salvando…')
    expect((enviando as HTMLButtonElement).getAttribute('aria-busy')).toBe('true')
    expect((enviando as HTMLButtonElement).disabled).toBe(true)

    liberar()
    await screen.findByText('✓ Aula concluída')
    expect(screen.getByText('Conclusao registrada.')).toBeTruthy()
    expect((screen.getByText('✓ Aula concluída') as HTMLButtonElement).disabled).toBe(true)
  })

  it('erro na conclusão preserva o estado anterior e mantém o botão acionável', async () => {
    const { fetchMock } = criarFetch({ sessao: sessaoEstudante, falharConclusao: true })
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()

    fireEvent.click(screen.getByText('Marcar como concluída'))
    await screen.findByText('falha ao registrar')

    expect(screen.queryByText('✓ Aula concluída')).toBeNull()
    expect((screen.getByText('Marcar como concluída') as HTMLButtonElement).disabled).toBe(false)
  })

  it('estado persiste após novo carregamento: a API devolve concluida=true', async () => {
    const { fetchMock, concluida } = criarFetch({
      sessao: sessaoEstudante,
      concluidaInicial: false,
    })
    vi.stubGlobal('fetch', fetchMock)

    await abrirAula()
    fireEvent.click(screen.getByText('Marcar como concluída'))
    await screen.findByText('✓ Aula concluída')
    expect(concluida()).toBe(true)

    cleanup()
    await abrirAula()

    expect(await screen.findByText('✓ Aula concluída')).toBeTruthy()
    expect(screen.queryByText('Marcar como concluída')).toBeNull()
  })

  it('curso do estudante exibe a barra e a contagem calculadas pelo servidor', async () => {
    const { fetchMock } = criarFetch({
      sessao: sessaoEstudante,
      progresso: {
        aulasConcluidas: 1,
        aulasTotal: 2,
        percentual: 50,
        modulos: [{ moduloId, aulasConcluidas: 1, aulasTotal: 2, percentual: 50 }],
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    await abrirCurso()

    expect(await screen.findByText('Seu progresso')).toBeTruthy()
    expect(screen.getByText('50% — 1 de 2 aulas concluídas')).toBeTruthy()

    const barra = screen.getByRole('progressbar', { name: 'Percentual do curso' })
    expect(barra.getAttribute('aria-valuenow')).toBe('50')
    expect(barra.getAttribute('aria-valuemin')).toBe('0')
    expect(barra.getAttribute('aria-valuemax')).toBe('100')

    expect(screen.getByText('1 de 2 aulas concluídas')).toBeTruthy()
  })

  it('professor não recebe progresso e a UI não renderiza o bloco', async () => {
    const { fetchMock } = criarFetch({ sessao: sessaoProfessor })
    vi.stubGlobal('fetch', fetchMock)

    await abrirCurso()

    expect(await screen.findByText('Fundamentos')).toBeTruthy()
    expect(screen.queryByText('Seu progresso')).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.queryByText(/aulas concluídas/)).toBeNull()
  })

  it('curso sem aulas visíveis mostra estado vazio, sem percentual inventado', async () => {
    const { fetchMock } = criarFetch({
      sessao: sessaoEstudante,
      progresso: { aulasConcluidas: 0, aulasTotal: 0, percentual: 0, modulos: [] },
    })
    vi.stubGlobal('fetch', fetchMock)

    await abrirCurso()

    expect(await screen.findByText('Seu progresso')).toBeTruthy()
    expect(screen.getByText('Nenhuma aula publicada ainda.')).toBeTruthy()
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.queryByText(/%/)).toBeNull()
  })
})
