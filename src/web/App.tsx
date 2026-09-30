import { useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from './cliente'
import { PaginaCadastro } from './paginas/Cadastro'
import { PaginaCatalogo } from './paginas/Catalogo'
import { PaginaLogin } from './paginas/Login'
import { PaginaPerfil } from './paginas/Perfil'
import { PaginaRecuperacao } from './paginas/Recuperacao'

export interface Sessao {
  usuarioId: string
  papel: string
  expiraEm: string
}

type Vista = 'login' | 'cadastro' | 'perfil' | 'recuperacao' | 'catalogo'

export function App() {
  const [sessao, setSessao] = useState<Sessao | null | 'carregando'>('carregando')
  const [vista, setVista] = useState<Vista>('login')
  const [erro, setErro] = useState<string | null>(null)

  const atualizarSessao = useCallback(async () => {
    try {
      const dados = await api<Sessao>('/api/v1/auth/sessao')
      setSessao(dados)
      setVista('perfil')
    } catch {
      setSessao(null)
      setVista('login')
    }
  }, [])

  useEffect(() => {
    void atualizarSessao()
  }, [atualizarSessao])

  async function sair() {
    setErro(null)
    try {
      await api('/api/v1/auth/logout', { metodo: 'POST' })
    } catch (erroSaida) {
      setErro(mensagemDeErro(erroSaida))
    }
    setSessao(null)
    setVista('login')
  }

  const autenticado = Boolean(sessao && sessao !== 'carregando')
  const sessaoAtual = sessao && sessao !== 'carregando' ? sessao : null

  return (
    <>
      <header>
        <strong>EduQuest</strong>
        <nav>
          {autenticado ? (
            <>
              <button type="button" onClick={() => setVista('perfil')}>
                Perfil
              </button>
              <button type="button" onClick={() => setVista('catalogo')}>
                Catálogo
              </button>
              <button type="button" onClick={() => void sair()}>
                Sair
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setVista('login')}>
                Entrar
              </button>
              <button type="button" onClick={() => setVista('cadastro')}>
                Criar conta
              </button>
              <button type="button" onClick={() => setVista('recuperacao')}>
                Recuperar senha
              </button>
            </>
          )}
        </nav>
      </header>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}

      {sessao === 'carregando' ? (
        <main>
          <p>Carregando…</p>
        </main>
      ) : sessaoAtual && vista === 'perfil' ? (
        <PaginaPerfil sessao={sessaoAtual} />
      ) : sessaoAtual && vista === 'catalogo' ? (
        <PaginaCatalogo sessao={sessaoAtual} />
      ) : vista === 'cadastro' ? (
        <PaginaCadastro aoIrParaLogin={() => setVista('login')} />
      ) : vista === 'recuperacao' ? (
        <PaginaRecuperacao aoIrParaLogin={() => setVista('login')} />
      ) : (
        <PaginaLogin aoEntrar={() => void atualizarSessao()} />
      )}
    </>
  )
}
