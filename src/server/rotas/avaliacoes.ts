import { Router } from 'express'
import { exigirPapel, exigirSessao } from '../middlewares/sessao'
import {
  corrigirDissertativa,
  criarAvaliacao,
  editarAvaliacao,
  excluirAvaliacao,
  lerAvaliacao,
  listarAvaliacoes,
  listarTentativas,
  realizarAvaliacao,
  resultadoDoEstudante,
} from '../servicos/avaliacoes'

// Contratos F3-07–F3-15 (SPEC/2026-10-01-avaliacoes.md §6)
export const rotasAvaliacoes = Router()

rotasAvaliacoes.post('/cursos/:id/avaliacoes', exigirSessao, async (req, res) => {
  const avaliacao = await criarAvaliacao(req.usuario!, req.params.id, req.body)
  res.status(201).json(avaliacao)
})

rotasAvaliacoes.get('/cursos/:id/avaliacoes', exigirSessao, async (req, res) => {
  const avaliacoes = await listarAvaliacoes(req.usuario!, req.params.id)
  res.status(200).json(avaliacoes)
})

rotasAvaliacoes.get('/avaliacoes/:id', exigirSessao, async (req, res) => {
  const avaliacao = await lerAvaliacao(req.usuario!, req.params.id)
  res.status(200).json(avaliacao)
})

rotasAvaliacoes.patch('/avaliacoes/:id', exigirSessao, async (req, res) => {
  const avaliacao = await editarAvaliacao(req.usuario!, req.params.id, req.body)
  res.status(200).json(avaliacao)
})

rotasAvaliacoes.delete('/avaliacoes/:id', exigirSessao, async (req, res) => {
  await excluirAvaliacao(req.usuario!, req.params.id)
  res.status(204).end()
})

rotasAvaliacoes.post(
  '/avaliacoes/:id/tentativas',
  exigirSessao,
  exigirPapel('estudante'),
  async (req, res) => {
    const tentativa = await realizarAvaliacao(req.usuario!, req.params.id, req.body)
    res.status(201).json(tentativa)
  }
)

rotasAvaliacoes.get(
  '/avaliacoes/:id/resultado',
  exigirSessao,
  exigirPapel('estudante'),
  async (req, res) => {
    const resultado = await resultadoDoEstudante(req.usuario!, req.params.id)
    res.status(200).json(resultado)
  }
)

rotasAvaliacoes.get('/avaliacoes/:id/tentativas', exigirSessao, async (req, res) => {
  const tentativas = await listarTentativas(req.usuario!, req.params.id)
  res.status(200).json(tentativas)
})

rotasAvaliacoes.put(
  '/tentativas-avaliacao/:id/correcoes/:questaoId',
  exigirSessao,
  async (req, res) => {
    const tentativa = await corrigirDissertativa(
      req.usuario!,
      req.params.id,
      req.params.questaoId,
      req.body
    )
    res.status(200).json(tentativa)
  }
)
