import 'dotenv/config'

function inteiroObrigatorio(nome: string, valor: string | undefined): number {
  if (valor === undefined || valor === '') {
    throw new Error(
      `Variavel de ambiente obrigatoria ausente: ${nome}. O mecanismo e configuravel (SPEC tecnica 2.1.3/2.3.2); o valor e parametro operacional, nao fixado em codigo (P-03/P-04).`
    )
  }
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`Variavel de ambiente invalida: ${nome} (esperado inteiro positivo)`)
  }
  return numero
}

function inteiroOpcional(nome: string, valor: string | undefined, padrao: number): number {
  if (valor === undefined || valor === '') return padrao
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`Variavel de ambiente invalida: ${nome} (esperado inteiro positivo)`)
  }
  return numero
}

export const sessaoExpiracaoMinutos = inteiroObrigatorio(
  'SESSION_EXPIRATION_MINUTES',
  process.env.SESSION_EXPIRATION_MINUTES
)

export const tokenExpiracaoMinutos = inteiroObrigatorio(
  'RESET_TOKEN_EXPIRATION_MINUTES',
  process.env.RESET_TOKEN_EXPIRATION_MINUTES
)

export const custoBcrypt = inteiroOpcional('BCRYPT_COST', process.env.BCRYPT_COST, 10)

export const porta = inteiroOpcional('PORT', process.env.PORT, 3000)

export const nomeCookieSessao = 'eduquest_session'

export const diretorioWeb = process.env.WEB_DIR ?? 'dist/web'
