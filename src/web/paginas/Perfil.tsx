import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'
import type { Sessao } from '../App'

export interface Perfil {
  id: string
  papel: string
  bio?: string | null
  nivel: number | null
  conquistas: unknown[]
  inventario: unknown[]
}

interface Props {
  sessao: Sessao
}

export function PaginaPerfil({ sessao }: Props) {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [mensagemBio, setMensagemBio] = useState<string | null>(null)
  const [erroBio, setErroBio] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const dados = await api<Perfil>(`/api/v1/perfis/${sessao.usuarioId}`)
      setPerfil(dados)
      setBio(dados.bio ?? '')
    } catch (erroCarga) {
      setErro(mensagemDeErro(erroCarga))
    }
  }, [sessao.usuarioId])

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
                {perfil.conquistas.map((conquista, indice) => (
                  <li key={indice}>
                    {typeof conquista === 'string' ? conquista : JSON.stringify(conquista)}
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
      </article>
    </main>
  )
}
