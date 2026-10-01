import { FormEvent, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'

interface Props {
  aoIrParaLogin: () => void
}

export function PaginaCadastro({ aoIrParaLogin }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [criada, setCriada] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    try {
      await api('/api/v1/auth/registro', { metodo: 'POST', corpo: { email, senha } })
      setCriada(true)
    } catch (erroEnvio) {
      setErro(mensagemDeErro(erroEnvio))
    }
  }

  if (criada) {
    return (
      <main className="principal principal-estreito">
        <h1 className="titulo-pagina">Conta criada</h1>
        <p role="status" className="alerta alerta-sucesso">
          Sua conta foi criada. Faça login para continuar.
        </p>
        <button type="button" onClick={aoIrParaLogin}>
          Ir para o login
        </button>
      </main>
    )
  }

  return (
    <main className="principal principal-estreito">
      <h1 className="titulo-pagina">Criar conta</h1>
      <form onSubmit={enviar} className="formulario-destaque">
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
        </label>
        <label>
          Senha
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
        <button type="submit">Criar conta</button>
      </form>
    </main>
  )
}
