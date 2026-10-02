import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'

// SPEC/2026-10-02-xp-niveis.md §6.2/§6.4 — configuração de XP (F5-02–F5-05). O servidor valida
// as faixas (0–1.000 no global; 0–2× o global no curso) e calcula o valor efetivo.

type Parametro = 'xpConclusaoAula' | 'xpAcertoQuestao' | 'xpEntregaAvaliacao' | 'xpPorPontoNota'

const PARAMETROS: { chave: Parametro; rotulo: string }[] = [
  { chave: 'xpConclusaoAula', rotulo: 'Concluir aula (1ª conclusão)' },
  { chave: 'xpAcertoQuestao', rotulo: 'Acertar questão de exercício (1º acerto)' },
  { chave: 'xpEntregaAvaliacao', rotulo: 'Entregar avaliação (1ª entrega)' },
  { chave: 'xpPorPontoNota', rotulo: 'Por ponto de melhoria da nota' },
]

type ConfigGlobal = Record<Parametro, number>
type ConfigCurso = Record<Parametro, { global: number; curso: number | null; efetivo: number }>
type Campos = Record<Parametro, string>

function camposVazios(): Campos {
  return { xpConclusaoAula: '', xpAcertoQuestao: '', xpEntregaAvaliacao: '', xpPorPontoNota: '' }
}

function paraNumero(valor: string): number {
  return valor.trim() === '' ? Number.NaN : Number(valor)
}

// F5-02/F5-03 — somente administrador
export function PaginaAdministracao() {
  const [campos, setCampos] = useState<Campos>(camposVazios)
  const [carregado, setCarregado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const preencher = useCallback((config: ConfigGlobal) => {
    const novos = camposVazios()
    for (const { chave } of PARAMETROS) novos[chave] = String(config[chave])
    setCampos(novos)
  }, [])

  useEffect(() => {
    api<ConfigGlobal>('/api/v1/config/xp')
      .then((config) => {
        preencher(config)
        setCarregado(true)
      })
      .catch((erroCarga) => setErro(mensagemDeErro(erroCarga)))
  }, [preencher])

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setMensagem(null)
    setSalvando(true)
    try {
      const corpo = Object.fromEntries(PARAMETROS.map(({ chave }) => [chave, paraNumero(campos[chave])]))
      preencher(await api<ConfigGlobal>('/api/v1/config/xp', { metodo: 'PUT', corpo }))
      setMensagem('Valores globais salvos. Valem para as próximas ações.')
    } catch (erroSalvar) {
      setErro(mensagemDeErro(erroSalvar))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main>
      <article>
        <h1>Administração</h1>
        <section className="config-xp">
          <h2>XP — valores globais</h2>
          <p className="resumo-estrutura">
            Inteiros de 0 a 1.000. A mudança não altera XP já concedido.
          </p>
          {erro && (
            <p role="alert" className="erro">
              {erro}
            </p>
          )}
          {mensagem && (
            <p role="status" className="alerta alerta-sucesso">
              {mensagem}
            </p>
          )}
          {carregado ? (
            <form onSubmit={salvar}>
              {PARAMETROS.map(({ chave, rotulo }) => (
                <div key={chave} className="campo-xp">
                  <label htmlFor={`global-${chave}`}>{rotulo}</label>
                  <input
                    id={`global-${chave}`}
                    type="number"
                    min={0}
                    max={1000}
                    step={1}
                    required
                    value={campos[chave]}
                    onChange={(evento) => setCampos({ ...campos, [chave]: evento.target.value })}
                  />
                </div>
              ))}
              <button type="submit" disabled={salvando} aria-busy={salvando}>
                {salvando ? 'Salvando…' : 'Salvar valores globais'}
              </button>
            </form>
          ) : (
            !erro && <p className="carregando">Carregando configuração…</p>
          )}
        </section>
      </article>
    </main>
  )
}

// F5-04/F5-05 — professor dono do curso ou administrador
export function SecaoXpCurso({ cursoId }: { cursoId: string }) {
  const [config, setConfig] = useState<ConfigCurso | null>(null)
  const [campos, setCampos] = useState<Campos>(camposVazios)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const aplicar = useCallback((dados: ConfigCurso) => {
    setConfig(dados)
    const novos = camposVazios()
    for (const { chave } of PARAMETROS) novos[chave] = dados[chave].curso === null ? '' : String(dados[chave].curso)
    setCampos(novos)
  }, [])

  useEffect(() => {
    api<ConfigCurso>(`/api/v1/cursos/${cursoId}/config-xp`)
      .then(aplicar)
      .catch((erroCarga) => setErro(mensagemDeErro(erroCarga)))
  }, [cursoId, aplicar])

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setMensagem(null)
    setSalvando(true)
    try {
      // campo vazio = sem ajuste (usa o valor global)
      const corpo = Object.fromEntries(
        PARAMETROS.map(({ chave }) => [chave, campos[chave].trim() === '' ? null : paraNumero(campos[chave])])
      )
      aplicar(await api<ConfigCurso>(`/api/v1/cursos/${cursoId}/config-xp`, { metodo: 'PATCH', corpo }))
      setMensagem('Ajustes de XP do curso salvos.')
    } catch (erroSalvar) {
      setErro(mensagemDeErro(erroSalvar))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="config-xp">
      <h2>XP do curso</h2>
      <p className="resumo-estrutura">
        Deixe em branco para usar o valor global. Cada ajuste vai de 0 a 2× o global e vale para as
        próximas ações.
      </p>
      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="alerta alerta-sucesso">
          {mensagem}
        </p>
      )}
      {config && (
        <form onSubmit={salvar}>
          {PARAMETROS.map(({ chave, rotulo }) => (
            <div key={chave} className="campo-xp">
              <label htmlFor={`curso-${chave}`}>{rotulo}</label>
              <input
                id={`curso-${chave}`}
                type="number"
                min={0}
                max={2 * config[chave].global}
                step={1}
                placeholder={`Global: ${config[chave].global}`}
                value={campos[chave]}
                onChange={(evento) => setCampos({ ...campos, [chave]: evento.target.value })}
              />
              <span className="campo-xp-apoio">
                Global {config[chave].global} · efetivo {config[chave].efetivo} XP
              </span>
            </div>
          ))}
          <button type="submit" disabled={salvando} aria-busy={salvando}>
            {salvando ? 'Salvando…' : 'Salvar XP do curso'}
          </button>
        </form>
      )}
    </section>
  )
}
