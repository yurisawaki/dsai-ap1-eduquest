import { Router } from 'express'
import { Erro } from '../erros'
import { nomeCookieSessao } from '../config'
import { redefinirSenha, solicitarRecuperacao } from '../servicos/recuperacao'
import { criarSessao, opcoesCookie, opcoesLimpezaCookie, revogarSessao } from '../servicos/sessoes'
import { autenticar, criarConta } from '../servicos/usuarios'

export const rotasAuth = Router()

rotasAuth.post('/registro', async (req, res) => {
  const conta = await criarConta(req.body ?? {})
  res.status(201).json(conta)
})

rotasAuth.post('/login', async (req, res) => {
  const usuario = await autenticar(req.body ?? {})
  if (!usuario) {
    throw new Erro(401, 'credenciais_invalidas', 'credenciais invalidas')
  }
  const sessao = await criarSessao(usuario.id)
  res.cookie(nomeCookieSessao, sessao.id, opcoesCookie(req, sessao.expira_em))
  res.status(200).json({})
})

rotasAuth.post('/logout', async (req, res) => {
  if (!req.sessao) {
    throw new Erro(401, 'nao_autenticado', 'sessao ausente ou invalida')
  }
  await revogarSessao(req.sessao.id)
  res.clearCookie(nomeCookieSessao, opcoesLimpezaCookie(req))
  res.status(204).end()
})

rotasAuth.get('/sessao', (req, res) => {
  if (!req.sessao || !req.usuario) {
    throw new Erro(401, 'nao_autenticado', 'sessao ausente ou invalida')
  }
  res.status(200).json({
    usuarioId: req.usuario.id,
    papel: req.usuario.papel,
    expiraEm: req.sessao.expira_em.toISOString(),
  })
})

rotasAuth.post('/recuperacao-senha', async (req, res) => {
  await solicitarRecuperacao((req.body ?? {}).email)
  res.status(202).json({ mensagem: 'Solicitacao de recuperacao recebida.' })
})

rotasAuth.post('/redefinicao-senha', async (req, res) => {
  await redefinirSenha(req.body ?? {})
  res.status(204).end()
})
