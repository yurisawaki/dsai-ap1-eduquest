import { useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from './cliente'
import { navegarParaVista, substituirVista, useLocalizacao } from './navegacao'
import { PaginaCadastro } from './paginas/Cadastro'
import { PaginaAdministracao } from './paginas/ConfiguracaoXp'
import { PaginaCatalogo } from './paginas/Catalogo'
import { PaginaLogin } from './paginas/Login'
import { PaginaPerfil } from './paginas/Perfil'
import { PaginaRecuperacao } from './paginas/Recuperacao'

export interface Sessao {
  usuarioId: string
  papel: string
  expiraEm: string
}

export function App() {
  const [sessao, setSessao] = useState<Sessao | null | 'carregando'>('carregando')
  const { vista } = useLocalizacao()
  const [erro, setErro] = useState<string | null>(null)

  const atualizarSessao = useCallback(async () => {
    try {
      const dados = await api<Sessao>('/api/v1/auth/sessao')
      setSessao(dados)
      substituirVista('perfil')
    } catch {
      setSessao(null)
      substituirVista('login')
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
    substituirVista('login')
  }

  const autenticado = Boolean(sessao && sessao !== 'carregando')
  const sessaoAtual = sessao && sessao !== 'carregando' ? sessao : null

  return (
    <>
      <header className="topo">
        <span className="marca">
          <span className="marca-monograma" aria-hidden="true">
            EQ
          </span>
          <strong className="marca-nome">EduQuest</strong>
        </span>
        <nav aria-label="Navegação principal" className="nav-principal">
          {autenticado ? (
            <>
              <button
                type="button"
                className="nav-item"
                aria-current={vista === 'perfil' ? 'page' : undefined}
                onClick={() => navegarParaVista('perfil')}
              >
                Perfil
              </button>
              <button
                type="button"
                className="nav-item"
                aria-current={vista === 'catalogo' ? 'page' : undefined}
                onClick={() => navegarParaVista('catalogo')}
              >
                Catálogo
              </button>
              {sessaoAtual?.papel === 'administrador' && (
                <button
                  type="button"
                  className="nav-item"
                  aria-current={vista === 'administracao' ? 'page' : undefined}
                  onClick={() => navegarParaVista('administracao')}
                >
                  Administração
                </button>
              )}
              <button type="button" className="nav-item nav-sair" onClick={() => void sair()}>
                Sair
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="nav-item"
                aria-current={vista === 'login' ? 'page' : undefined}
                onClick={() => navegarParaVista('login')}
              >
                Entrar
              </button>
              <button
                type="button"
                className="nav-item"
                aria-current={vista === 'cadastro' ? 'page' : undefined}
                onClick={() => navegarParaVista('cadastro')}
              >
                Criar conta
              </button>
              <button
                type="button"
                className="nav-item"
                aria-current={vista === 'recuperacao' ? 'page' : undefined}
                onClick={() => navegarParaVista('recuperacao')}
              >
                Recuperar senha
              </button>
            </>
          )}
        </nav>
      </header>

      <div className="area-alertas">
        {erro && (
          <p role="alert" className="erro">
            {erro}
          </p>
        )}
      </div>

      {sessao === 'carregando' ? (
        <main>
          <p className="carregando">Carregando…</p>
        </main>
      ) : sessaoAtual && vista === 'perfil' ? (
        <PaginaPerfil sessao={sessaoAtual} />
      ) : sessaoAtual && vista === 'catalogo' ? (
        <PaginaCatalogo sessao={sessaoAtual} />
      ) : sessaoAtual && vista === 'administracao' && sessaoAtual.papel === 'administrador' ? (
        <PaginaAdministracao />
      ) : vista === 'cadastro' ? (
        <PaginaCadastro aoIrParaLogin={() => navegarParaVista('login')} />
      ) : vista === 'recuperacao' ? (
        <PaginaRecuperacao aoIrParaLogin={() => navegarParaVista('login')} />
      ) : (
        <PaginaLogin aoEntrar={() => void atualizarSessao()} />
      )}
    </>
  )
}
