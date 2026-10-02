import { Router } from 'express'
import { exigirPapel, exigirSessao } from '../middlewares/sessao'
import { prisma } from '../prisma'
import { lerXp } from '../servicos/xp'

// SPEC/2026-10-02-xp-niveis.md §6.1 — F5-01: próprio XP e nível (R-X24: só o próprio estudante)
export const rotasXp = Router()

rotasXp.get('/xp', exigirSessao, exigirPapel('estudante'), async (req, res) => {
  res.status(200).json(await lerXp(prisma, req.usuario!.id))
})
