import { FormEvent, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'

interface Props {
  aoIrParaLogin: () => void
}

export function PaginaRecuperacao({ aoIrParaLogin }: Props) {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [senha, setSenha] = useState('')
  const [solicitado, setSolicitado] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function solicitar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    try {
      await api('/api/v1/auth/recuperacao-senha', { metodo: 'POST', corpo: { email } })
      setSolicitado(true)
    } catch (erroSolicitacao) {
      setErro(mensagemDeErro(erroSolicitacao))
    }
  }

  async function redefinir(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    try {
      await api('/api/v1/auth/redefinicao-senha', { metodo: 'POST', corpo: { token, senha } })
      setConcluido(true)
    } catch (erroRedefinicao) {
      setErro(mensagemDeErro(erroRedefinicao))
    }
  }

  if (concluido) {
    return (
      <main className="principal principal-estreito">
        <h1 className="titulo-pagina">Senha redefinida</h1>
        <p role="status" className="alerta alerta-sucesso">
          Sua senha foi alterada. Entre com a nova senha.
        </p>
        <button type="button" onClick={aoIrParaLogin}>
          Ir para o login
        </button>
      </main>
    )
  }

  return (
    <main className="principal principal-estreito">
      <h1 className="titulo-pagina">Recuperar senha</h1>
      {!solicitado ? (
        <form onSubmit={solicitar} className="formulario-destaque">
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
            />
          </label>
          {erro && (
            <p role="alert" className="erro">
              {erro}
            </p>
          )}
          <button type="submit">Solicitar recuperação</button>
        </form>
      ) : (
        <form onSubmit={redefinir} className="formulario-destaque">
          <p>Solicitação de recuperação recebida.</p>
          <label>
            Token de recuperação
            <input value={token} onChange={(evento) => setToken(evento.target.value)} required />
          </label>
          <label>
            Nova senha
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              required
            />
          </label>
          {erro && (
            <p role="alert" className="erro">
              {erro}
            </p>
          )}
          <button type="submit">Redefinir senha</button>
        </form>
      )}
    </main>
  )
}
