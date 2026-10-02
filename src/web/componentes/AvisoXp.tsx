// SPEC/2026-10-02-xp-niveis.md §6.3/§6.4 (D7-i): aviso a partir do campo `xp` devolvido pelo servidor
export interface XpDaAcao {
  ganho: number
  total: number
  nivel: number
  subiuNivel: boolean
}

export function AvisoXp({ xp }: { xp?: XpDaAcao | null }) {
  if (!xp || (xp.ganho <= 0 && !xp.subiuNivel)) return null
  return (
    <p className="aviso-xp" role="status">
      {xp.ganho > 0 && <span className="aviso-xp-ganho">+{xp.ganho} XP</span>}
      {xp.subiuNivel && <span className="aviso-xp-nivel">Subiu para o nível {xp.nivel}!</span>}
    </p>
  )
}
