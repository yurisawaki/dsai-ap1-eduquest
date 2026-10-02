import { Router } from 'express'
import { exigirPapel, exigirSessao } from '../middlewares/sessao'
import {
  concluirAula,
  criarArquivo,
  criarAula,
  criarCurso,
  criarModulo,
  editarAula,
  editarCurso,
  editarModulo,
  excluirAula,
  excluirCurso,
  excluirModulo,
  lerArquivo,
  lerAula,
  lerCurso,
  listarCursos,
  substituirConteudo,
} from '../servicos/catalogo'

export const rotasCatalogo = Router()

rotasCatalogo.post('/cursos', exigirSessao, exigirPapel('professor'), async (req, res) => {
  const curso = await criarCurso(req.usuario!, req.body ?? {})
  res.status(201).json(curso)
})

rotasCatalogo.get('/cursos', exigirSessao, async (req, res) => {
  const cursos = await listarCursos(req.usuario!)
  res.status(200).json(cursos)
})

rotasCatalogo.get('/cursos/:id', exigirSessao, async (req, res) => {
  const curso = await lerCurso(req.usuario!, req.params.id)
  res.status(200).json(curso)
})

rotasCatalogo.patch('/cursos/:id', exigirSessao, async (req, res) => {
  const curso = await editarCurso(req.usuario!, req.params.id, req.body)
  res.status(200).json(curso)
})

rotasCatalogo.delete('/cursos/:id', exigirSessao, async (req, res) => {
  await excluirCurso(req.usuario!, req.params.id)
  res.status(204).end()
})

rotasCatalogo.post('/cursos/:id/modulos', exigirSessao, async (req, res) => {
  const modulo = await criarModulo(req.usuario!, req.params.id, req.body ?? {})
  res.status(201).json(modulo)
})

rotasCatalogo.patch('/modulos/:id', exigirSessao, async (req, res) => {
  const modulo = await editarModulo(req.usuario!, req.params.id, req.body)
  res.status(200).json(modulo)
})

rotasCatalogo.delete('/modulos/:id', exigirSessao, async (req, res) => {
  await excluirModulo(req.usuario!, req.params.id)
  res.status(204).end()
})

rotasCatalogo.post('/modulos/:id/aulas', exigirSessao, async (req, res) => {
  const aula = await criarAula(req.usuario!, req.params.id, req.body ?? {})
  res.status(201).json(aula)
})

rotasCatalogo.patch('/aulas/:id', exigirSessao, async (req, res) => {
  const aula = await editarAula(req.usuario!, req.params.id, req.body)
  res.status(200).json(aula)
})

rotasCatalogo.delete('/aulas/:id', exigirSessao, async (req, res) => {
  await excluirAula(req.usuario!, req.params.id)
  res.status(204).end()
})

rotasCatalogo.put('/aulas/:id/conteudo', exigirSessao, async (req, res) => {
  await substituirConteudo(req.usuario!, req.params.id, req.body)
  res.status(204).end()
})

rotasCatalogo.get('/aulas/:id', exigirSessao, async (req, res) => {
  const aula = await lerAula(req.usuario!, req.params.id)
  res.status(200).json(aula)
})

rotasCatalogo.post('/aulas/:id/arquivos', exigirSessao, async (req, res) => {
  const arquivo = await criarArquivo(req.usuario!, req.params.id, req.body)
  res.status(201).json(arquivo)
})

rotasCatalogo.get('/arquivos/:id', exigirSessao, async (req, res) => {
  const arquivo = await lerArquivo(req.usuario!, req.params.id)
  res.attachment(arquivo.nome)
  res.type(arquivo.mime)
  res.set('X-Content-Type-Options', 'nosniff')
  res.status(200).send(Buffer.from(arquivo.conteudo))
})

rotasCatalogo.post(
  '/aulas/:id/conclusao',
  exigirSessao,
  exigirPapel('estudante'),
  async (req, res) => {
    const conclusao = await concluirAula(req.usuario!, req.params.id)
    res.status(conclusao.repetida ? 200 : 201).json({
      aulaId: conclusao.aulaId,
      concluidaEm: conclusao.concluidaEm,
      xp: conclusao.xp,
    })
  }
)
