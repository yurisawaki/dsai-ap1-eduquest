export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string
  ) {
    super(mensagem)
    this.name = 'ErroApi'
  }
}

interface OpcoesApi {
  metodo?: string
  corpo?: unknown
}

export async function api<T = unknown>(rota: string, opcoes: OpcoesApi = {}): Promise<T> {
  const resposta = await fetch(rota, {
    method: opcoes.metodo ?? 'GET',
    headers: opcoes.corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    credentials: 'same-origin',
  })
  const texto = await resposta.text()
  const dados = texto.length > 0 ? JSON.parse(texto) : null
  if (!resposta.ok) {
    const mensagem =
      (dados as { erro?: { mensagem?: string } } | null)?.erro?.mensagem ?? 'Erro inesperado'
    throw new ErroApi(resposta.status, mensagem)
  }
  return dados as T
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message
  return 'Erro inesperado'
}
