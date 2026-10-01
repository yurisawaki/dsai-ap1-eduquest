/*
  Warnings:

  - A unique constraint covering the columns `[aula_id,posicao]` on the table `conteudo_aula` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `posicao` to the `conteudo_aula` table. Existing rows are
    backfilled first (ordered by `criado_em` per `aula_id`, ties broken by `id`) so the
    NOT NULL + unique `(aula_id, posicao)` constraints hold — backfill authorized by
    SPEC/2026-09-30-conteudo-aula.md §10.3 ("backfill de posicao = criado_em ordenado").

*/
-- DropIndex
DROP INDEX "conteudo_aula_aula_id_idx";

-- AlterTable
ALTER TABLE "conteudo_aula" ADD COLUMN     "posicao" INTEGER;

UPDATE "conteudo_aula" AS destino
SET "posicao" = origem.ordem - 1
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "aula_id"
            ORDER BY "criado_em", "id"
        ) AS ordem
    FROM "conteudo_aula"
) AS origem
WHERE destino."id" = origem."id";

ALTER TABLE "conteudo_aula" ALTER COLUMN "posicao" SET NOT NULL;

-- CreateTable
CREATE TABLE "arquivo" (
    "id" UUID NOT NULL,
    "aula_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "mime" VARCHAR(100) NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "arquivo_aula_id_idx" ON "arquivo"("aula_id");

-- CreateIndex
CREATE UNIQUE INDEX "conteudo_aula_aula_id_posicao_key" ON "conteudo_aula"("aula_id", "posicao");

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
