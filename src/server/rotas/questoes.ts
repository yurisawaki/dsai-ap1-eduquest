import { Router } from 'express'
import { exigirPapel, exigirSessao } from '../middlewares/sessao'
import {
  criarQuestao,
  editarQuestao,
  excluirQuestao,
  lerQuestao,
  listarQuestoes,
  responderQuestao,
} from '../servicos/questoes'

// Contratos F3-01–F3-06 (SPEC/2026-10-01-questoes-exercicios.md §6)
export const rotasQuestoes = Router()

rotasQuestoes.post('/modulos/:id/questoes', exigirSessao, async (req, res) => {
  const questao = await criarQuestao(req.usuario!, req.params.id, req.body)
  res.status(201).json(questao)
})

rotasQuestoes.get('/modulos/:id/questoes', exigirSessao, async (req, res) => {
  const questoes = await listarQuestoes(req.usuario!, req.params.id)
  res.status(200).json(questoes)
})

rotasQuestoes.get('/questoes/:id', exigirSessao, async (req, res) => {
  const questao = await lerQuestao(req.usuario!, req.params.id)
  res.status(200).json(questao)
})

rotasQuestoes.patch('/questoes/:id', exigirSessao, async (req, res) => {
  const questao = await editarQuestao(req.usuario!, req.params.id, req.body)
  res.status(200).json(questao)
})

rotasQuestoes.delete('/questoes/:id', exigirSessao, async (req, res) => {
  await excluirQuestao(req.usuario!, req.params.id)
  res.status(204).end()
})

rotasQuestoes.post(
  '/questoes/:id/tentativas',
  exigirSessao,
  exigirPapel('estudante'),
  async (req, res) => {
    const tentativa = await responderQuestao(req.usuario!, req.params.id, req.body)
    res.status(201).json(tentativa)
  }
)
