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

const sessaoEstudante = {
  usuarioId: '33333333-3333-4333-8333-333333333333',
  papel: 'estudante',
  expiraEm: new Date(Date.now() + 60_000).toISOString(),
}

const sessaoProfessor = {
  usuarioId: '22222222-2222-4222-8222-222222222222',
  papel: 'professor',
  expiraEm: new Date(Date.now() + 60_000).toISOString(),
}

const cursoId = '55555555-5555-4555-8555-555555555555'
const moduloId = '66666666-6666-4666-8666-666666666666'
const questaoId = '88888888-8888-4888-8888-888888888888'
const avaliacaoId = '99999999-9999-4999-9999-999999999999'

function mockSessao(sessao: typeof sessaoEstudante) {
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

function mockCompleto(sessao: typeof sessaoEstudante, opcoes: {
  questoes?: unknown[]
  avaliacoes?: unknown[]
  avaliacaoDetalhe?: unknown
  resultado?: unknown
  questaoResposta?: unknown
} = {}) {
  const base = mockSessao(sessao)
  return vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
    const alvo = String(url)
    const metodo = init?.method ?? 'GET'

    if (alvo.includes('/cursos') && alvo.includes('/avaliacoes') && metodo === 'GET') {
      return respostaJson(opcoes.avaliacoes ?? [])
    }
    if (alvo.includes('/avaliacoes/') && alvo.includes('/resultado') && metodo === 'GET') {
      return respostaJson(opcoes.resultado ?? { tentativas: [], tentativasRestantes: 3, resultado: null })
    }
    if (alvo.includes('/avaliacoes/') && !alvo.includes('/tentativas') && !alvo.includes('/resultado') && metodo === 'GET') {
      return respostaJson(opcoes.avaliacaoDetalhe ?? {})
    }
    if (alvo.includes('/avaliacoes/') && alvo.includes('/tentativas') && metodo === 'POST') {
      return respostaJson(opcoes.questaoResposta ?? { tentativaId: 't1', status: 'corrigida', nota: 8.5 }, 201)
    }
    if (alvo.includes('/modulos/') && alvo.includes('/questoes') && metodo === 'GET') {
      return respostaJson(opcoes.questoes ?? [])
    }
    if (alvo.includes('/questoes/') && alvo.includes('/tentativas') && metodo === 'POST') {
      return respostaJson(opcoes.questaoResposta ?? { tentativaId: 't1', acerto: true, feedback: { explicacao: 'Correto!' } }, 201)
    }
    if (alvo === `/api/v1/cursos/${cursoId}`) {
      return respostaJson({
        id: cursoId,
        titulo: 'Algebra',
        publicado: true,
        donoId: sessao.usuarioId,
        modulos: [{ id: moduloId, titulo: 'Fundamentos', publicado: true, aulas: [] }],
      })
    }
    if (alvo.endsWith('/api/v1/cursos') && metodo === 'GET') {
      return respostaJson([{ id: cursoId, titulo: 'Algebra', publicado: true, donoId: sessao.usuarioId }])
    }
    return base(url, init)
  })
}

