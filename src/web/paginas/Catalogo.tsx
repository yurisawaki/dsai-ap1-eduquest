import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'
import type { Sessao } from '../App'

interface ResumoCurso {
  id: string
  titulo: string
  publicado: boolean
  donoId: string
}

interface AulaItem {
  id: string
  titulo: string
  publicado: boolean
}

interface ModuloItem {
  id: string
  titulo: string
  publicado: boolean
  aulas: AulaItem[]
}

interface CursoDetalhe extends ResumoCurso {
  modulos: ModuloItem[]
}

interface BlocoConteudo {
  id?: string
  tipo: string
  dados: unknown
}

interface AulaDetalhe {
  id: string
  titulo: string
  publicado: boolean
  conteudo: BlocoConteudo[]
}

interface Props {
  sessao: Sessao
}

const TIPOS_CONTEUDO = ['texto', 'midia_embedada', 'material_anexo'] as const

function estado(publicado: boolean): string {
  return publicado ? 'Publicado' : 'Rascunho'
}

export function PaginaCatalogo({ sessao }: Props) {
  const [cursos, setCursos] = useState<ResumoCurso[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [tituloNovo, setTituloNovo] = useState('')
  const [cursoAberto, setCursoAberto] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const lista = await api<ResumoCurso[]>('/api/v1/cursos')
      setCursos(lista)
      setErro(null)
    } catch (erroCarga) {
      setErro(mensagemDeErro(erroCarga))
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function criarCurso(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setMensagem(null)
    try {
      await api('/api/v1/cursos', { metodo: 'POST', corpo: { titulo: tituloNovo } })
      setTituloNovo('')
      setMensagem('Curso criado.')
      await carregar()
    } catch (erroCriacao) {
      setErro(mensagemDeErro(erroCriacao))
    }
  }

  if (cursoAberto) {
    return (
      <DetalheCurso sessao={sessao} cursoId={cursoAberto} aoVoltar={() => setCursoAberto(null)} />
    )
  }

  return (
    <main>
      <h1>Catálogo de aprendizagem</h1>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}
      {mensagem && <p>{mensagem}</p>}

      {sessao.papel === 'professor' && (
        <form onSubmit={criarCurso}>
          <label htmlFor="titulo-curso">Novo curso</label>
          <input
            id="titulo-curso"
            value={tituloNovo}
            onChange={(evento) => setTituloNovo(evento.target.value)}
          />
          <button type="submit">Criar curso</button>
        </form>
      )}

      <section>
        <h2>Cursos</h2>
        {!cursos ? (
          <p>Carregando catálogo…</p>
        ) : cursos.length === 0 ? (
          <p>Nenhum curso disponível.</p>
        ) : (
          <ul>
            {cursos.map((curso) => (
              <li key={curso.id}>
                {curso.titulo} — {estado(curso.publicado)}{' '}
                <button type="button" onClick={() => setCursoAberto(curso.id)}>
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

interface PropsCurso {
  sessao: Sessao
  cursoId: string
  aoVoltar: () => void
}

function DetalheCurso({ sessao, cursoId, aoVoltar }: PropsCurso) {
  const [curso, setCurso] = useState<CursoDetalhe | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [tituloNovoModulo, setTituloNovoModulo] = useState('')
  const [titulos, setTitulos] = useState<Record<string, string>>({})
  const [aulasNovas, setAulasNovas] = useState<Record<string, string>>({})
  const [aulaAberta, setAulaAberta] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const detalhe = await api<CursoDetalhe>(`/api/v1/cursos/${cursoId}`)
      setCurso(detalhe)
      const mapa: Record<string, string> = { [detalhe.id]: detalhe.titulo }
      for (const modulo of detalhe.modulos) {
        mapa[modulo.id] = modulo.titulo
        for (const aula of modulo.aulas) {
          mapa[aula.id] = aula.titulo
        }
      }
      setTitulos(mapa)
      setErro(null)
    } catch (erroCarga) {
      setErro(mensagemDeErro(erroCarga))
    }
  }, [cursoId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (erro && !curso) {
    return (
      <main>
        <p role="alert" className="erro">
          {erro}
        </p>
        <button type="button" onClick={aoVoltar}>
          Voltar ao catálogo
        </button>
      </main>
    )
  }

  if (!curso) {
    return (
      <main>
        <p>Carregando curso…</p>
      </main>
    )
  }

  if (aulaAberta) {
    return (
      <DetalheAula
        sessao={sessao}
        aulaId={aulaAberta}
        donoId={curso.donoId}
        aoVoltar={() => setAulaAberta(null)}
      />
    )
  }

  const podeEditar = sessao.papel === 'administrador' || curso.donoId === sessao.usuarioId

  async function executar(acao: () => Promise<unknown>, sucesso?: string) {
    setErro(null)
    setMensagem(null)
    try {
      await acao()
      setMensagem(sucesso ?? null)
      await carregar()
    } catch (erroAcao) {
      setErro(mensagemDeErro(erroAcao))
    }
  }

  async function criarModulo(evento: FormEvent) {
    evento.preventDefault()
    await executar(
      () => api(`/api/v1/cursos/${cursoId}/modulos`, { metodo: 'POST', corpo: { titulo: tituloNovoModulo } }),
      'Modulo criado.'
    )
    setTituloNovoModulo('')
  }

  async function criarAula(moduloId: string) {
    const titulo = aulasNovas[moduloId] ?? ''
    await executar(
      () => api(`/api/v1/modulos/${moduloId}/aulas`, { metodo: 'POST', corpo: { titulo } }),
      'Aula criada.'
    )
    setAulasNovas({ ...aulasNovas, [moduloId]: '' })
  }

  function campoTitulo(id: string, aoMudar: (valor: string) => void) {
    return (
      <input
        aria-label={`Titulo de ${titulos[id] ?? id}`}
        value={titulos[id] ?? ''}
        onChange={(evento) => aoMudar(evento.target.value)}
      />
    )
  }

  return (
    <main>
      <p>
        <button type="button" onClick={aoVoltar}>
          Voltar ao catálogo
        </button>
      </p>
      <h1>{curso.titulo}</h1>
      <p>Estado: {estado(curso.publicado)}</p>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}
      {mensagem && <p>{mensagem}</p>}

      {podeEditar && (
        <>
          <form
            onSubmit={(evento) => {
              evento.preventDefault()
              void executar(
                () =>
                  api(`/api/v1/cursos/${cursoId}`, {
                    metodo: 'PATCH',
                    corpo: { titulo: titulos[cursoId] ?? curso.titulo },
                  }),
                'Titulo atualizado.'
              )
            }}
          >
            {campoTitulo(cursoId, (valor) => setTitulos({ ...titulos, [cursoId]: valor }))}
            <button type="submit">Salvar titulo do curso</button>
          </form>
          <p>
            <button
              type="button"
              onClick={() =>
                void executar(
                  () =>
                    api(`/api/v1/cursos/${cursoId}`, {
                      metodo: 'PATCH',
                      corpo: { publicado: !curso.publicado },
                    }),
                  curso.publicado ? 'Curso despublicado.' : 'Curso publicado.'
                )
              }
            >
              {curso.publicado ? 'Despublicar curso' : 'Publicar curso'}
            </button>{' '}
            <button
              type="button"
              onClick={() =>
                void executar(
                  async () => {
                    await api(`/api/v1/cursos/${cursoId}`, { metodo: 'DELETE' })
                    aoVoltar()
                  },
                  'Curso excluido.'
                )
              }
            >
              Excluir curso
            </button>
          </p>

          <form onSubmit={criarModulo}>
            <label htmlFor="titulo-modulo">Novo modulo</label>
            <input
              id="titulo-modulo"
              value={tituloNovoModulo}
              onChange={(evento) => setTituloNovoModulo(evento.target.value)}
            />
            <button type="submit">Criar modulo</button>
          </form>
        </>
      )}

      <section>
        <h2>Modulos</h2>
        {curso.modulos.length === 0 ? (
          <p>Nenhum modulo ainda.</p>
        ) : (
          <ul>
            {curso.modulos.map((modulo) => (
              <li key={modulo.id}>
                <h3>
                  {modulo.titulo} — {estado(modulo.publicado)}
                </h3>
                {podeEditar && (
                  <>
                    <form
                      onSubmit={(evento) => {
                        evento.preventDefault()
                        void executar(
                          () =>
                            api(`/api/v1/modulos/${modulo.id}`, {
                              metodo: 'PATCH',
                              corpo: { titulo: titulos[modulo.id] ?? modulo.titulo },
                            }),
                          'Titulo do modulo atualizado.'
                        )
                      }}
                    >
                      {campoTitulo(modulo.id, (valor) =>
                        setTitulos({ ...titulos, [modulo.id]: valor })
                      )}
                      <button type="submit">Salvar titulo do modulo</button>
                    </form>
                    <button
                      type="button"
                      onClick={() =>
                        void executar(
                          () =>
                            api(`/api/v1/modulos/${modulo.id}`, {
                              metodo: 'PATCH',
                              corpo: { publicado: !modulo.publicado },
                            }),
                          modulo.publicado ? 'Modulo despublicado.' : 'Modulo publicado.'
                        )
                      }
                    >
                      {modulo.publicado ? 'Despublicar modulo' : 'Publicar modulo'}
                    </button>{' '}
                    <button
                      type="button"
                      onClick={() =>
                        void executar(
                          () => api(`/api/v1/modulos/${modulo.id}`, { metodo: 'DELETE' }),
                          'Modulo excluido.'
                        )
                      }
                    >
                      Excluir modulo
                    </button>
                    <form
                      onSubmit={(evento) => {
                        evento.preventDefault()
                        void criarAula(modulo.id)
                      }}
                    >
                      <label htmlFor={`aula-${modulo.id}`}>Nova aula</label>
                      <input
                        id={`aula-${modulo.id}`}
                        value={aulasNovas[modulo.id] ?? ''}
                        onChange={(evento) =>
                          setAulasNovas({ ...aulasNovas, [modulo.id]: evento.target.value })
                        }
                      />
                      <button type="submit">Criar aula</button>
                    </form>
                  </>
                )}

                {modulo.aulas.length === 0 ? (
                  <p>Nenhuma aula neste modulo.</p>
                ) : (
                  <ul>
                    {modulo.aulas.map((aula) => (
                      <li key={aula.id}>
                        {aula.titulo} — {estado(aula.publicado)}{' '}
                        <button type="button" onClick={() => setAulaAberta(aula.id)}>
                          Abrir aula
                        </button>{' '}
                        {podeEditar && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                void executar(
                                  () =>
                                    api(`/api/v1/aulas/${aula.id}`, {
                                      metodo: 'PATCH',
                                      corpo: { publicado: !aula.publicado },
                                    }),
                                  aula.publicado ? 'Aula despublicada.' : 'Aula publicada.'
                                )
                              }
                            >
                              {aula.publicado ? 'Despublicar aula' : 'Publicar aula'}
                            </button>{' '}
                            <button
                              type="button"
                              onClick={() =>
                                void executar(
                                  () => api(`/api/v1/aulas/${aula.id}`, { metodo: 'DELETE' }),
                                  'Aula excluida.'
                                )
                              }
                            >
                              Excluir aula
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

interface PropsAula {
  sessao: Sessao
  aulaId: string
  donoId: string
  aoVoltar: () => void
}

function DetalheAula({ sessao, aulaId, donoId, aoVoltar }: PropsAula) {
  const [aula, setAula] = useState<AulaDetalhe | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [tipoNovo, setTipoNovo] = useState<string>(TIPOS_CONTEUDO[0])
  const [dadosNovos, setDadosNovos] = useState('{}')

  const carregar = useCallback(async () => {
    try {
      const detalhe = await api<AulaDetalhe>(`/api/v1/aulas/${aulaId}`)
      setAula(detalhe)
      setErro(null)
    } catch (erroCarga) {
      setErro(mensagemDeErro(erroCarga))
    }
  }, [aulaId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function salvarConteudo(blocos: BlocoConteudo[]) {
    setErro(null)
    setMensagem(null)
    try {
      await api(`/api/v1/aulas/${aulaId}/conteudo`, {
        metodo: 'PUT',
        corpo: blocos.map(({ tipo, dados }) => ({ tipo, dados })),
      })
      setMensagem('Conteudo salvo.')
      await carregar()
    } catch (erroSalvamento) {
      setErro(mensagemDeErro(erroSalvamento))
    }
  }

  async function adicionarBloco(evento: FormEvent) {
    evento.preventDefault()
    let dados: unknown
    try {
      dados = JSON.parse(dadosNovos)
    } catch {
      setErro('Conteudo do bloco precisa ser JSON valido.')
      return
    }
    await salvarConteudo([...(aula?.conteudo ?? []), { tipo: tipoNovo, dados }])
    setDadosNovos('{}')
  }

  async function concluir() {
    setErro(null)
    setMensagem(null)
    try {
      await api(`/api/v1/aulas/${aulaId}/conclusao`, { metodo: 'POST', corpo: {} })
      setMensagem('Conclusao registrada.')
    } catch (erroConclusao) {
      setErro(mensagemDeErro(erroConclusao))
    }
  }

  if (!aula) {
    return (
      <main>
        {erro ? (
          <p role="alert" className="erro">
            {erro}
          </p>
        ) : (
          <p>Carregando aula…</p>
        )}
        <button type="button" onClick={aoVoltar}>
          Voltar ao curso
        </button>
      </main>
    )
  }

  const podeEditar = sessao.papel === 'administrador' || donoId === sessao.usuarioId

  return (
    <main>
      <p>
        <button type="button" onClick={aoVoltar}>
          Voltar ao curso
        </button>
      </p>
      <h1>{aula.titulo}</h1>
      <p>Estado: {estado(aula.publicado)}</p>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}
      {mensagem && <p>{mensagem}</p>}

      <section>
        <h2>Conteudo</h2>
        {aula.conteudo.length === 0 ? (
          <p>Sem conteudo.</p>
        ) : (
          <ul>
            {aula.conteudo.map((bloco, indice) => (
              <li key={bloco.id ?? indice}>
                <strong>{bloco.tipo}</strong>
                <pre>{JSON.stringify(bloco.dados, null, 2)}</pre>
                {podeEditar && (
                  <button
                    type="button"
                    onClick={() =>
                      void salvarConteudo(
                        aula.conteudo.filter((_item, posicao) => posicao !== indice)
                      )
                    }
                  >
                    Remover bloco
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {podeEditar && (
        <form onSubmit={adicionarBloco}>
          <label htmlFor="tipo-conteudo">Tipo do bloco</label>
          <select
            id="tipo-conteudo"
            value={tipoNovo}
            onChange={(evento) => setTipoNovo(evento.target.value)}
          >
            {TIPOS_CONTEUDO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>

          <label htmlFor="dados-conteudo">Dados do bloco (JSON)</label>
          <textarea
            id="dados-conteudo"
            value={dadosNovos}
            onChange={(evento) => setDadosNovos(evento.target.value)}
          />
          <button type="submit">Adicionar bloco</button>
        </form>
      )}

      {sessao.papel === 'estudante' && (
        <p>
          <button type="button" onClick={() => void concluir()}>
            Marcar aula como concluida
          </button>
        </p>
      )}
    </main>
  )
}
