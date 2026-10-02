import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'
import { AvisoXp, type XpDaAcao } from '../componentes/AvisoXp'

interface QuestaoRef {
  questao: {
    id: string
    tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'numerica' | 'dissertativa'
    enunciado: string
    alternativas?: { id: string; texto: string; posicao: number }[]
  }
  peso: number
}

interface AvaliacaoLida {
  id: string
  cursoId: string
  titulo: string
  tentativasMax: number
  abreEm: string
  fechaEm: string
  publicado: boolean
  questoes?: QuestaoRef[]
}

interface ResultadoLida {
  tentativas: {
    id: string
    enviadaEm: string
    status: 'aguardando_correcao' | 'corrigida'
    nota: number | null
  }[]
  tentativasRestantes: number
  resultado: number | null
}

interface TentativaEnvio {
  tentativaId: string
  status: 'aguardando_correcao' | 'corrigida'
  nota: number | null
  xp?: XpDaAcao
}

interface Props {
  avaliacaoId: string
  tituloCurso: string
  aoVoltar: () => void
  sessao: { papel: string }
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarNota(nota: number | null): string {
  if (nota === null) return '—'
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function rotuloStatus(status: string): string {
  return status === 'corrigida' ? 'Corrigida' : 'Aguardando correção'
}

function classeStatus(status: string): string {
  return status === 'corrigida' ? 'badge-sucesso' : 'badge-aviso'
}

export function AvaliacaoDetalhe({ avaliacaoId, tituloCurso, aoVoltar, sessao }: Props) {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoLida | null>(null)
  const [resultado, setResultado] = useState<ResultadoLida | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const [det, res] = await Promise.all([
        api<AvaliacaoLida>(`/api/v1/avaliacoes/${avaliacaoId}`),
        sessao.papel === 'estudante'
          ? api<ResultadoLida>(`/api/v1/avaliacoes/${avaliacaoId}/resultado`)
          : Promise.resolve(null),
      ])
      setAvaliacao(det)
      setResultado(res)
      setErro(null)
    } catch (erroCarga) {
      setErro(mensagemDeErro(erroCarga))
    }
  }, [avaliacaoId, sessao.papel])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (erro && !avaliacao) {
    return (
      <main>
        <p role="alert" className="erro">
          {erro}
        </p>
        <button type="button" className="botao-secundario voltar" onClick={aoVoltar}>
          Voltar ao curso
        </button>
      </main>
    )
  }

  if (!avaliacao) {
    return (
      <main>
        <p className="carregando">Carregando avaliação…</p>
      </main>
    )
  }

  const agora = new Date()
  const abre = new Date(avaliacao.abreEm)
  const fecha = new Date(avaliacao.fechaEm)
  const dentroDaJanela = agora >= abre && agora <= fecha
  const antesDaJanela = agora < abre

  return (
    <main className="principal principal-largo">
      <div className="cabecalho-pagina">
        <button type="button" className="botao-secundario voltar" onClick={aoVoltar}>
          Voltar ao curso
        </button>
        <p className="trilha">{tituloCurso} › Avaliações</p>
        <h1>{avaliacao.titulo}</h1>
        <p className="resumo-estrutura">
          Abre em {formatarData(avaliacao.abreEm)} · Fecha em {formatarData(avaliacao.fechaEm)} ·{' '}
          {avaliacao.tentativasMax} {avaliacao.tentativasMax === 1 ? 'tentativa' : 'tentativas'}
        </p>
        {resultado && (
          <p className="resumo-estrutura">
            Restam {resultado.tentativasRestantes} {resultado.tentativasRestantes === 1 ? 'tentativa' : 'tentativas'}
            {resultado.resultado !== null && <> · Melhor nota: {formatarNota(resultado.resultado)}</>}
          </p>
        )}
      </div>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}

      {!dentroDaJanela ? (
        <div className="estado-vazio">
          {antesDaJanela ? (
            <>
              <p className="estado-vazio-frase">A avaliação ainda não está aberta.</p>
              <p className="estado-vazio-apoio">
                Abre em {formatarData(avaliacao.abreEm)} · Fecha em {formatarData(avaliacao.fechaEm)}
              </p>
            </>
          ) : (
            <>
              <p className="estado-vazio-frase">A janela da avaliação foi encerrada.</p>
              <p className="estado-vazio-apoio">
                Abriu em {formatarData(avaliacao.abreEm)} · Encerrou em {formatarData(avaliacao.fechaEm)}
              </p>
            </>
          )}
          {resultado && <ResultadoBloco resultado={resultado} />}
        </div>
      ) : sessao.papel !== 'estudante' ? (
        <div className="estado-vazio">
          <p className="estado-vazio-frase">Apenas estudantes podem realizar esta avaliação.</p>
          <p className="estado-vazio-apoio">Professor/administração pode corrigir dissertativas.</p>
        </div>
      ) : !avaliacao.questoes || avaliacao.questoes.length === 0 ? (
        <div className="estado-vazio">
          <p className="estado-vazio-frase">Nenhuma questão nesta avaliação.</p>
        </div>
      ) : (
        <FormularioAvaliacao
          avaliacao={avaliacao}
          aoConcluir={() => void carregar()}
        />
      )}

      {resultado && dentroDaJanela && <ResultadoBloco resultado={resultado} />}
    </main>
  )
}

