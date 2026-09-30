import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cookieParser from 'cookie-parser'
import { diretorioWeb } from './config'
import { manipularErro } from './erros'
import { carregarSessao } from './middlewares/sessao'
import { rotasAuth } from './rotas/auth'
import { rotasPerfis } from './rotas/perfis'

export function criarApp() {
  const app = express()
  app.set('trust proxy', true)
  app.use(express.json())
  app.use(cookieParser())
  app.use(carregarSessao)

  app.use('/api/v1/auth', rotasAuth)
  app.use('/api/v1/perfis', rotasPerfis)
  app.use('/api', (_req, res) => {
    res.status(404).json({ erro: { codigo: 'nao_encontrado', mensagem: 'rota nao encontrada' } })
  })

  const diretorio = path.resolve(diretorioWeb)
  if (fs.existsSync(diretorio)) {
    app.use(express.static(diretorio))
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(diretorio, 'index.html'))
        return
      }
      next()
    })
  }

  app.use(manipularErro)
  return app
}
