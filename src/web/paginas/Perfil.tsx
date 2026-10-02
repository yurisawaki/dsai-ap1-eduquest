import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'
import type { Sessao } from '../App'

export interface Perfil {
  id: string
  papel: string
  bio?: string | null
  nivel: number | null
  conquistas: ConquistaDoPerfil[]
  inventario: unknown[]
}

// Contrato 7 + R-C9 (SPEC/2026-10-02-conquistas.md): conquistas desbloqueadas, com data
export interface ConquistaDoPerfil {
  codigo: string
  nome: string
  desbloqueadaEm: string
}

// F5-06 (SPEC/2026-10-02-conquistas.md §6.1): catálogo com progresso, só do próprio estudante
export interface ConquistaDoCatalogo {
  codigo: string
  nome: string
  descricao: string
  meta: number
  progresso: number
  desbloqueada: boolean
  desbloqueadaEm: string | null
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function CatalogoConquistas({ itens }: { itens: ConquistaDoCatalogo[] }) {
  const total = itens.filter((item) => item.desbloqueada).length
  return (
    <section className="catalogo-conquistas">
      <h2>
        Catálogo de conquistas{' '}
        <span className="resumo-estrutura">
          ({total} de {itens.length})
        </span>
      </h2>
      <ul>
        {itens.map((item) => (
          <li key={item.codigo} className={item.desbloqueada ? 'conquista desbloqueada' : 'conquista'}>
            <div className="conquista-topo">
              <strong>{item.nome}</strong>
              <span className="conquista-estado">
                {item.desbloqueada && item.desbloqueadaEm
                  ? `Desbloqueada em ${dataCurta(item.desbloqueadaEm)}`
                  : `${item.progresso} / ${item.meta}`}
              </span>
            </div>
            <p className="conquista-descricao">{item.descricao}</p>
            {!item.desbloqueada && (
              <div
                className="progresso-barra"
                role="progressbar"
                aria-valuenow={item.progresso}
                aria-valuemin={0}
                aria-valuemax={item.meta}
                aria-label={`Progresso de ${item.nome}`}
              >
                <div
                  className="progresso-preenchimento"
                  style={{ width: `${Math.floor((item.progresso * 100) / item.meta)}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

// F5-01 (SPEC/2026-10-02-xp-niveis.md §6.1): calculado no servidor; o cliente só exibe
export interface XpDoEstudante {
  xpTotal: number
  xpSemana: number
  nivel: number
  xpNivelAtual: number
  xpProximoNivel: number
}

interface Props {
  sessao: Sessao
}

function BlocoXp({ xp }: { xp: XpDoEstudante }) {
  const faixa = xp.xpProximoNivel - xp.xpNivelAtual
  const percentual = Math.min(100, Math.max(0, Math.floor(((xp.xpTotal - xp.xpNivelAtual) * 100) / faixa)))
  return (
    <section className="bloco-xp">
      <h2>Experiência</h2>
      <dl className="metricas-xp">
        <div>
          <dt>Nível</dt>
          <dd>{xp.nivel}</dd>
        </div>
        <div>
          <dt>XP total</dt>
          <dd>{xp.xpTotal}</dd>
        </div>
        <div>
          <dt>XP desta semana</dt>
          <dd>{xp.xpSemana}</dd>
        </div>
      </dl>
      <div
        className="progresso-barra"
        role="progressbar"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso para o nível ${xp.nivel + 1}`}
      >
        <div className="progresso-preenchimento" style={{ width: `${percentual}%` }} />
      </div>
      <p className="progresso-texto">
        {xp.xpTotal} / {xp.xpProximoNivel} XP — faltam {xp.xpProximoNivel - xp.xpTotal} XP para o nível{' '}
        {xp.nivel + 1}
      </p>
    </section>
  )
}

export function PaginaPerfil({ sessao }: Props) {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [mensagemBio, setMensagemBio] = useState<string | null>(null)
  const [erroBio, setErroBio] = useState<string | null>(null)
  const [xp, setXp] = useState<XpDoEstudante | null>(null)
  const [catalogo, setCatalogo] = useState<ConquistaDoCatalogo[] | null>(null)

  const carregar = useCallback(async () => {
    try {
      const dados = await api<Perfil>(`/api/v1/perfis/${sessao.usuarioId}`)
      setPerfil(dados)
      setBio(dados.bio ?? '')
    } catch (erroCarga) {
      setErro(mensagemDeErro(erroCarga))
    }
  }, [sessao.usuarioId])

  // R-X24: XP total/semana só para o próprio estudante; falha aqui não impede o perfil
  useEffect(() => {
    if (sessao.papel !== 'estudante') return
    api<XpDoEstudante>('/api/v1/xp')
      .then(setXp)
      .catch(() => setXp(null))
    // R-C10: catálogo com progresso só para o próprio estudante; falha não impede o perfil
    api<ConquistaDoCatalogo[]>('/api/v1/conquistas')
      .then(setCatalogo)
      .catch(() => setCatalogo(null))
  }, [sessao.papel, sessao.usuarioId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function salvarBio(evento: FormEvent) {
    evento.preventDefault()
    setMensagemBio(null)
    setErroBio(null)
    try {
      const atualizado = await api<Perfil>(`/api/v1/perfis/${sessao.usuarioId}`, {
        metodo: 'PATCH',
        corpo: { bio },
      })
      setPerfil(atualizado)
      setMensagemBio('Bio salva.')
    } catch (erroSalvamento) {
      setErroBio(mensagemDeErro(erroSalvamento))
    }
  }

  if (erro) {
    return (
      <main>
        <p role="alert" className="erro">
          {erro}
        </p>
      </main>
    )
  }

  if (!perfil) {
    return (
      <main>
        <p className="carregando">Carregando perfil…</p>
      </main>
    )
  }

  return (
    <main>
      <article>
        <div className="cabecalho-perfil">
          <h1>Perfil</h1>
          <span className="papel-badge">Papel: {perfil.papel}</span>
        </div>

        {perfil.papel === 'professor' && (
          <form onSubmit={salvarBio}>
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(evento) => setBio(evento.target.value)} />
            {mensagemBio && (
              <p role="status" className="alerta alerta-sucesso">
                {mensagemBio}
              </p>
            )}
            {erroBio && (
              <p role="alert" className="erro">
                {erroBio}
              </p>
            )}
            <button type="submit">Salvar bio</button>
          </form>
        )}

        {xp && <BlocoXp xp={xp} />}

        <div className="grade-perfil">
          <section>
            <h2>Nível</h2>
            {perfil.nivel === null ? (
              <p className="valor-vazio">Sem nível ainda.</p>
            ) : (
              <p className="valor-destaque">{perfil.nivel}</p>
            )}
          </section>

          <section>
            <h2>Conquistas</h2>
            {perfil.conquistas.length === 0 ? (
              <p className="valor-vazio">Nenhuma conquista ainda.</p>
            ) : (
              <ul className="lista-chips">
                {perfil.conquistas.map((conquista) => (
                  <li key={conquista.codigo} title={`Desbloqueada em ${dataCurta(conquista.desbloqueadaEm)}`}>
                    {conquista.nome}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Inventário</h2>
            {perfil.inventario.length === 0 ? (
              <p className="valor-vazio">Inventário vazio.</p>
            ) : (
              <ul className="lista-chips">
                {perfil.inventario.map((item, indice) => (
                  <li key={indice}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {catalogo && <CatalogoConquistas itens={catalogo} />}
      </article>
    </main>
  )
}
