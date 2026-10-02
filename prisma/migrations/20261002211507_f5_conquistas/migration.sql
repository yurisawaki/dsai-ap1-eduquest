-- D8 (SPEC/2026-10-02-conquistas.md §5): catálogo e desbloqueios de conquistas — T5.6
-- CreateEnum
CREATE TYPE "TipoCriterio" AS ENUM ('aulas_concluidas', 'cursos_concluidos', 'questoes_acertadas', 'avaliacoes_entregues', 'nota_avaliacao', 'nivel');

-- CreateTable
CREATE TABLE "conquista" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo_criterio" "TipoCriterio" NOT NULL,
    "meta" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conquista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desbloqueio_conquista" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "conquista_id" UUID NOT NULL,
    "desbloqueada_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desbloqueio_conquista_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conquista_codigo_key" ON "conquista"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "conquista_ordem_key" ON "conquista"("ordem");

-- CreateIndex
CREATE INDEX "desbloqueio_conquista_conquista_id_idx" ON "desbloqueio_conquista"("conquista_id");

-- CreateIndex
CREATE UNIQUE INDEX "desbloqueio_conquista_usuario_id_conquista_id_key" ON "desbloqueio_conquista"("usuario_id", "conquista_id");

-- AddForeignKey
ALTER TABLE "desbloqueio_conquista" ADD CONSTRAINT "desbloqueio_conquista_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desbloqueio_conquista" ADD CONSTRAINT "desbloqueio_conquista_conquista_id_fkey" FOREIGN KEY ("conquista_id") REFERENCES "conquista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- §5.1: meta ≥ 1
ALTER TABLE "conquista" ADD CONSTRAINT "conquista_meta_check" CHECK ("meta" >= 1);

-- §4.1 (U-1/U-2): catálogo inicial fixo
INSERT INTO "conquista" ("id", "codigo", "nome", "descricao", "tipo_criterio", "meta", "ordem", "atualizado_em") VALUES
  ('00000000-0000-4000-8000-000000000801', 'primeiros_passos', 'Primeiros passos', 'Concluiu a primeira aula', 'aulas_concluidas', 1, 1, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000802', 'maratonista', 'Maratonista', 'Concluiu 25 aulas', 'aulas_concluidas', 25, 2, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000803', 'curso_concluido', 'Curso concluído', 'Concluiu 100% de um curso', 'cursos_concluidos', 1, 3, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000804', 'colecionador_de_cursos', 'Colecionador de cursos', 'Concluiu 100% de 3 cursos', 'cursos_concluidos', 3, 4, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000805', 'primeiro_acerto', 'Primeiro acerto', 'Acertou a primeira questão de exercício', 'questoes_acertadas', 1, 5, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000806', 'mente_afiada', 'Mente afiada', 'Acertou 50 questões de exercício diferentes', 'questoes_acertadas', 50, 6, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000807', 'avaliado', 'Avaliado', 'Entregou a primeira avaliação', 'avaliacoes_entregues', 1, 7, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000808', 'nota_maxima', 'Nota máxima', 'Tirou 10 em uma avaliação', 'nota_avaliacao', 10, 8, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000809', 'subindo_de_nivel', 'Subindo de nível', 'Alcançou o nível 5', 'nivel', 5, 9, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000810', 'veterano', 'Veterano', 'Alcançou o nível 10', 'nivel', 10, 10, CURRENT_TIMESTAMP);
