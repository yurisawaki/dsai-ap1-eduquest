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
    try {
      const atualizado = await api<Perfil>(`/api/v1/perfis/${sessao.usuarioId}`, {
        metodo: 'PATCH',
        corpo: { bio },
      })
      setPerfil(atualizado)
      setMensagemBio('Bio salva.')
    } catch (erroSalvamento) {
      setMensagemBio(mensagemDeErro(erroSalvamento))
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
        <p>Carregando perfil…</p>
      </main>
    )
  }

  return (
    <main>
      <article>
        <h1>Perfil</h1>
        <p>Papel: {perfil.papel}</p>

        {perfil.papel === 'professor' && (
          <form onSubmit={salvarBio}>
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(evento) => setBio(evento.target.value)} />
            {mensagemBio && <p>{mensagemBio}</p>}
            <button type="submit">Salvar bio</button>
          </form>
        )}

        <section>
          <h2>Nível</h2>
          <p>{perfil.nivel ?? 'Sem nível ainda.'}</p>
        </section>

        <section>
          <h2>Conquistas</h2>
          {perfil.conquistas.length === 0 ? (
            <p>Nenhuma conquista ainda.</p>
          ) : (
            <ul>
              {perfil.conquistas.map((conquista, indice) => (
                <li key={indice}>{typeof conquista === 'string' ? conquista : JSON.stringify(conquista)}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Inventário</h2>
          {perfil.inventario.length === 0 ? (
            <p>Inventário vazio.</p>
          ) : (
            <ul>
              {perfil.inventario.map((item, indice) => (
                <li key={indice}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </main>
  )
}
