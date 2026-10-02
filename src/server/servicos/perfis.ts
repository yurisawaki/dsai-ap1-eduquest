import type { Papel } from '@prisma/client'
import { erroNaoEncontrado, erroProibido, erroValidacao } from '../erros'
import { prisma } from '../prisma'
import { uuidValido } from '../tipos'
import { nivelDoEstudante } from './xp'

export interface RespostaPerfil {
  id: string
  papel: Papel
  bio?: string | null
  nivel: number | null
  conquistas: []
  inventario: []
}

interface UsuarioComPerfil {
  id: string
  papel: Papel
  perfil_professor: { bio: string | null } | null
}

// R-X23 (D7): estudante recebe o nível (inteiro); professor/admin, null.
// R-X24: XP total e da semana nunca aparecem no perfil (só em F5-01, para o próprio estudante).
async function montarResposta(usuario: UsuarioComPerfil): Promise<RespostaPerfil> {
  const base = {
    id: usuario.id,
    papel: usuario.papel,
    nivel: usuario.papel === 'estudante' ? await nivelDoEstudante(prisma, usuario.id) : null,
    conquistas: [] as [],
    inventario: [] as [],
  }
  if (usuario.papel === 'professor') {
    return { ...base, bio: usuario.perfil_professor?.bio ?? null }
  }
  return base
}

export async function lerPerfil(id: unknown): Promise<RespostaPerfil | null> {
  if (typeof id !== 'string' || !uuidValido.test(id)) return null
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { perfil_professor: { select: { bio: true } } },
  })
  if (!usuario) return null
  return montarResposta(usuario)
}

export async function editarPerfil(
  sessaoUsuarioId: string,
  id: unknown,
  corpo: unknown
): Promise<RespostaPerfil> {
  if (typeof id !== 'string' || !uuidValido.test(id)) {
    throw erroNaoEncontrado('perfil nao encontrado')
  }
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { perfil_professor: { select: { bio: true } } },
  })
  if (!usuario) {
    throw erroNaoEncontrado('perfil nao encontrado')
  }
  if (sessaoUsuarioId !== usuario.id) {
    throw erroProibido('somente o titular pode editar o perfil')
  }
  if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw erroValidacao('corpo da requisicao invalido')
  }
  const chaves = Object.keys(corpo)
  const apenasBio = chaves.length === 1 && chaves[0] === 'bio'
  if (!apenasBio || usuario.papel !== 'professor') {
    throw erroValidacao('conjunto de campos editaveis nao permitido')
  }
  const bio = ( corpo as { bio: unknown }).bio
  if (bio !== null && typeof bio !== 'string') {
    throw erroValidacao('bio invalida')
  }
  const atualizado = await prisma.perfilProfessor.update({
    where: { usuario_id: usuario.id },
    data: { bio: bio as string | null },
    select: { bio: true },
  })
  return montarResposta({ ...usuario, perfil_professor: atualizado })
}
