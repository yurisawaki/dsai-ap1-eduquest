import { randomUUID } from 'node:crypto'
import type { Prisma, TipoConteudo } from '@prisma/client'
import { erroNaoEncontrado, erroProibido, erroValidacao } from '../erros'
import { prisma } from '../prisma'
import { uuidValido } from '../tipos'
import {
  type BlocoValidado,
  MAXIMO_ARQUIVOS_POR_AULA,
  validarArquivo,
  validarBlocos,
} from './conteudo'
import { concederXp, type XpDaAcao } from './xp'

type Papel = 'estudante' | 'professor' | 'administrador'

export interface UsuarioSessao {
  id: string
  papel: Papel
}

export interface ResumoCurso {
  id: string
  titulo: string
  publicado: boolean
  donoId: string
}

export interface ResumoModulo {
  id: string
  titulo: string
  publicado: boolean
  cursoId: string
}

export interface ResumoAula {
  id: string
  titulo: string
  publicado: boolean
  moduloId: string
}

export interface AulaCatalogo {
  id: string
  titulo: string
  publicado: boolean
}

export interface ModuloCatalogo {
  id: string
  titulo: string
  publicado: boolean
  aulas: AulaCatalogo[]
}

export interface CursoComEstrutura {
  id: string
  titulo: string
  publicado: boolean
  donoId: string
  modulos: ModuloCatalogo[]
  progresso?: ProgressoCurso
}

export interface ProgressoModulo {
  moduloId: string
  aulasConcluidas: number
  aulasTotal: number
  percentual: number
}

export interface ProgressoCurso {
  aulasConcluidas: number
  aulasTotal: number
  percentual: number
  modulos: ProgressoModulo[]
}

export interface BlocoConteudo {
  id: string
  tipo: TipoConteudo
  posicao: number
  dados: unknown
}

export interface ResumoArquivo {
  arquivoId: string
  nome: string
  mime: string
  tamanho: number
}

export interface ArquivoParaDownload {
  nome: string
  mime: string
  conteudo: Uint8Array
}

export interface AulaComConteudo {
  id: string
  titulo: string
  publicado: boolean
  conteudo: BlocoConteudo[]
  concluida: boolean
}

export interface ResultadoConclusao {
  aulaId: string
  concluidaEm: string
  repetida: boolean
  xp: XpDaAcao
}

interface Alteracoes {
  titulo?: string
  publicado?: boolean
}

function objeto(corpo: unknown): Record<string, unknown> {
  if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw erroValidacao('corpo da requisicao invalido')
  }
  return corpo as Record<string, unknown>
}

function tituloObrigatorio(valor: unknown): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw erroValidacao('titulo obrigatorio')
  }
  return valor
}

function alteracoes(corpo: unknown): Alteracoes {
  const dados = objeto(corpo)
  const chaves = Object.keys(dados)
  if (chaves.length === 0) {
    throw erroValidacao('corpo sem alteracoes')
  }
  const alteracao: Alteracoes = {}
  for (const chave of chaves) {
    if (chave === 'titulo') {
      alteracao.titulo = tituloObrigatorio(dados.titulo)
      continue
    }
    if (chave === 'publicado') {
      if (typeof dados.publicado !== 'boolean') {
        throw erroValidacao('publicado invalido')
      }
      alteracao.publicado = dados.publicado
      continue
    }
    throw erroValidacao('campo nao permitido')
  }
  return alteracao
}

export function exigirAutoria(donoId: string, usuario: UsuarioSessao) {
  if (usuario.papel === 'administrador') return
  if (usuario.papel === 'professor' && donoId === usuario.id) return
  throw erroProibido('somente o professor dono ou administrador pode alterar')
}

export function ehDonoOuAdmin(donoId: string, usuario: UsuarioSessao): boolean {
  return usuario.papel === 'administrador' || donoId === usuario.id
}

interface CadeiaDaAula {
  publicado: boolean
  modulo: { publicado: boolean; curso: { dono_id: string; publicado: boolean } }
}

// R-14/R-17: leitor comum só vê aula com a cadeia aula→módulo→curso publicada
function aulaVisivel(aula: CadeiaDaAula, usuario: UsuarioSessao): boolean {
  const cadeiaPublicada = aula.publicado && aula.modulo.publicado && aula.modulo.curso.publicado
  return cadeiaPublicada || ehDonoOuAdmin(aula.modulo.curso.dono_id, usuario)
}

async function cursoParaAlteracao(id: unknown, usuario: UsuarioSessao) {
  const curso =
    typeof id === 'string' && uuidValido.test(id)
      ? await prisma.curso.findUnique({ where: { id } })
      : null
  if (!curso) {
    throw erroNaoEncontrado('curso nao encontrado')
  }
  exigirAutoria(curso.dono_id, usuario)
  return curso
}

