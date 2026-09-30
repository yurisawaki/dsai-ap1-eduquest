-- DP-19 (SPEC/2026-09-30-conteudo-aula.md §7.1): posicao em conteudo_aula
ALTER TABLE "conteudo_aula" ADD COLUMN "posicao" INTEGER;

-- Backfill determinístico (correção M-6): ordem anterior de leitura, desempate por id
UPDATE "conteudo_aula" AS c
SET "posicao" = o."posicao"
FROM (
    SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "aula_id" ORDER BY "criado_em", "id") - 1)::INTEGER AS "posicao"
    FROM "conteudo_aula"
) AS o
WHERE c."id" = o."id";

ALTER TABLE "conteudo_aula" ALTER COLUMN "posicao" SET NOT NULL;

-- DropIndex
DROP INDEX "conteudo_aula_aula_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "conteudo_aula_aula_id_posicao_key" ON "conteudo_aula"("aula_id", "posicao");

-- CreateTable (SPEC/2026-09-30-conteudo-aula.md §7.2; binário em BYTEA — correção A-1)
CREATE TABLE "arquivo" (
    "id" UUID NOT NULL,
    "aula_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "mime" VARCHAR(100) NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "arquivo_aula_id_idx" ON "arquivo"("aula_id");

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
