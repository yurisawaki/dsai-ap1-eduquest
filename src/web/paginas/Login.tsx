import { FormEvent, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'

interface Props {
  aoEntrar: () => void
}

export function PaginaLogin({ aoEntrar }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    try {
      await api('/api/v1/auth/login', { metodo: 'POST', corpo: { email, senha } })
      aoEntrar()
    } catch (erroEnvio) {
      setErro(mensagemDeErro(erroEnvio))
    }
  }

  return (
    <main>
      <h1>Entrar</h1>
      <form onSubmit={enviar}>
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
        <button type="submit">Entrar</button>
      </form>
    </main>
  )
}