async function moduloParaAlteracao(id: unknown, usuario: UsuarioSessao) {
  const modulo =
    typeof id === 'string' && uuidValido.test(id)
      ? await prisma.modulo.findUnique({
          where: { id },
          include: { curso: { select: { dono_id: true } } },
        })
      : null
  if (!modulo) {
    throw erroNaoEncontrado('modulo nao encontrado')
  }
  exigirAutoria(modulo.curso.dono_id, usuario)
  return modulo
}

async function aulaEncadeada(id: unknown) {
  if (typeof id !== 'string' || !uuidValido.test(id)) return null
  return prisma.aula.findUnique({
    where: { id },
    include: {
      conteudos: { orderBy: { posicao: 'asc' } },
      modulo: { include: { curso: { select: { dono_id: true, publicado: true } } } },
    },
  })
}

async function aulaParaAlteracao(id: unknown, usuario: UsuarioSessao) {
  const aula = await aulaEncadeada(id)
  if (!aula) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  exigirAutoria(aula.modulo.curso.dono_id, usuario)
  return aula
}

function montarResumo(curso: {
  id: string
  titulo: string
  publicado: boolean
  dono_id: string
}): ResumoCurso {
  return {
    id: curso.id,
    titulo: curso.titulo,
    publicado: curso.publicado,
    donoId: curso.dono_id,
  }
}

export async function criarCurso(usuario: UsuarioSessao, corpo: unknown) {
  const titulo = tituloObrigatorio(objeto(corpo).titulo)
  const curso = await prisma.curso.create({
    data: { id: randomUUID(), titulo, dono_id: usuario.id, publicado: false },
    select: { id: true },
  })
  return { cursoId: curso.id }
}

export async function listarCursos(usuario: UsuarioSessao): Promise<ResumoCurso[]> {
  const filtros =
    usuario.papel === 'administrador'
      ? {}
      : { OR: [{ dono_id: usuario.id }, { publicado: true }] }
  const cursos = await prisma.curso.findMany({
    where: filtros,
    orderBy: { criado_em: 'asc' },
  })
  return cursos.map(montarResumo)
}

// R-D6-3 (SPEC de progresso): arredondamento para baixo; total zerado nunca divide por zero
function percentualDe(concluidas: number, total: number): number {
  if (total === 0) return 0
  return Math.floor((concluidas * 100) / total)
}

async function progressoDoCurso(
  usuarioId: string,
  modulos: ModuloCatalogo[]
): Promise<ProgressoCurso> {
  const aulas = modulos.flatMap((modulo) => modulo.aulas)
  const concluidas =
    aulas.length === 0
      ? new Set<string>()
      : new Set(
          (
            await prisma.conclusaoAula.findMany({
              where: { usuario_id: usuarioId, aula_id: { in: aulas.map((aula) => aula.id) } },
              select: { aula_id: true },
            })
          ).map((registro) => registro.aula_id)
        )
  const porModulo: ProgressoModulo[] = modulos.map((modulo) => {
    const aulasTotal = modulo.aulas.length
    const aulasConcluidas = modulo.aulas.filter((aula) => concluidas.has(aula.id)).length
    return {
      moduloId: modulo.id,
      aulasConcluidas,
      aulasTotal,
      percentual: percentualDe(aulasConcluidas, aulasTotal),
    }
  })
  const aulasTotal = porModulo.reduce((total, modulo) => total + modulo.aulasTotal, 0)
  const aulasConcluidas = porModulo.reduce((total, modulo) => total + modulo.aulasConcluidas, 0)
  return {
    aulasConcluidas,
    aulasTotal,
    percentual: percentualDe(aulasConcluidas, aulasTotal),
    modulos: porModulo,
  }
}

export async function lerCurso(usuario: UsuarioSessao, id: unknown): Promise<CursoComEstrutura> {
  const curso =
    typeof id === 'string' && uuidValido.test(id)
      ? await prisma.curso.findUnique({
          where: { id },
          include: {
            modulos: {
              orderBy: { criado_em: 'asc' },
              include: { aulas: { orderBy: { criado_em: 'asc' } } },
            },
          },
        })
      : null
  if (!curso) {
    throw erroNaoEncontrado('curso nao encontrado')
  }
  const autor = ehDonoOuAdmin(curso.dono_id, usuario)
  if (!autor && !curso.publicado) {
    throw erroNaoEncontrado('curso nao encontrado')
  }
  const modulos = autor ? curso.modulos : curso.modulos.filter((modulo) => modulo.publicado)
  const estrutura: ModuloCatalogo[] = modulos.map((modulo) => ({
    id: modulo.id,
    titulo: modulo.titulo,
    publicado: modulo.publicado,
    aulas: (autor ? modulo.aulas : modulo.aulas.filter((aula) => aula.publicado)).map((aula) => ({
      id: aula.id,
      titulo: aula.titulo,
      publicado: aula.publicado,
    })),
  }))
  const resultado: CursoComEstrutura = {
    id: curso.id,
    titulo: curso.titulo,
    publicado: curso.publicado,
    donoId: curso.dono_id,
    modulos: estrutura,
  }
  // R-D6-7: progresso só existe para o papel estudante (derivado das conclusões — R-D6-1)
  if (usuario.papel === 'estudante') {
    resultado.progresso = await progressoDoCurso(usuario.id, estrutura)
  }
  return resultado
}

