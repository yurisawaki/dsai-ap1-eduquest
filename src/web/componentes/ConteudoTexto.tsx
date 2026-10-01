interface Props {
  texto: string
}

export function ConteudoTexto({ texto }: Props) {
  const paragrafos = texto.split(/\n\s*\n/)

  return (
    <div className="conteudo-texto">
      {paragrafos.map((paragrafo, indice) => (
        <p key={indice}>{paragrafo}</p>
      ))}
    </div>
  )
}
