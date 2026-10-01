interface Props {
  url: string
}

export function ConteudoMidia({ url }: Props) {
  return (
    <figure className="conteudo-midia">
      <div className="midia-moldura">
        <iframe
          src={url}
          title="Mídia da aula"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          allowFullScreen
        />
      </div>
      <figcaption className="midia-alternativa">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Abrir em nova aba
        </a>
      </figcaption>
    </figure>
  )
}
