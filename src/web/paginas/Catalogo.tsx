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
  posicao?: number
  dados: unknown
}

interface ArquivoEnviado {
  arquivoId: string
  nome: string
  mime: string
  tamanho: number
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

const TIPOS_CONTEUDO = [
  { valor: 'texto', rotulo: 'Texto' },
  { valor: 'midia_embedada', rotulo: 'Midia embedada' },
  { valor: 'material_anexo', rotulo: 'Material anexo' },
] as const

// R-C6b da SPEC de conteúdo: os 5 tipos aceitos pela F2-15
const TIPOS_ANEXO = 'application/pdf,image/png,image/jpeg,image/gif,application/zip,.pdf,.png,.jpg,.jpeg,.gif,.zip'

function estado(publicado: boolean): string {
  return publicado ? 'Publicado' : 'Rascunho'
}

function campo(dados: unknown, chave: string): string | null {
  if (dados === null || typeof dados !== 'object') return null
  const valor = (dados as Record<string, unknown>)[chave]
  return typeof valor === 'string' ? valor : null
}

function tamanhoLegivel(bytes: unknown): string {
  if (typeof bytes !== 'number') return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function urlHttps(valor: string): boolean {
  try {
    return new URL(valor).protocol === 'https:'
  } catch {
    return false
  }
}

// R-C8/A-3: o PUT recebe só {tipo, dados}; anexo é projetado para {arquivoId}
function paraEnvio(bloco: BlocoConteudo): { tipo: string; dados: unknown } {
  if (bloco.tipo === 'material_anexo') {
    return { tipo: bloco.tipo, dados: { arquivoId: campo(bloco.dados, 'arquivoId') } }
  }
  return { tipo: bloco.tipo, dados: bloco.dados }
}

function lerBase64(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      const url = String(leitor.result ?? '')
      resolver(url.slice(url.indexOf(',') + 1))
    }
    leitor.onerror = () => rejeitar(new Error('Nao foi possivel ler o arquivo.'))
    leitor.readAsDataURL(arquivo)
  })
}

// R-C8: cada tipo tem renderização própria; texto nunca é interpretado como marcação
function BlocoRenderizado({ bloco }: { bloco: BlocoConteudo }) {
  if (bloco.tipo === 'texto') {
    const texto = campo(bloco.dados, 'texto')
    if (texto !== null) return <p className="texto-aula">{texto}</p>
  }
  if (bloco.tipo === 'midia_embedada') {
    const url = campo(bloco.dados, 'url')
    if (url !== null) {
      return (
        <div>
          <iframe
            src={url}
            title="Midia da aula"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          />
          <p>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Abrir midia em nova aba
            </a>
          </p>
        </div>
      )
    }
  }
  if (bloco.tipo === 'material_anexo') {
    const arquivoId = campo(bloco.dados, 'arquivoId')
    const nome = campo(bloco.dados, 'nome')
    if (arquivoId !== null && nome !== null) {
      const tamanho = tamanhoLegivel((bloco.dados as Record<string, unknown>).tamanho)
      return (
        <p>
          <a href={`/api/v1/arquivos/${arquivoId}`}>Baixar {nome}</a>
          {tamanho && ` (${tamanho})`}
        </p>
      )
    }
  }
  return <p>Bloco em formato nao suportado.</p>
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
  const [tipoNovo, setTipoNovo] = useState<string>(TIPOS_CONTEUDO[0].valor)
  const [textoNovo, setTextoNovo] = useState('')
  const [urlNova, setUrlNova] = useState('')
  const [arquivoNovo, setArquivoNovo] = useState<File | null>(null)

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

  async function salvarConteudo(blocos: BlocoConteudo[]): Promise<boolean> {
    try {
      await api(`/api/v1/aulas/${aulaId}/conteudo`, {
        metodo: 'PUT',
        corpo: blocos.map(paraEnvio),
      })
      setMensagem('Conteudo salvo.')
      await carregar()
      return true
    } catch (erroSalvamento) {
      setErro(mensagemDeErro(erroSalvamento))
      return false
    }
  }

  async function removerBloco(indice: number) {
    setErro(null)
    setMensagem(null)
    await salvarConteudo((aula?.conteudo ?? []).filter((_item, posicao) => posicao !== indice))
  }

  async function novoBloco(): Promise<BlocoConteudo | null> {
    if (tipoNovo === 'texto') {
      if (textoNovo.trim().length === 0) {
        setErro('Informe o texto do bloco.')
        return null
      }
      return { tipo: 'texto', dados: { texto: textoNovo } }
    }
    if (tipoNovo === 'midia_embedada') {
      if (!urlHttps(urlNova)) {
        setErro('A URL da midia precisa comecar com https://.')
        return null
      }
      return { tipo: 'midia_embedada', dados: { url: urlNova } }
    }
    if (!arquivoNovo) {
      setErro('Escolha um arquivo.')
      return null
    }
    const enviado = await api<ArquivoEnviado>(`/api/v1/aulas/${aulaId}/arquivos`, {
      metodo: 'POST',
      corpo: { nome: arquivoNovo.name, mime: arquivoNovo.type, base64: await lerBase64(arquivoNovo) },
    })
    return { tipo: 'material_anexo', dados: { arquivoId: enviado.arquivoId } }
  }

  async function adicionarBloco(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setMensagem(null)
    let bloco: BlocoConteudo | null
    try {
      bloco = await novoBloco()
    } catch (erroEnvio) {
      setErro(mensagemDeErro(erroEnvio))
      return
    }
    if (!bloco) return
    if (await salvarConteudo([...(aula?.conteudo ?? []), bloco])) {
      setTextoNovo('')
      setUrlNova('')
      setArquivoNovo(null)
    }
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
          <ol>
            {aula.conteudo.map((bloco, indice) => (
              <li key={bloco.id ?? indice}>
                <BlocoRenderizado bloco={bloco} />
                {podeEditar && (
                  <button type="button" onClick={() => void removerBloco(indice)}>
                    Remover bloco
                  </button>
                )}
              </li>
            ))}
          </ol>
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
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>

          {tipoNovo === 'texto' && (
            <>
              <label htmlFor="texto-conteudo">Texto</label>
              <textarea
                id="texto-conteudo"
                value={textoNovo}
                onChange={(evento) => setTextoNovo(evento.target.value)}
              />
            </>
          )}
          {tipoNovo === 'midia_embedada' && (
            <>
              <label htmlFor="url-conteudo">URL da midia (https)</label>
              <input
                id="url-conteudo"
                type="url"
                value={urlNova}
                onChange={(evento) => setUrlNova(evento.target.value)}
              />
            </>
          )}
          {tipoNovo === 'material_anexo' && (
            <>
              <label htmlFor="arquivo-conteudo">Arquivo (PDF, PNG, JPEG, GIF ou ZIP ate 5 MB)</label>
              <input
                id="arquivo-conteudo"
                type="file"
                accept={TIPOS_ANEXO}
                onChange={(evento) => setArquivoNovo(evento.target.files?.[0] ?? null)}
              />
            </>
          )}
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