export async function editarCurso(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<ResumoCurso> {
  const curso = await cursoParaAlteracao(id, usuario)
  const atualizado = await prisma.curso.update({
    where: { id: curso.id },
    data: alteracoes(corpo),
  })
  return montarResumo(atualizado)
}

export async function excluirCurso(usuario: UsuarioSessao, id: unknown): Promise<void> {
  const curso = await cursoParaAlteracao(id, usuario)
  await prisma.curso.delete({ where: { id: curso.id } })
}

export async function criarModulo(usuario: UsuarioSessao, cursoId: unknown, corpo: unknown) {
  const curso = await cursoParaAlteracao(cursoId, usuario)
  const titulo = tituloObrigatorio(objeto(corpo).titulo)
  const modulo = await prisma.modulo.create({
    data: { id: randomUUID(), curso_id: curso.id, titulo, publicado: false },
    select: { id: true },
  })
  return { moduloId: modulo.id }
}

export async function editarModulo(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<ResumoModulo> {
  const modulo = await moduloParaAlteracao(id, usuario)
  const atualizado = await prisma.modulo.update({
    where: { id: modulo.id },
    data: alteracoes(corpo),
  })
  return {
    id: atualizado.id,
    titulo: atualizado.titulo,
    publicado: atualizado.publicado,
    cursoId: atualizado.curso_id,
  }
}

export async function excluirModulo(usuario: UsuarioSessao, id: unknown): Promise<void> {
  const modulo = await moduloParaAlteracao(id, usuario)
  await prisma.modulo.delete({ where: { id: modulo.id } })
}

export async function criarAula(usuario: UsuarioSessao, moduloId: unknown, corpo: unknown) {
  const modulo = await moduloParaAlteracao(moduloId, usuario)
  const titulo = tituloObrigatorio(objeto(corpo).titulo)
  const aula = await prisma.aula.create({
    data: { id: randomUUID(), modulo_id: modulo.id, titulo, publicado: false },
    select: { id: true },
  })
  return { aulaId: aula.id }
}

export async function editarAula(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<ResumoAula> {
  const aula = await aulaParaAlteracao(id, usuario)
  const atualizado = await prisma.aula.update({
    where: { id: aula.id },
    data: alteracoes(corpo),
  })
  return {
    id: atualizado.id,
    titulo: atualizado.titulo,
    publicado: atualizado.publicado,
    moduloId: atualizado.modulo_id,
  }
}

export async function excluirAula(usuario: UsuarioSessao, id: unknown): Promise<void> {
  const aula = await aulaParaAlteracao(id, usuario)
  await prisma.aula.delete({ where: { id: aula.id } })
}

// SPEC de conteúdo §7.3: valida tudo antes de escrever; substituição total em transação única
export async function substituirConteudo(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<void> {
  const aula = await aulaParaAlteracao(id, usuario)
  const blocos = validarBlocos(corpo)

  // R-C7: anexo referencia arquivo existente da mesma aula; dados são enriquecidos na gravação
  const idsArquivos = [
    ...new Set(
      blocos.flatMap((bloco) => (bloco.tipo === 'material_anexo' ? [bloco.dados.arquivoId] : []))
    ),
  ]
  const arquivos = await prisma.arquivo.findMany({
    where: { id: { in: idsArquivos }, aula_id: aula.id },
    select: { id: true, nome: true, mime: true, tamanho: true },
  })
  const porId = new Map(arquivos.map((arquivo) => [arquivo.id, arquivo]))
  if (porId.size !== idsArquivos.length) {
    throw erroValidacao('arquivoId desconhecido ou de outra aula')
  }

  function dadosGravados(bloco: BlocoValidado): Prisma.InputJsonValue {
    if (bloco.tipo !== 'material_anexo') return bloco.dados
    const arquivo = porId.get(bloco.dados.arquivoId)!
    return { arquivoId: arquivo.id, nome: arquivo.nome, mime: arquivo.mime, tamanho: arquivo.tamanho }
  }

  const remocao = prisma.conteudoAula.deleteMany({ where: { aula_id: aula.id } })
  if (blocos.length === 0) {
    await remocao
    return
  }
  const insercao = prisma.conteudoAula.createMany({
    data: blocos.map((bloco, posicao) => ({
      id: randomUUID(),
      aula_id: aula.id,
      tipo: bloco.tipo,
      posicao,
      dados: dadosGravados(bloco),
    })),
  })
  await prisma.$transaction([remocao, insercao])
}

// F2-15 (SPEC de conteúdo §6.3)
export async function criarArquivo(
  usuario: UsuarioSessao,
  aulaId: unknown,
  corpo: unknown
): Promise<ResumoArquivo> {
  const aula = await aulaParaAlteracao(aulaId, usuario)
  const arquivo = validarArquivo(corpo)
  const existentes = await prisma.arquivo.count({ where: { aula_id: aula.id } })
  if (existentes >= MAXIMO_ARQUIVOS_POR_AULA) {
    throw erroValidacao(`maximo de ${MAXIMO_ARQUIVOS_POR_AULA} arquivos por aula`)
  }
  const criado = await prisma.arquivo.create({
    data: {
      id: randomUUID(),
      aula_id: aula.id,
      nome: arquivo.nome,
      mime: arquivo.mime,
      tamanho: arquivo.conteudo.length,
      conteudo: arquivo.conteudo,
    },
    select: { id: true, nome: true, mime: true, tamanho: true },
  })
  return { arquivoId: criado.id, nome: criado.nome, mime: criado.mime, tamanho: criado.tamanho }
}

// F2-16 (SPEC de conteúdo §6.4): mesma visibilidade do F2-13; não visível → 404
export async function lerArquivo(usuario: UsuarioSessao, id: unknown): Promise<ArquivoParaDownload> {
  const arquivo =
    typeof id === 'string' && uuidValido.test(id)
      ? await prisma.arquivo.findUnique({
          where: { id },
          include: {
            aula: {
              select: {
                publicado: true,
                modulo: {
                  select: {
                    publicado: true,
                    curso: { select: { dono_id: true, publicado: true } },
                  },
                },
              },
            },
          },
        })
      : null
  if (!arquivo || !aulaVisivel(arquivo.aula, usuario)) {
    throw erroNaoEncontrado('arquivo nao encontrado')
  }
  return { nome: arquivo.nome, mime: arquivo.mime, conteudo: arquivo.conteudo }
}

export async function lerAula(usuario: UsuarioSessao, id: unknown): Promise<AulaComConteudo> {
  const aula = await aulaEncadeada(id)
  if (!aula) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  if (!aulaVisivel(aula, usuario)) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  // R-D6-1: o estado de conclusão vem do banco, sempre do usuário da sessão
  const conclusao = await prisma.conclusaoAula.findFirst({
    where: { aula_id: aula.id, usuario_id: usuario.id },
    select: { id: true },
  })
  return {
    id: aula.id,
    titulo: aula.titulo,
    publicado: aula.publicado,
    conteudo: aula.conteudos.map((bloco) => ({
      id: bloco.id,
      tipo: bloco.tipo,
      posicao: bloco.posicao,
      dados: bloco.dados,
    })),
    concluida: conclusao !== null,
  }
}

export async function concluirAula(
  usuario: UsuarioSessao,
  id: unknown
): Promise<ResultadoConclusao> {
  const aula = await aulaEncadeada(id)
  if (!aula) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  if (!aulaVisivel(aula, usuario)) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  const cursoId = aula.modulo.curso_id
  // R-D6-2: a unique de (aula_id, usuario_id) torna a escrita idempotente até em corrida;
  // skipDuplicates não gera erro quando outra requisição criou o mesmo registro.
  // R-X2/R-X8 (D7): só a primeira conclusão paga XP, na mesma transação da conclusão.
  const { criado, registro, xp } = await prisma.$transaction(async (tx) => {
    const criado = await tx.conclusaoAula.createMany({
      data: [
        {
          id: randomUUID(),
          aula_id: aula.id,
          usuario_id: usuario.id,
          concluida_em: new Date(),
        },
      ],
      skipDuplicates: true,
    })
    const registro = await tx.conclusaoAula.findFirst({
      where: { aula_id: aula.id, usuario_id: usuario.id },
      orderBy: [{ concluida_em: 'asc' }, { criado_em: 'asc' }],
    })
    const xp = await concederXp(tx, usuario.id, cursoId, (valores) =>
      criado.count > 0
        ? [
            {
              origem: 'conclusao_aula',
              referenciaId: aula.id,
              chave: `aula:${aula.id}`,
              xp: valores.xp_conclusao_aula,
            },
          ]
        : []
    )
    return { criado, registro, xp }
  })
  if (!registro) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  return {
    aulaId: registro.aula_id,
    concluidaEm: registro.concluida_em.toISOString(),
    xp,
    repetida: criado.count === 0,
  }
}
