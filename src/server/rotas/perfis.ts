import { Router } from 'express'
import { Erro } from '../erros'
import { exigirSessao } from '../middlewares/sessao'
import { editarPerfil, lerPerfil } from '../servicos/perfis'

export const rotasPerfis = Router()

rotasPerfis.get('/:id', exigirSessao, async (req, res) => {
  const perfil = await lerPerfil(req.params.id)
  if (!perfil) {
    throw new Erro(404, 'nao_encontrado', 'perfil nao encontrado')
  }
  res.status(200).json(perfil)
})

rotasPerfis.patch('/:id', exigirSessao, async (req, res) => {
  const perfil = await editarPerfil(req.usuario!.id, req.params.id, req.body)
  res.status(200).json(perfil)
})
