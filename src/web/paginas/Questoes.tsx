import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from '../cliente'
import {
  AvisoConquistas,
  AvisoXp,
  type ConquistaDesbloqueada,
  type XpDaAcao,
} from '../componentes/AvisoXp'

interface AlternativaLida {
  id: string
  texto: string
  posicao: number
  correta?: boolean
}

interface QuestaoLida {
  id: string
  moduloId: string
  tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'numerica' | 'dissertativa'
  enunciado: string
  publicado: boolean
  alternativas?: AlternativaLida[]
}

interface RespostaEnvio {
  tentativaId: string
  acerto: boolean | null
  feedback: { explicacao: string | null }
  xp?: XpDaAcao
  conquistas?: ConquistaDesbloqueada[]
}

interface Props {
  moduloId: string
  tituloModulo: string
  aoVoltar: () => void
  sessao: { papel: string }
}

const ROTULOS_TIPO: Record<QuestaoLida['tipo'], string> = {
  multipla_escolha: 'Múltipla escolha',
  verdadeiro_falso: 'Verdadeiro ou falso',
  numerica: 'Numérica',
  dissertativa: 'Dissertativa',
}

export function QuestoesModulo({ moduloId, tituloModulo, aoVoltar, sessao }: Props) {
  const [questoes, setQuestoes] = useState<QuestaoLida[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const lista = await api<QuestaoLida[]>(`/api/v1/modulos/${moduloId}/questoes`)
      setQuestoes(lista)
      setErro(null)
    } catch (erroCarga) {
      setErro(mensagemDeErro(erroCarga))
    }
  }, [moduloId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return (
    <main className="principal principal-largo">
      <div className="cabecalho-pagina">
        <button type="button" className="botao-secundario voltar" onClick={aoVoltar}>
          Voltar ao curso
        </button>
        <p className="trilha">{tituloModulo} › Questões</p>
        <h1>Questões</h1>
      </div>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}

      {!questoes ? (
        <p className="carregando">Carregando questões…</p>
      ) : questoes.length === 0 ? (
        <div className="estado-vazio">
          <p className="estado-vazio-frase">Nenhuma questão publicada neste módulo.</p>
          <p className="estado-vazio-apoio">As questões aparecem aqui quando o professor publicar.</p>
        </div>
      ) : (
        <ul className="lista-questoes">
          {questoes.map((questao) => (
            <li key={questao.id} className="card-questao">
              <div className="questao-info">
                <span className="badge badge-neutro">{ROTULOS_TIPO[questao.tipo]}</span>
              </div>
              <p className="questao-enunciado">{questao.enunciado}</p>
              {sessao.papel === 'estudante' && <QuestaoResposta questao={questao} />}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function QuestaoResposta({ questao }: { questao: QuestaoLida }) {
  const [resposta, setResposta] = useState<string | string[] | number | boolean | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<RespostaEnvio | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function podeEnviar(): boolean {
    if (questao.tipo === 'multipla_escolha') return Array.isArray(resposta) && resposta.length > 0
    if (questao.tipo === 'verdadeiro_falso') return resposta !== null
    if (questao.tipo === 'numerica') return resposta !== null && resposta !== ''
    return typeof resposta === 'string' && resposta.trim().length > 0
  }

  function corpoEnvio(): unknown {
    if (questao.tipo === 'multipla_escolha') return { alternativas: resposta }
    if (questao.tipo === 'verdadeiro_falso') return { valor: resposta as boolean }
    if (questao.tipo === 'numerica') return { valor: Number(resposta) }
    return { texto: resposta }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!podeEnviar() || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      const ret = await api<RespostaEnvio>(`/api/v1/questoes/${questao.id}/tentativas`, {
        metodo: 'POST',
        corpo: corpoEnvio(),
      })
      setResultado(ret)
    } catch (erroEnvio) {
      setErro(mensagemDeErro(erroEnvio))
    } finally {
      setEnviando(false)
    }
  }

  function reiniciar() {
    setResposta(null)
    setResultado(null)
    setErro(null)
  }

  if (resultado) {
    return (
      <div className="questao-feedback" role="status">
        <p className={`feedback-acerto ${resultado.acerto === true ? 'sucesso' : resultado.acerto === false ? 'erro' : 'pendente'}`}>
          {resultado.acerto === true && '✓ Resposta correta'}
          {resultado.acerto === false && '✗ Resposta incorreta'}
          {resultado.acerto === null && 'Resposta enviada'}
        </p>
        <AvisoXp xp={resultado.xp} />
        <AvisoConquistas conquistas={resultado.conquistas} />
        {resultado.feedback.explicacao && (
          <div className="feedback-explicacao">
            <strong>Explicação:</strong> {resultado.feedback.explicacao}
          </div>
        )}
        <button type="button" className="botao-secundario" onClick={reiniciar}>
          Responder de novo
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="questao-formulario">
      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}

      {questao.tipo === 'multipla_escolha' && questao.alternativas && (
        <fieldset className="alternativas">
          <legend className="sr-only">Selecione as alternativas corretas</legend>
          {questao.alternativas.map((alt) => (
            <label key={alt.id} className="alternativa-opcao">
              <input
                type="checkbox"
                checked={Array.isArray(resposta) && resposta.includes(alt.id)}
                onChange={(e) => {
                  const atual = Array.isArray(resposta) ? resposta : []
                  setResposta(
                    e.target.checked
                      ? [...atual, alt.id]
                      : atual.filter((id) => id !== alt.id)
                  )
                }}
              />
              <span>{alt.texto}</span>
            </label>
          ))}
        </fieldset>
      )}

      {questao.tipo === 'verdadeiro_falso' && (
        <fieldset className="alternativas">
          <legend className="sr-only">Selecione verdadeiro ou falso</legend>
          {[true, false].map((valor) => (
            <label key={String(valor)} className="alternativa-opcao">
              <input
                type="radio"
                name={`vf-${questao.id}`}
                checked={resposta === valor}
                onChange={() => setResposta(valor)}
              />
              <span>{valor ? 'Verdadeiro' : 'Falso'}</span>
            </label>
          ))}
        </fieldset>
      )}

      {questao.tipo === 'numerica' && (
        <label className="campo-numerico">
          <span className="sr-only">Resposta numérica</span>
          <input
            type="number"
            step="any"
            value={resposta === null ? '' : String(resposta)}
            onChange={(e) => setResposta(e.target.value === '' ? null : e.target.value)}
            placeholder="Digite um número"
          />
        </label>
      )}

      {questao.tipo === 'dissertativa' && (
        <label className="campo-texto">
          <span className="sr-only">Sua resposta</span>
          <textarea
            value={typeof resposta === 'string' ? resposta : ''}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Escreva sua resposta"
            rows={4}
          />
        </label>
      )}

      <button type="submit" disabled={!podeEnviar() || enviando} aria-busy={enviando}>
        {enviando ? 'Enviando…' : 'Enviar resposta'}
      </button>
    </form>
  )
}
