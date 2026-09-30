import type { Papel } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      usuario?: { id: string; papel: Papel }
      sessao?: { id: string; usuario_id: string; expira_em: Date }
    }
  }
}

export const uuidValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export {}
