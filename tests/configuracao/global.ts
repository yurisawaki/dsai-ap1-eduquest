import { execSync } from 'node:child_process'
import { urlBancoTeste } from './variaveis'

export default function configGlobal() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: urlBancoTeste },
  })
}
