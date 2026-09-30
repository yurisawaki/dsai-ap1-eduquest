import type { TipoConteudo } from '@prisma/client'
import { erroValidacao } from '../erros'
import { uuidValido } from '../tipos'

// Limites de SPEC/2026-09-30-conteudo-aula.md (DP-19); revisáveis pela SPEC de NFRs (P-21)
export const MAXIMO_BLOCOS = 50
export const MAXIMO_CARACTERES_TEXTO = 20_000
export const MAXIMO_CARACTERES_URL = 2_048
export const MAXIMO_BYTES_ARQUIVO = 5_242_880
export const MAXIMO_ARQUIVOS_POR_AULA = 25
export const MAXIMO_CARACTERES_NOME = 255
export const LIMITE_CORPO_CONTEUDO = '8mb'

const TIPOS_CONTEUDO: readonly TipoConteudo[] = ['texto', 'midia_embedada', 'material_anexo']

// R-C6b/R-C6c: lista fechada de MIMEs, extensões coerentes e assinatura binária
const FORMATOS_ANEXO: Record<string, { extensoes: string[]; assinaturas: number[][] }> = {
  'application/pdf': { extensoes: ['pdf'], assinaturas: [[0x25, 0x50, 0x44, 0x46]] },
  'image/png': {
    extensoes: ['png'],
    assinaturas: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  'image/jpeg': { extensoes: ['jpg', 'jpeg'], assinaturas: [[0xff, 0xd8, 0xff]] },
  'image/gif': { extensoes: ['gif'], assinaturas: [[0x47, 0x49, 0x46, 0x38]] },
  'application/zip': { extensoes: ['zip'], assinaturas: [[0x50, 0x4b]] },
}

export const MIMES_ANEXO = Object.keys(FORMATOS_ANEXO)

const caractereDeControle = /[\u0000-\u001f\u007f]/

export type BlocoValidado =
  | { tipo: 'texto'; dados: { texto: string } }
  | { tipo: 'midia_embedada'; dados: { url: string } }
  | { tipo: 'material_anexo'; dados: { arquivoId: string } }

export interface ArquivoValidado {
  nome: string
  mime: string
  conteudo: Uint8Array<ArrayBuffer>
}

// §2.2: limites em caracteres contam pontos de código Unicode
function pontosDeCodigo(valor: string): number {
  return Array.from(valor).length
}

function objetoComChaves(valor: unknown, chaves: readonly string[], rotulo: string) {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
    throw erroValidacao(`${rotulo} invalido`)
  }
  const registro = valor as Record<string, unknown>
  const presentes = Object.keys(registro)
  if (presentes.length !== chaves.length || !chaves.every((chave) => presentes.includes(chave))) {
    throw erroValidacao(`${rotulo} deve conter exatamente: ${chaves.join(', ')}`)
  }
  return registro
}

function validarTexto(dados: unknown): BlocoValidado {
  const { texto } = objetoComChaves(dados, ['texto'], 'dados de texto')
  if (typeof texto !== 'string' || texto.trim().length === 0) {
    throw erroValidacao('texto obrigatorio')
  }
  if (pontosDeCodigo(texto) > MAXIMO_CARACTERES_TEXTO) {
    throw erroValidacao(`texto excede ${MAXIMO_CARACTERES_TEXTO} caracteres`)
  }
  return { tipo: 'texto', dados: { texto } }
}

function validarMidia(dados: unknown): BlocoValidado {
  const { url } = objetoComChaves(dados, ['url'], 'dados de midia')
  if (typeof url !== 'string' || pontosDeCodigo(url) > MAXIMO_CARACTERES_URL) {
    throw erroValidacao('url de midia invalida')
  }
  let endereco: URL
  try {
    endereco = new URL(url)
  } catch {
    throw erroValidacao('url de midia invalida')
  }
  if (
    endereco.protocol !== 'https:' ||
    endereco.hostname.length === 0 ||
    endereco.username !== '' ||
    endereco.password !== ''
  ) {
    throw erroValidacao('url de midia deve ser https, com host e sem credenciais')
  }
  return { tipo: 'midia_embedada', dados: { url } }
}

