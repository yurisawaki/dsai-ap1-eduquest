import { defineConfig } from 'vitest/config'
import { urlBancoTeste } from './tests/configuracao/variaveis'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    globalSetup: ['tests/configuracao/global.ts'],
    env: {
      DATABASE_URL: urlBancoTeste,
      SESSION_EXPIRATION_MINUTES: '60',
      RESET_TOKEN_EXPIRATION_MINUTES: '60',
      BCRYPT_COST: '4',
      NODE_ENV: 'test',
    },
  },
})
