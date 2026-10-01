import { useSyncExternalStore } from 'react'

export type Vista = 'login' | 'cadastro' | 'perfil' | 'recuperacao' | 'catalogo'

export interface Localizacao {
  vista: Vista
  cursoAberto: string | null
  aulaAberta: string | null
  moduloQuestoesAberto: string | null
  avaliacaoAberta: string | null
  profundidade: number
}

export type ParcialLocalizacao = Partial<Omit<Localizacao, 'profundidade'>>

const subrotasZeradas = {
  cursoAberto: null,
  aulaAberta: null,
  moduloQuestoesAberto: null,
  avaliacaoAberta: null,
} as const

const localizacaoInicial: Localizacao = {
  vista: 'login',
  ...subrotasZeradas,
  profundidade: 0,
}

let atual: Localizacao = localizacaoInicial
const ouvintes = new Set<() => void>()

function notificar() {
  for (const ouvinte of ouvintes) ouvinte()
}

function gravar(nova: Localizacao, substituir: boolean) {
  atual = nova
  const estado = { navegacao: nova }
  const url = window.location.pathname + window.location.search
  if (substituir) {
    window.history.replaceState(estado, '', url)
  } else {
    window.history.pushState(estado, '', url)
  }
  notificar()
}

function aoVoltarDoNavegador(evento: PopStateEvent) {
  const estado = evento.state as { navegacao?: Localizacao } | null
  atual = estado?.navegacao ?? localizacaoInicial
  notificar()
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('popstate', aoVoltarDoNavegador)
}

export function localizacaoAtual(): Localizacao {
  return atual
}

export function assinarLocalizacao(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function useLocalizacao(): Localizacao {
  return useSyncExternalStore(assinarLocalizacao, localizacaoAtual)
}

export function irPara(parcial: ParcialLocalizacao, opcoes: { substituir?: boolean } = {}): void {
  const substituir = Boolean(opcoes.substituir)
  gravar(
    { ...atual, ...parcial, profundidade: substituir ? 0 : atual.profundidade + 1 },
    substituir
  )
}

export function navegarParaVista(vista: Vista): void {
  irPara({ vista, ...subrotasZeradas })
}

export function substituirVista(vista: Vista): void {
  irPara({ vista, ...subrotasZeradas }, { substituir: true })
}

export function abrirCurso(cursoId: string): void {
  irPara({ ...subrotasZeradas, cursoAberto: cursoId })
}

function estadoPai(localizacao: Localizacao): ParcialLocalizacao | null {
  if (localizacao.aulaAberta) return { aulaAberta: null }
  if (localizacao.moduloQuestoesAberto) return { moduloQuestoesAberto: null }
  if (localizacao.avaliacaoAberta) return { avaliacaoAberta: null }
  if (localizacao.cursoAberto) return { cursoAberto: null }
  return null
}

export function voltar(): void {
  if (atual.profundidade > 0) {
    window.history.back()
    return
  }
  const pai = estadoPai(atual)
  if (pai) {
    irPara(pai, { substituir: true })
    return
  }
  substituirVista(atual.vista === 'catalogo' ? 'perfil' : 'login')
}
