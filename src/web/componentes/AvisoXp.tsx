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

// SPEC/2026-10-02-conquistas.md §6.3/§6.4 (D8-i): uma linha por conquista recém-desbloqueada
export interface ConquistaDesbloqueada {
  codigo: string
  nome: string
}

export function AvisoConquistas({ conquistas }: { conquistas?: ConquistaDesbloqueada[] | null }) {
  if (!conquistas || conquistas.length === 0) return null
  return (
    <ul className="aviso-conquistas" role="status">
      {conquistas.map((conquista) => (
        <li key={conquista.codigo}>
          Conquista desbloqueada: <strong>{conquista.nome}</strong>
        </li>
      ))}
    </ul>
  )
}
