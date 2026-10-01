-- D6 (SPEC/2026-10-01-progresso-aprendizagem.md): unicidade de conclusao por (aula, usuario) — R-D6-2
DELETE FROM "conclusao_aula" a
USING "conclusao_aula" b
WHERE a."aula_id" = b."aula_id"
  AND a."usuario_id" = b."usuario_id"
  AND (a."criado_em", a."id") > (b."criado_em", b."id");

-- DropIndex
DROP INDEX "conclusao_aula_aula_id_usuario_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "conclusao_aula_aula_id_usuario_id_key" ON "conclusao_aula"("aula_id", "usuario_id");
