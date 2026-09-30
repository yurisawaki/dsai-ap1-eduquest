import { randomUUID } from 'node:crypto'
import type { Prisma, TipoConteudo } from '@prisma/client'
import { erroNaoEncontrado, erroProibido, erroValidacao } from '../erros'
import { prisma } from '../prisma'
import { uuidValido } from '../tipos'

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
}

export interface BlocoConteudo {
  id: string
  tipo: TipoConteudo
  dados: unknown
}

export interface AulaComConteudo {
  id: string
  titulo: string
  publicado: boolean
  conteudo: BlocoConteudo[]
}

export interface ResultadoConclusao {
  aulaId: string
  concluidaEm: string
  repetida: boolean
}

interface Alteracoes {
  titulo?: string
  publicado?: boolean
}

const TIPOS_CONTEUDO: readonly TipoConteudo[] = ['texto', 'midia_embedada', 'material_anexo']

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

function blocosConteudo(corpo: unknown): { tipo: TipoConteudo; dados: Prisma.InputJsonValue }[] {
  const entrada = Array.isArray(corpo) ? corpo : [corpo]
  return entrada.map((item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw erroValidacao('bloco de conteudo invalido')
    }
    const bloco = item as Record<string, unknown>
    const tipo = bloco.tipo
    if (typeof tipo !== 'string' || !TIPOS_CONTEUDO.includes(tipo as TipoConteudo)) {
      throw erroValidacao('tipo de conteudo invalido')
    }
    if (!('dados' in bloco) || bloco.dados === null) {
      throw erroValidacao('dados de conteudo ausentes')
    }
    return { tipo: tipo as TipoConteudo, dados: bloco.dados as Prisma.InputJsonValue }
  })
}

function exigirAutoria(donoId: string, usuario: UsuarioSessao) {
  if (usuario.papel === 'administrador') return
  if (usuario.papel === 'professor' && donoId === usuario.id) return
  throw erroProibido('somente o professor dono ou administrador pode alterar')
}

function ehDonoOuAdmin(donoId: string, usuario: UsuarioSessao): boolean {
  return usuario.papel === 'administrador' || donoId === usuario.id
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
      conteudos: { orderBy: { criado_em: 'asc' } },
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
  return {
    id: curso.id,
    titulo: curso.titulo,
    publicado: curso.publicado,
    donoId: curso.dono_id,
    modulos: modulos.map((modulo) => ({
      id: modulo.id,
      titulo: modulo.titulo,
      publicado: modulo.publicado,
      aulas: (autor ? modulo.aulas : modulo.aulas.filter((aula) => aula.publicado)).map((aula) => ({
        id: aula.id,
        titulo: aula.titulo,
        publicado: aula.publicado,
      })),
    })),
  }
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

export async function substituirConteudo(
  usuario: UsuarioSessao,
  id: unknown,
  corpo: unknown
): Promise<void> {
  const aula = await aulaParaAlteracao(id, usuario)
  const blocos = blocosConteudo(corpo)
  const remocao = prisma.conteudoAula.deleteMany({ where: { aula_id: aula.id } })
  if (blocos.length === 0) {
    await remocao
    return
  }
  const insercao = prisma.conteudoAula.createMany({
    data: blocos.map((bloco) => ({
      id: randomUUID(),
      aula_id: aula.id,
      tipo: bloco.tipo,
      dados: bloco.dados,
    })),
  })
  await prisma.$transaction([remocao, insercao])
}

export async function lerAula(usuario: UsuarioSessao, id: unknown): Promise<AulaComConteudo> {
  const aula = await aulaEncadeada(id)
  if (!aula) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  const autor = ehDonoOuAdmin(aula.modulo.curso.dono_id, usuario)
  const cadeiaPublicada =
    aula.publicado && aula.modulo.publicado && aula.modulo.curso.publicado
  if (!autor && !cadeiaPublicada) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  return {
    id: aula.id,
    titulo: aula.titulo,
    publicado: aula.publicado,
    conteudo: aula.conteudos.map((bloco) => ({
      id: bloco.id,
      tipo: bloco.tipo,
      dados: bloco.dados,
    })),
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
  const cadeiaPublicada =
    aula.publicado && aula.modulo.publicado && aula.modulo.curso.publicado
  if (!cadeiaPublicada && !ehDonoOuAdmin(aula.modulo.curso.dono_id, usuario)) {
    throw erroNaoEncontrado('aula nao encontrada')
  }
  const existente = await prisma.conclusaoAula.findFirst({
    where: { aula_id: aula.id, usuario_id: usuario.id },
    orderBy: [{ concluida_em: 'asc' }, { criado_em: 'asc' }],
  })
  if (existente) {
    return {
      aulaId: existente.aula_id,
      concluidaEm: existente.concluida_em.toISOString(),
      repetida: true,
    }
  }
  const registro = await prisma.conclusaoAula.create({
    data: {
      id: randomUUID(),
      aula_id: aula.id,
      usuario_id: usuario.id,
      concluida_em: new Date(),
    },
  })
  return {
    aulaId: registro.aula_id,
    concluidaEm: registro.concluida_em.toISOString(),
    repetida: false,
  }
}