describe('UI de questões (SPEC/2026-10-01-questoes-avaliacoes-web.md AC-UI-1..3)', () => {
  it('estudante vê lista de questões, seleciona alternativa e recebe feedback', async () => {
    const fetchMock = mockCompleto(sessaoEstudante, {
      questoes: [{
        id: questaoId,
        moduloId,
        tipo: 'multipla_escolha',
        enunciado: 'Quanto é 2+2?',
        publicado: true,
        alternativas: [
          { id: 'a1', texto: '3', posicao: 0 },
          { id: 'a2', texto: '4', posicao: 1 },
        ],
      }],
      questaoResposta: { tentativaId: 't1', acerto: true, feedback: { explicacao: '2+2=4' } },
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Ver questões'))

    await screen.findByText('Quanto é 2+2?')
    expect(screen.getByText('Múltipla escolha')).toBeTruthy()

    const alternativas = screen.getAllByRole('checkbox')
    expect(alternativas).toHaveLength(2)

    fireEvent.click(alternativas[1])
    fireEvent.click(screen.getByText('Enviar resposta'))

    await screen.findByText('✓ Resposta correta')
    expect(screen.getByText('2+2=4')).toBeTruthy()
  })

  it('botão fica desabilitado sem resposta e habilita após seleção', async () => {
    const fetchMock = mockCompleto(sessaoEstudante, {
      questoes: [{
        id: questaoId,
        moduloId,
        tipo: 'verdadeiro_falso',
        enunciado: 'A Terra é redonda?',
        publicado: true,
      }],
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Ver questões'))

    await screen.findByText('A Terra é redonda?')
    const botao = screen.getByText('Enviar resposta') as HTMLButtonElement
    expect(botao.disabled).toBe(true)

    fireEvent.click(screen.getByLabelText('Verdadeiro'))
    expect(botao.disabled).toBe(false)
  })

  it('mostra estado vazio quando não há questões', async () => {
    const fetchMock = mockCompleto(sessaoEstudante, { questoes: [] })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Ver questões'))

    await screen.findByText('Nenhuma questão publicada neste módulo.')
    expect(screen.getByText('As questões aparecem aqui quando o professor publicar.')).toBeTruthy()
  })

  it('feedback mostra erro para resposta incorreta', async () => {
    const fetchMock = mockCompleto(sessaoEstudante, {
      questoes: [{
        id: questaoId,
        moduloId,
        tipo: 'numerica',
        enunciado: 'Quanto é 5?',
        publicado: true,
      }],
      questaoResposta: { tentativaId: 't1', acerto: false, feedback: { explicacao: null } },
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Ver questões'))

    await screen.findByText('Quanto é 5?')
    fireEvent.change(screen.getByPlaceholderText('Digite um número'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('Enviar resposta'))

    await screen.findByText('✗ Resposta incorreta')
  })
})

describe('UI de avaliação (SPEC/2026-10-01-questoes-avaliacoes-web.md AC-UI-4..7)', () => {
  it('lista avaliações no curso e mostra estado vazio', async () => {
    const fetchMock = mockCompleto(sessaoEstudante, { avaliacoes: [] })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))

    await screen.findByText('Nenhuma avaliação disponível.')
    expect(screen.getByText('As avaliações publicadas aparecem aqui.')).toBeTruthy()
  })

  it('abre avaliação e mostra metadados e resultado', async () => {
    const agora = new Date()
    const abre = new Date(agora.getTime() - 3600_000).toISOString()
    const fecha = new Date(agora.getTime() + 3600_000).toISOString()

    const fetchMock = mockCompleto(sessaoEstudante, {
      avaliacoes: [{
        id: avaliacaoId,
        titulo: 'Prova 1',
        tentativasMax: 3,
        abreEm: abre,
        fechaEm: fecha,
        publicado: true,
      }],
      avaliacaoDetalhe: {
        id: avaliacaoId,
        cursoId,
        titulo: 'Prova 1',
        tentativasMax: 3,
        abreEm: abre,
        fechaEm: fecha,
        publicado: true,
        questoes: [],
      },
      resultado: {
        tentativas: [],
        tentativasRestantes: 3,
        resultado: 8.5,
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))

    await screen.findByText('Prova 1')
    fireEvent.click(screen.getByText('Abrir avaliação'))

    await screen.findByText('Prova 1')
    expect(screen.getByText('8,50')).toBeTruthy()
    expect(screen.getByText('Restam 3 tentativas')).toBeTruthy()
  })

  it('mostra estado vazio para avaliação fora da janela (antes de abrir)', async () => {
    const agora = new Date()
    const abre = new Date(agora.getTime() + 3600_000).toISOString()
    const fecha = new Date(agora.getTime() + 7200_000).toISOString()

    const fetchMock = mockCompleto(sessaoEstudante, {
      avaliacoes: [{
        id: avaliacaoId,
        titulo: 'Prova Futura',
        tentativasMax: 1,
        abreEm: abre,
        fechaEm: fecha,
        publicado: true,
      }],
      avaliacaoDetalhe: {
        id: avaliacaoId,
        cursoId,
        titulo: 'Prova Futura',
        tentativasMax: 1,
        abreEm: abre,
        fechaEm: fecha,
        publicado: true,
      },
      resultado: { tentativas: [], tentativasRestantes: 1, resultado: null },
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Abrir avaliação'))

    await screen.findByText('A avaliação ainda não está aberta.')
  })

  it('professor não pode realizar avaliação (apenas vê)', async () => {
    const agora = new Date()
    const abre = new Date(agora.getTime() - 3600_000).toISOString()
    const fecha = new Date(agora.getTime() + 3600_000).toISOString()

    const fetchMock = mockCompleto(sessaoProfessor, {
      avaliacoes: [{
        id: avaliacaoId,
        titulo: 'Prova',
        tentativasMax: 3,
        abreEm: abre,
        fechaEm: fecha,
        publicado: true,
      }],
      avaliacaoDetalhe: {
        id: avaliacaoId,
        cursoId,
        titulo: 'Prova',
        tentativasMax: 3,
        abreEm: abre,
        fechaEm: fecha,
        publicado: true,
        questoes: [{
          questao: { id: questaoId, tipo: 'dissertativa', enunciado: 'Explique' },
          peso: 10,
        }],
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(await screen.findByText('Catálogo'))
    fireEvent.click(await screen.findByText('Abrir'))
    fireEvent.click(await screen.findByText('Abrir avaliação'))

    await screen.findByText('Apenas estudantes podem realizar esta avaliação.')
  })
})
