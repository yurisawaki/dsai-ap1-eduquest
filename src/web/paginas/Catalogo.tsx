import { FormEvent, useCallback, useEffect, useState } from 'react'
import { abrirCurso, irPara, useLocalizacao, voltar } from '../navegacao'
import { api, mensagemDeErro } from '../cliente'
import type { Sessao } from '../App'
import { ConteudoAula, type BlocoConteudo } from '../componentes/ConteudoAula'
import { QuestoesModulo } from './Questoes'
import { AvaliacaoDetalhe } from './Avaliacoes'

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

interface ProgressoModulo {
  moduloId: string
  aulasConcluidas: number
  aulasTotal: number
  percentual: number
}

interface ProgressoCurso {
  aulasConcluidas: number
  aulasTotal: number
  percentual: number
  modulos: ProgressoModulo[]
}

interface CursoDetalhe extends ResumoCurso {
  modulos: ModuloItem[]
  progresso?: ProgressoCurso
}

interface AvaliacaoResumo {
  id: string
  titulo: string
  tentativasMax: number
  abreEm: string
  fechaEm: string
  publicado: boolean
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
  concluida?: boolean
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

export function PaginaCatalogo({ sessao }: Props) {
  const [cursos, setCursos] = useState<ResumoCurso[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [tituloNovo, setTituloNovo] = useState('')
  const { cursoAberto } = useLocalizacao()

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
    return <DetalheCurso sessao={sessao} cursoId={cursoAberto} aoVoltar={voltar} />
  }

  return (
    <main className="principal principal-largo">
      <h1 className="titulo-pagina">Catálogo de aprendizagem</h1>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="alerta alerta-sucesso">
          {mensagem}
        </p>
      )}

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
          <div className="skeleton-lista" role="status">
            <span className="skeleton-card" aria-hidden="true" />
            <span className="skeleton-card" aria-hidden="true" />
            <span className="skeleton-card" aria-hidden="true" />
            <span className="sr-only">Carregando catálogo…</span>
          </div>
        ) : cursos.length === 0 ? (
          <div className="estado-vazio">
            <p className="estado-vazio-frase">Nenhum curso disponível.</p>
            <p className="estado-vazio-apoio">
              {sessao.papel === 'professor'
                ? 'Use o formulário acima para criar seu primeiro curso.'
                : 'Assim que um professor publicar cursos, eles aparecem aqui.'}
            </p>
          </div>
        ) : (
          <ul className="grade-cursos">
            {cursos.map((curso) => (
              <li key={curso.id} className="card-curso">
                <div className="card-curso-topo">
                  <h3>{curso.titulo}</h3>
                  <span
                    className={`badge ${curso.publicado ? 'badge-sucesso' : 'badge-aviso'}`}
                  >
                    {estado(curso.publicado)}
                  </span>
                </div>
                <button type="button" onClick={() => abrirCurso(curso.id)}>
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
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoResumo[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [tituloNovoModulo, setTituloNovoModulo] = useState('')
  const [titulos, setTitulos] = useState<Record<string, string>>({})
  const [aulasNovas, setAulasNovas] = useState<Record<string, string>>({})
  const { aulaAberta, moduloQuestoesAberto, avaliacaoAberta } = useLocalizacao()

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

    try {
      const lista = await api<AvaliacaoResumo[]>(`/api/v1/cursos/${cursoId}/avaliacoes`)
      setAvaliacoes(lista)
    } catch {
      setAvaliacoes([])
    }
  }, [cursoId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (erro && !curso) {
    return (
      <main className="principal principal-largo">
        <p role="alert" className="erro">
          {erro}
        </p>
        <button
          type="button"
          className="botao-secundario voltar"
          onClick={aoVoltar}
        >
          Voltar ao catálogo
        </button>
      </main>
    )
  }

  if (!curso) {
    return (
      <main className="principal principal-largo">
        <p className="carregando">Carregando curso…</p>
      </main>
    )
  }

  if (moduloQuestoesAberto) {
    const modulo = curso.modulos.find((m) => m.id === moduloQuestoesAberto)
    return (
      <QuestoesModulo
        moduloId={moduloQuestoesAberto}
        tituloModulo={modulo?.titulo ?? ''}
        aoVoltar={voltar}
        sessao={sessao}
      />
    )
  }

  if (avaliacaoAberta) {
    return (
      <AvaliacaoDetalhe
        avaliacaoId={avaliacaoAberta}
        tituloCurso={curso.titulo}
        aoVoltar={voltar}
        sessao={sessao}
      />
    )
  }

  if (aulaAberta) {
    const moduloDaAula = curso.modulos.find((modulo) =>
      modulo.aulas.some((aula) => aula.id === aulaAberta)
    )
    return (
      <DetalheAula
        sessao={sessao}
        aulaId={aulaAberta}
        donoId={curso.donoId}
        tituloCurso={curso.titulo}
        tituloModulo={moduloDaAula?.titulo ?? ''}
        aoVoltar={voltar}
      />
    )
  }

  const podeEditar = sessao.papel === 'administrador' || curso.donoId === sessao.usuarioId
  const totalAulas = curso.modulos.reduce((total, modulo) => total + modulo.aulas.length, 0)
  const progressoModulos = new Map(
    (curso.progresso?.modulos ?? []).map((item) => [item.moduloId, item])
  )

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

  function contagemModulo(moduloId: string) {
    const info = progressoModulos.get(moduloId)
    if (!info) return null
    return (
      <span className="modulo-progresso">
        {info.aulasConcluidas} de {info.aulasTotal} aulas concluídas
      </span>
    )
  }

  return (
    <main className="principal principal-largo">
      <div className="cabecalho-pagina">
        <button
          type="button"
          className="botao-secundario voltar"
          onClick={aoVoltar}
        >
          Voltar ao catálogo
        </button>
        <h1>{curso.titulo}</h1>
        <p className="linha-estado">
          Estado: {''}
          <span className={`badge ${curso.publicado ? 'badge-sucesso' : 'badge-aviso'}`}>
            {estado(curso.publicado)}
          </span>
        </p>
        <p className="resumo-estrutura">
          {curso.modulos.length} {curso.modulos.length === 1 ? 'módulo' : 'módulos'} ·{' '}
          {totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'}
        </p>
      </div>

      {sessao.papel === 'estudante' && curso.progresso && (
        <section className="bloco-progresso" aria-label="Seu progresso">
          <h2>Seu progresso</h2>
          {curso.progresso.aulasTotal === 0 ? (
            <p className="valor-vazio">Nenhuma aula publicada ainda.</p>
          ) : (
            <>
              <div
                className="progresso-barra"
                role="progressbar"
                aria-valuenow={curso.progresso.percentual}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Percentual do curso"
              >
                <div
                  className="progresso-preenchimento"
                  style={{ width: `${curso.progresso.percentual}%` }}
                />
              </div>
              <p className="progresso-texto">
                {curso.progresso.percentual}% — {curso.progresso.aulasConcluidas} de{' '}
                {curso.progresso.aulasTotal} aula
                {curso.progresso.aulasTotal === 1 ? '' : 's'} concluída
                {curso.progresso.aulasTotal === 1 ? '' : 's'}
              </p>
            </>
          )}
        </section>
      )}

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="alerta alerta-sucesso">
          {mensagem}
        </p>
      )}

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
          <div className="barra-acoes">
            <button
              type="button"
              className="botao-secundario"
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
            </button>
            <button
              type="button"
              className="botao-perigo"
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
          </div>

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
          <p className="valor-vazio">Nenhum modulo ainda.</p>
        ) : (
          <ul className="lista-modulos">
            {curso.modulos.map((modulo, indice) => (
              <li key={modulo.id} className="modulo">
                <div className="modulo-cabecalho">
                  <h3 className="modulo-titulo">
                    <span className="modulo-numero" aria-hidden="true">
                      {indice + 1}
                    </span>
                    {modulo.titulo}
                  </h3>
                  {contagemModulo(modulo.id)}
                  <span
                    className={`badge ${modulo.publicado ? 'badge-sucesso' : 'badge-aviso'}`}
                  >
                    {estado(modulo.publicado)}
                  </span>
                </div>
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
                    <div className="modulo-acoes">
                      <button
                        type="button"
                        className="botao-secundario"
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
                      </button>
                      <button
                        type="button"
                        className="botao-perigo"
                        onClick={() =>
                          void executar(
                            () => api(`/api/v1/modulos/${modulo.id}`, { metodo: 'DELETE' }),
                            'Modulo excluido.'
                          )
                        }
                      >
                        Excluir modulo
                      </button>
                    </div>
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
                  <p className="valor-vazio">Nenhuma aula neste modulo.</p>
                ) : (
                  <ul className="lista-aulas">
                    {modulo.aulas.map((aula) => (
                      <li key={aula.id}>
                        <span className="aula-nome">{aula.titulo}</span>
                        <span
                          className={`badge ${aula.publicado ? 'badge-sucesso' : 'badge-aviso'}`}
                        >
                          {estado(aula.publicado)}
                        </span>
                        <button type="button" onClick={() => irPara({ aulaAberta: aula.id })}>
                          Abrir aula
                        </button>
                        {podeEditar && (
                          <>
                            <button
                              type="button"
                              className="botao-secundario"
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
                            </button>
                            <button
                              type="button"
                              className="botao-perigo"
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

                <div className="modulo-acoes">
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => irPara({ moduloQuestoesAberto: modulo.id })}
                  >
                    Ver questões
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Avaliações</h2>
        {!avaliacoes ? (
          <p className="carregando">Carregando avaliações…</p>
        ) : avaliacoes.length === 0 ? (
          <div className="estado-vazio">
            <p className="estado-vazio-frase">Nenhuma avaliação disponível.</p>
            <p className="estado-vazio-apoio">As avaliações publicadas aparecem aqui.</p>
          </div>
        ) : (
          <ul className="grade-cursos">
            {avaliacoes.map((avaliacao) => (
              <li key={avaliacao.id} className="card-curso">
                <div className="card-curso-topo">
                  <h3>{avaliacao.titulo}</h3>
                  <span
                    className={`badge ${avaliacao.publicado ? 'badge-sucesso' : 'badge-aviso'}`}
                  >
                    {estado(avaliacao.publicado)}
                  </span>
                </div>
                <p className="resumo-estrutura">
                  {new Date(avaliacao.abreEm).toLocaleDateString('pt-BR')} —{' '}
                  {new Date(avaliacao.fechaEm).toLocaleDateString('pt-BR')}
                </p>
                <p className="resumo-estrutura">
                  {avaliacao.tentativasMax}{' '}
                  {avaliacao.tentativasMax === 1 ? 'tentativa' : 'tentativas'}
                </p>
                <button type="button" onClick={() => irPara({ avaliacaoAberta: avaliacao.id })}>
                  Abrir avaliação
                </button>
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
  tituloCurso: string
  tituloModulo: string
  aoVoltar: () => void
}

function DetalheAula({
  sessao,
  aulaId,
  donoId,
  tituloCurso,
  tituloModulo,
  aoVoltar,
}: PropsAula) {
  const [aula, setAula] = useState<AulaDetalhe | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [tipoNovo, setTipoNovo] = useState<string>(TIPOS_CONTEUDO[0].valor)
  const [textoNovo, setTextoNovo] = useState('')
  const [urlNova, setUrlNova] = useState('')
  const [arquivoNovo, setArquivoNovo] = useState<File | null>(null)
  const [concluida, setConcluida] = useState(false)
  const [enviandoConclusao, setEnviandoConclusao] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const detalhe = await api<AulaDetalhe>(`/api/v1/aulas/${aulaId}`)
      setAula(detalhe)
      // AC-D6-13: a API é a fonte de verdade — o estado vem do banco a cada carga
      setConcluida(detalhe.concluida === true)
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
    if (concluida || enviandoConclusao) return
    setErro(null)
    setMensagem(null)
    setEnviandoConclusao(true)
    try {
      await api(`/api/v1/aulas/${aulaId}/conclusao`, { metodo: 'POST', corpo: {} })
      setConcluida(true)
      setMensagem('Conclusao registrada.')
    } catch (erroConclusao) {
      setErro(mensagemDeErro(erroConclusao))
    } finally {
      setEnviandoConclusao(false)
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
          <p className="carregando">Carregando aula…</p>
        )}
        <button type="button" className="botao-secundario voltar" onClick={aoVoltar}>
          Voltar ao curso
        </button>
      </main>
    )
  }

  const podeEditar = sessao.papel === 'administrador' || donoId === sessao.usuarioId

  return (
    <main>
      <button type="button" className="botao-secundario voltar" onClick={aoVoltar}>
        Voltar ao curso
      </button>
      {tituloCurso && tituloModulo && (
        <p className="trilha">
          {tituloCurso} › {tituloModulo} › Aula
        </p>
      )}
      <h1 className="titulo-aula">{aula.titulo}</h1>
      <p className="linha-estado">
        Estado: {''}
        <span className={`badge ${aula.publicado ? 'badge-sucesso' : 'badge-aviso'}`}>
          {estado(aula.publicado)}
        </span>
      </p>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="alerta alerta-sucesso">
          {mensagem}
        </p>
      )}

      <section>
        <h2>Conteudo</h2>
        {aula.conteudo.length === 0 ? (
          <div className="estado-vazio">
            <p className="estado-vazio-frase">Sem conteudo.</p>
            {podeEditar && (
              <p className="estado-vazio-apoio">
                Use o editor abaixo para adicionar texto, mídia ou arquivo.
              </p>
            )}
          </div>
        ) : (
          <ConteudoAula conteudo={aula.conteudo} />
        )}
      </section>

      {podeEditar && (
        <section>
          <h2>Editar conteudo</h2>
          {aula.conteudo.length > 0 && (
            <ul className="lista-blocos">
              {aula.conteudo.map((bloco, indice) => (
                <li key={bloco.id ?? indice}>
                  Bloco {indice + 1} — {bloco.tipo}{' '}
                  <button
                    type="button"
                    className="botao-perigo"
                    onClick={() => void removerBloco(indice)}
                  >
                    Remover bloco
                  </button>
                </li>
              ))}
            </ul>
          )}
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
        </section>
      )}

      {sessao.papel === 'estudante' && (
        <p className="acao-conclusao">
          <button
            type="button"
            onClick={() => void concluir()}
            disabled={concluida || enviandoConclusao}
            aria-busy={enviandoConclusao}
            className={concluida ? 'concluida' : undefined}
          >
            {enviandoConclusao
              ? 'Salvando…'
              : concluida
                ? '✓ Aula concluída'
                : 'Marcar como concluída'}
          </button>
        </p>
      )}
    </main>
  )
}
