import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Erro, erroValidacao } from '../erros'
import { prisma } from '../prisma'
import { tokenExpiracaoMinutos } from '../config'
import { gerarHash } from './senha'
import { validarEmail, validarSenha } from './usuarios'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function solicitarRecuperacao(email: unknown): Promise<string | null> {
  const endereco = validarEmail(email)
  const usuario = await prisma.usuario.findUnique({ where: { email: endereco } })
  if (!usuario) return null
  const token = randomBytes(32).toString('hex')
  await prisma.tokenRecuperacao.create({
    data: {
      id: randomUUID(),
      usuario_id: usuario.id,
      hash_token: hashToken(token),
      expira_em: new Date(Date.now() + tokenExpiracaoMinutos * 60_000),
    },
  })
  return token
}

export async function redefinirSenha(dados: { token?: unknown; senha?: unknown }): Promise<void> {
  if (typeof dados.token !== 'string' || dados.token.length === 0) {
    throw erroValidacao('token invalido')
  }
  const senha = validarSenha(dados.senha)
  const registro = await prisma.tokenRecuperacao.findUnique({
    where: { hash_token: hashToken(dados.token) },
  })
  if (!registro || registro.expira_em <= new Date()) {
    throw new Erro(400, 'token_invalido', 'token invalido ou expirado')
  }
  const hash = await gerarHash(senha)
  await prisma.credencial.update({
    where: { usuario_id: registro.usuario_id },
    data: { hash_senha: hash },
  })
}
