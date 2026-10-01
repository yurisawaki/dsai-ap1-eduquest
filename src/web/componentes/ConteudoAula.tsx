import { ConteudoMidia } from './ConteudoMidia'
import { ConteudoTexto } from './ConteudoTexto'

export interface BlocoConteudo {
  id?: string
  tipo: string
  dados: unknown
}

interface Props {
  conteudo: BlocoConteudo[]
}

function ConteudoIndisponivel({ tipo }: { tipo: string }) {
  return (
    <p className="conteudo-indisponivel">
      Conteúdo do tipo <strong>{tipo}</strong> ainda não é exibido nesta versão.
    </p>
  )
}

function Bloco({ bloco }: { bloco: BlocoConteudo }) {
  const dados =
    bloco.dados !== null && typeof bloco.dados === 'object'
      ? (bloco.dados as Record<string, unknown>)
      : null

  if (bloco.tipo === 'texto') {
    return dados && typeof dados.texto === 'string' ? (
      <ConteudoTexto texto={dados.texto} />
    ) : (
      <ConteudoIndisponivel tipo={bloco.tipo} />
    )
  }

  if (bloco.tipo === 'midia_embedada') {
    return dados && typeof dados.url === 'string' && dados.url.length > 0 ? (
      <ConteudoMidia url={dados.url} />
    ) : (
      <ConteudoIndisponivel tipo={bloco.tipo} />
    )
  }

  return <ConteudoIndisponivel tipo={bloco.tipo} />
}

export function ConteudoAula({ conteudo }: Props) {
  return (
    <div className="conteudo-aula">
      {conteudo.map((bloco, indice) => (
        <Bloco key={bloco.id ?? indice} bloco={bloco} />
      ))}
    </div>
  )
}
