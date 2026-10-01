import { randomUUID } from 'node:crypto'
import type { Papel, Usuario } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { erroValidacao, Erro } from '../erros'
import { prisma } from '../prisma'
import { conferirHash, gerarHash } from './senha'

// R-12 (SPEC de D1): o cadastro público é do servidor, não do cliente.
// Toda conta nova nasce como estudante; papel é provisionado pela
// operação (seed), nunca escolhido na requisição.
const PAPEL_PADRAO_CADASTRO: Papel = 'estudante'

export function validarEmail(valor: unknown): string {
  if (typeof valor !== 'string' || valor.length === 0) {
    throw erroValidacao('e-mail invalido')
  }
  if (valor.length > 255) {
    throw erroValidacao('e-mail excede o tamanho maximo de 255 caracteres')
  }
  return valor
}

export function validarSenha(valor: unknown): string {
  if (typeof valor !== 'string' || valor.length === 0) {
    throw erroValidacao('senha invalida')
  }
  return valor
}

export interface ContaCriada {
  usuarioId: string
  papel: Papel
}

export async function criarConta(dados: { email?: unknown; senha?: unknown }): Promise<ContaCriada> {
  const email = validarEmail(dados.email)
  const senha = validarSenha(dados.senha)
  const papel = PAPEL_PADRAO_CADASTRO
  const hash = await gerarHash(senha)
  try {
    const usuario = await prisma.$transaction(async (tx) => {
      const criado = await tx.usuario.create({
        data: { id: randomUUID(), email, papel },
      })
      await tx.credencial.create({
        data: { usuario_id: criado.id, hash_senha: hash },
      })
      // R-09/R-12: papel fixo do cadastro público → sempre perfil de estudante
      await tx.perfilEstudante.create({ data: { usuario_id: criado.id } })
      return criado
    })
    return { usuarioId: usuario.id, papel: usuario.papel }
  } catch (erro) {
    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === 'P2002'
    ) {
      throw new Erro(409, 'email_em_uso', 'e-mail ja cadastrado')
    }
    throw erro
  }
}

export async function autenticar(dados: {
  email?: unknown
  senha?: unknown
}): Promise<Usuario | null> {
  const email = validarEmail(dados.email)
  const senha = validarSenha(dados.senha)
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { credencial: true },
  })
  if (!usuario || !usuario.credencial) return null
  const confere = await conferirHash(senha, usuario.credencial.hash_senha)
  if (!confere) return null
  return usuario
}