function ResultadoBloco({ resultado }: { resultado: ResultadoLida }) {
  return (
    <section className="resultado-secao">
      <h2>Resultado</h2>
      <div className="resultado-destaque">
        <span className="valor-destaque">
          {resultado.resultado !== null ? formatarNota(resultado.resultado) : '—'}
        </span>
        <span className="valor-vazio">
          {resultado.resultado !== null ? 'Melhor nota' : 'Nenhuma nota corrigida ainda'}
        </span>
      </div>
      <p className="resumo-estrutura">
        Restam {resultado.tentativasRestantes}{' '}
        {resultado.tentativasRestantes === 1 ? 'tentativa' : 'tentativas'}
      </p>
      {resultado.tentativas.length > 0 && (
        <ul className="lista-historico">
          {resultado.tentativas.map((tent) => (
            <li key={tent.id}>
              <span>{formatarData(tent.enviadaEm)}</span>
              <span className={`badge ${classeStatus(tent.status)}`}>{rotuloStatus(tent.status)}</span>
              <span>{tent.nota !== null ? formatarNota(tent.nota) : '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FormularioAvaliacao({
  avaliacao,
  aoConcluir,
}: {
  avaliacao: AvaliacaoLida
  aoConcluir: () => void
}) {
  const questoes = avaliacao.questoes ?? []
  const [respostas, setRespostas] = useState<Record<string, unknown>>({})
  const [enviando, setEnviando] = useState(false)
  const [envioConcluido, setEnvioConcluido] = useState<TentativaEnvio | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarRevisao, setMostrarRevisao] = useState(false)

  function responder(questaoId: string, valor: unknown) {
    setRespostas((atual) => ({ ...atual, [questaoId]: valor }))
  }

  function todasRespondidas(): boolean {
    return questoes.every((q) => {
      const resp = respostas[q.questao.id]
      if (q.questao.tipo === 'multipla_escolha') return Array.isArray(resp) && resp.length > 0
      if (q.questao.tipo === 'verdadeiro_falso') return resp !== undefined && resp !== null
      if (q.questao.tipo === 'numerica') return resp !== undefined && resp !== null && resp !== ''
      return typeof resp === 'string' && resp.trim().length > 0
    })
  }

  function naoRespondidas(): QuestaoRef[] {
    return questoes.filter((q) => {
      const resp = respostas[q.questao.id]
      if (q.questao.tipo === 'multipla_escolha') return !Array.isArray(resp) || resp.length === 0
      if (q.questao.tipo === 'verdadeiro_falso') return resp === undefined || resp === null
      if (q.questao.tipo === 'numerica') return resp === undefined || resp === null || resp === ''
      return typeof resp !== 'string' || resp.trim().length === 0
    })
  }

  function corpoEnvio(): { respostas: { questaoId: string; resposta: unknown }[] } {
    return {
      respostas: questoes
        .filter((q) => respostas[q.questao.id] !== undefined)
        .map((q) => {
          const valor = respostas[q.questao.id]
          if (q.questao.tipo === 'multipla_escolha') return { questaoId: q.questao.id, resposta: { alternativas: valor } }
          if (q.questao.tipo === 'verdadeiro_falso') return { questaoId: q.questao.id, resposta: { valor } }
          if (q.questao.tipo === 'numerica') return { questaoId: q.questao.id, resposta: { valor: Number(valor) } }
          return { questaoId: q.questao.id, resposta: { texto: valor } }
        }),
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!todasRespondidas() || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      const ret = await api<TentativaEnvio>(`/api/v1/avaliacoes/${avaliacao.id}/tentativas`, {
        metodo: 'POST',
        corpo: corpoEnvio(),
      })
      setEnvioConcluido(ret)
      aoConcluir()
    } catch (erroEnvio) {
      setErro(mensagemDeErro(erroEnvio))
    } finally {
      setEnviando(false)
    }
  }

  if (envioConcluido) {
    return (
      <div className="alerta alerta-sucesso" role="status">
        <p>
          <strong>Tentativa enviada!</strong>
        </p>
        <p>Status: {rotuloStatus(envioConcluido.status)}</p>
        <p>Nota: {envioConcluido.nota !== null ? formatarNota(envioConcluido.nota) : 'Disponível após correção'}</p>
        <AvisoXp xp={envioConcluido.xp} />
      </div>
    )
  }

  if (mostrarRevisao) {
    const pendentes = naoRespondidas()
    return (
      <form onSubmit={enviar} className="revisao-formulario">
        <h2>Revisão antes do envio</h2>
        <p className="resumo-estrutura">
          Respondidas: {questoes.length - pendentes.length} de {questoes.length}
        </p>
        {pendentes.length > 0 && (
          <div className="estado-vazio">
            <p className="estado-vazio-frase">Questões sem resposta:</p>
            <ul className="lista-pendentes">
              {pendentes.map((q, idx) => (
                <li key={q.questao.id}>{idx + 1}. {q.questao.enunciado.substring(0, 60)}…</li>
              ))}
            </ul>
          </div>
        )}
        <div className="alerta" role="alert">
          O envio é único e não pode ser desfeito.
        </div>
        {erro && (
          <p role="alert" className="erro">
            {erro}
          </p>
        )}
        <div className="barra-acoes">
          <button type="button" className="botao-secundario" onClick={() => setMostrarRevisao(false)}>
            Voltar e revisar
          </button>
          <button type="submit" disabled={!todasRespondidas() || enviando} aria-busy={enviando}>
            {enviando ? 'Enviando…' : 'Enviar tentativa'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form className="avaliacao-formulario">
      <h2>Questões</h2>
      <ol className="lista-questoes-avaliacao">
        {questoes.map((qRef, idx) => (
          <li key={qRef.questao.id} className="card-questao">
            <div className="questao-info">
              <span className="badge badge-neutro">Questão {idx + 1}</span>
              <span className="badge badge-neutro">Peso: {qRef.peso}</span>
            </div>
            <p className="questao-enunciado">{qRef.questao.enunciado}</p>
            <ControlesQuestao
              questao={qRef.questao}
              valor={respostas[qRef.questao.id]}
              aoMudar={(v) => responder(qRef.questao.id, v)}
            />
          </li>
        ))}
      </ol>
      <div className="barra-acoes">
        <button
          type="button"
          className="botao-secundario"
          onClick={() => setMostrarRevisao(true)}
          disabled={!todasRespondidas()}
        >
          Revisar respostas
        </button>
        <button
          type="button"
          onClick={() => setMostrarRevisao(true)}
          disabled={!todasRespondidas()}
        >
          Enviar tentativa
        </button>
      </div>
    </form>
  )
}

function ControlesQuestao({
  questao,
  valor,
  aoMudar,
}: {
  questao: QuestaoRef['questao']
  valor: unknown
  aoMudar: (v: unknown) => void
}) {
  if (questao.tipo === 'multipla_escolha' && questao.alternativas) {
    const atual = Array.isArray(valor) ? (valor as string[]) : []
    return (
      <fieldset className="alternativas">
        <legend className="sr-only">Selecione as alternativas</legend>
        {questao.alternativas.map((alt) => (
          <label key={alt.id} className="alternativa-opcao">
            <input
              type="checkbox"
              checked={atual.includes(alt.id)}
              onChange={(e) => {
                aoMudar(
                  e.target.checked ? [...atual, alt.id] : atual.filter((id) => id !== alt.id)
                )
              }}
            />
            <span>{alt.texto}</span>
          </label>
        ))}
      </fieldset>
    )
  }

  if (questao.tipo === 'verdadeiro_falso') {
    return (
      <fieldset className="alternativas">
        <legend className="sr-only">Verdadeiro ou falso</legend>
        {[true, false].map((v) => (
          <label key={String(v)} className="alternativa-opcao">
            <input
              type="radio"
              name={`vf-${questao.id}`}
              checked={valor === v}
              onChange={() => aoMudar(v)}
            />
            <span>{v ? 'Verdadeiro' : 'Falso'}</span>
          </label>
        ))}
      </fieldset>
    )
  }

  if (questao.tipo === 'numerica') {
    return (
      <label className="campo-numerico">
        <span className="sr-only">Resposta numérica</span>
        <input
          type="number"
          step="any"
          value={valor === undefined || valor === null ? '' : String(valor)}
          onChange={(e) => aoMudar(e.target.value === '' ? null : e.target.value)}
          placeholder="Digite um número"
        />
      </label>
    )
  }

  return (
    <label className="campo-texto">
      <span className="sr-only">Sua resposta</span>
      <textarea
        value={typeof valor === 'string' ? valor : ''}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder="Escreva sua resposta"
        rows={4}
      />
    </label>
  )
}
