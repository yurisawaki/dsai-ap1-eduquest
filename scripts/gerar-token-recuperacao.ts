import { solicitarRecuperacao } from '../src/server/servicos/recuperacao'

const email = process.argv[2]
if (!email) {
  console.error('uso: npx tsx scripts/gerar-token-recuperacao.ts <email>')
  process.exit(1)
}

solicitarRecuperacao(email)
  .then((token) => {
    console.log(token ?? 'CONTA_INEXISTENTE')
    process.exit(0)
  })
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
