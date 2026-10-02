import { Router } from 'express'
import { exigirPapel, exigirSessao } from '../middlewares/sessao'
import { prisma } from '../prisma'
import {
  ajustarConfigCurso,
  lerConfigCurso,
  lerConfigGlobal,
  substituirConfigGlobal,
} from '../servicos/configuracaoXp'
import { lerXp } from '../servicos/xp'

// SPEC/2026-10-02-xp-niveis.md §6
export const rotasXp = Router()

// F5-01: próprio XP e nível (R-X24: só o próprio estudante)
rotasXp.get('/xp', exigirSessao, exigirPapel('estudante'), async (req, res) => {
  res.status(200).json(await lerXp(prisma, req.usuario!.id))
})

// F5-02/F5-03 — R-X11: valores globais só pelo administrador (401 → 403 → 400)
rotasXp.get('/config/xp', exigirSessao, exigirPapel('administrador'), async (_req, res) => {
  res.status(200).json(await lerConfigGlobal())
})

rotasXp.put('/config/xp', exigirSessao, exigirPapel('administrador'), async (req, res) => {
  res.status(200).json(await substituirConfigGlobal(req.body))
})

// F5-04/F5-05 — R-X12: ajuste do curso pelo professor dono ou administrador (401 → 404 → 403 → 400)
rotasXp.get('/cursos/:id/config-xp', exigirSessao, async (req, res) => {
  res.status(200).json(await lerConfigCurso(req.usuario!, req.params.id))
})

rotasXp.patch('/cursos/:id/config-xp', exigirSessao, async (req, res) => {
  res.status(200).json(await ajustarConfigCurso(req.usuario!, req.params.id, req.body))
})
