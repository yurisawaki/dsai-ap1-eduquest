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

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ConteudoAnexo({ dados }: { dados: Record<string, unknown> }) {
  const { arquivoId, nome, tamanho } = dados
  if (typeof arquivoId !== 'string' || typeof nome !== 'string') {
    return <ConteudoIndisponivel tipo="material_anexo" />
  }
  const espacoTamanho = typeof tamanho === 'number' ? tamanhoLegivel(tamanho) : null
  return (
    <p className="conteudo-anexo">
      <span className="anexo-icone" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 3v5h5" />
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M12 11v6" />
          <path d="M9.5 14.5 12 17l2.5-2.5" />
        </svg>
      </span>
      <a href={`/api/v1/arquivos/${arquivoId}`}>Baixar {nome}</a>
      {espacoTamanho && <span className="anexo-tamanho">({espacoTamanho})</span>}
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

  if (bloco.tipo === 'material_anexo') {
    return <ConteudoAnexo dados={dados ?? {}} />
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