function validarAnexo(dados: unknown): BlocoValidado {
  const { arquivoId } = objetoComChaves(dados, ['arquivoId'], 'dados de anexo')
  if (typeof arquivoId !== 'string' || !uuidValido.test(arquivoId)) {
    throw erroValidacao('arquivoId invalido')
  }
  return { tipo: 'material_anexo', dados: { arquivoId } }
}

// R-C3/R-C10: corpo do F2-12 é sempre array de 0–50 blocos {tipo, dados}
export function validarBlocos(corpo: unknown): BlocoValidado[] {
  if (!Array.isArray(corpo)) {
    throw erroValidacao('corpo deve ser uma lista de blocos')
  }
  if (corpo.length > MAXIMO_BLOCOS) {
    throw erroValidacao(`maximo de ${MAXIMO_BLOCOS} blocos por aula`)
  }
  return corpo.map((item) => {
    const bloco = objetoComChaves(item, ['tipo', 'dados'], 'bloco de conteudo')
    const tipo = bloco.tipo
    if (typeof tipo !== 'string' || !TIPOS_CONTEUDO.includes(tipo as TipoConteudo)) {
      throw erroValidacao('tipo de conteudo invalido')
    }
    if (tipo === 'texto') return validarTexto(bloco.dados)
    if (tipo === 'midia_embedada') return validarMidia(bloco.dados)
    return validarAnexo(bloco.dados)
  })
}

function validarNome(nome: unknown): string {
  if (
    typeof nome !== 'string' ||
    nome.trim().length === 0 ||
    pontosDeCodigo(nome) > MAXIMO_CARACTERES_NOME ||
    nome.includes('/') ||
    nome.includes('\\') ||
    caractereDeControle.test(nome)
  ) {
    throw erroValidacao('nome de arquivo invalido')
  }
  return nome
}

// R-C6: corpo do F2-15 é exatamente {nome, mime, base64}
export function validarArquivo(corpo: unknown): ArquivoValidado {
  const registro = objetoComChaves(corpo, ['nome', 'mime', 'base64'], 'corpo do arquivo')
  const nome = validarNome(registro.nome)
  const { mime, base64 } = registro
  const formato = typeof mime === 'string' ? FORMATOS_ANEXO[mime] : undefined
  if (typeof mime !== 'string' || !formato) {
    throw erroValidacao('tipo de arquivo nao permitido')
  }
  const ponto = nome.lastIndexOf('.')
  const extensao = ponto >= 0 ? nome.slice(ponto + 1).toLowerCase() : ''
  if (!formato.extensoes.includes(extensao)) {
    throw erroValidacao('extensao do arquivo incoerente com o tipo')
  }
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw erroValidacao('base64 invalido')
  }
  // alfabeto padrão com preenchimento (RFC 4648 §4): a forma canônica sobrevive à ida e volta
  const decodificado = Buffer.from(base64, 'base64')
  if (decodificado.toString('base64') !== base64) {
    throw erroValidacao('base64 invalido')
  }
  const conteudo = new Uint8Array(decodificado)
  if (conteudo.length === 0) {
    throw erroValidacao('arquivo vazio')
  }
  if (conteudo.length > MAXIMO_BYTES_ARQUIVO) {
    throw erroValidacao(`arquivo excede ${MAXIMO_BYTES_ARQUIVO} bytes`)
  }
  const assinaturaConfere = formato.assinaturas.some((assinatura) =>
    assinatura.every((byte, indice) => conteudo[indice] === byte)
  )
  if (!assinaturaConfere) {
    throw erroValidacao('conteudo do arquivo nao corresponde ao tipo declarado')
  }
  return { nome, mime, conteudo }
}
