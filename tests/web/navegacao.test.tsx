// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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

const cursoId = '55555555-5555-4555-8555-555555555555'
const moduloId = '66666666-6666-4666-8666-666666666666'
const aulaId = '77777777-7777-4777-8777-777777777777'

function instalarFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown, _init?: { method?: string; body?: string }) => {
      const alvo = String(url)
      if (alvo.includes('/auth/sessao')) return respostaJson(sessaoEstudante)
      if (alvo.endsWith('/api/v1/cursos')) {
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
      if (alvo === `/api/v1/aulas/${aulaId}`) {
        return respostaJson({
          id: aulaId,
          titulo: 'Equacoes',
          publicado: true,
          conteudo: [],
          concluida: false,
        })
      }
      return respostaJson(
        { erro: { codigo: 'nao_encontrado', mensagem: 'nao encontrado' } },
        404
      )
    })
  )
}

async function aguardarTraversal() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

async function voltarDoNavegador() {
  await act(async () => {
    window.history.back()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

async function avancarDoNavegador() {
  await act(async () => {
    window.history.forward()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

async function abrirDetalheDoCurso() {
  render(<App />)
  fireEvent.click(await screen.findByText('Catálogo'))
  await screen.findByText('Algebra')
  fireEvent.click(screen.getByText('Abrir'))
  await screen.findByText('Fundamentos')
}

describe('navegação com histórico do navegador', () => {
  it('botão voltar do browser retorna do detalhe do curso para a lista do catálogo', async () => {
    instalarFetch()
    await abrirDetalheDoCurso()
    expect(screen.queryByText('Catálogo de aprendizagem')).toBeNull()

    await voltarDoNavegador()

    await screen.findByText('Catálogo de aprendizagem')
    expect(screen.queryByText('Fundamentos')).toBeNull()
  })

  it('botão avançar do browser volta ao detalhe depois de voltar', async () => {
    instalarFetch()
    await abrirDetalheDoCurso()

    await voltarDoNavegador()
    await screen.findByText('Catálogo de aprendizagem')

    await avancarDoNavegador()

    await screen.findByText('Fundamentos')
  })

  it('botão Voltar do app desempilha o histórico (avançar retorna ao detalhe)', async () => {
    instalarFetch()
    await abrirDetalheDoCurso()

    fireEvent.click(screen.getByText('Voltar ao catálogo'))
    await aguardarTraversal()
    await screen.findByText('Catálogo de aprendizagem')

    await avancarDoNavegador()

    await screen.findByText('Fundamentos')
  })

  it('pilha completa: lista → curso → aula com voltar do browser em cada nível', async () => {
    instalarFetch()
    await abrirDetalheDoCurso()

    fireEvent.click(screen.getByText('Abrir aula'))
    await screen.findByText('Voltar ao curso')

    await voltarDoNavegador()
    await screen.findByText('Voltar ao catálogo')
    expect(screen.queryByText('Voltar ao curso')).toBeNull()

    await voltarDoNavegador()
    await screen.findByText('Catálogo de aprendizagem')
    expect(screen.queryByText('Voltar ao catálogo')).toBeNull()
  })
})
