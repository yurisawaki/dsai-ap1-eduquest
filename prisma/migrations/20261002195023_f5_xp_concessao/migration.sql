-- D7 (SPEC/2026-10-02-xp-niveis.md §5): regra, evento e saldo de XP — T5.2
-- CreateEnum
CREATE TYPE "OrigemXp" AS ENUM ('conclusao_aula', 'acerto_questao', 'entrega_avaliacao', 'nota_avaliacao');

-- CreateTable
CREATE TABLE "config_xp_global" (
    "id" UUID NOT NULL,
    "xp_conclusao_aula" INTEGER NOT NULL DEFAULT 10,
    "xp_acerto_questao" INTEGER NOT NULL DEFAULT 5,
    "xp_entrega_avaliacao" INTEGER NOT NULL DEFAULT 20,
    "xp_por_ponto_nota" INTEGER NOT NULL DEFAULT 3,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_xp_global_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_xp_curso" (
    "curso_id" UUID NOT NULL,
    "xp_conclusao_aula" INTEGER,
    "xp_acerto_questao" INTEGER,
    "xp_entrega_avaliacao" INTEGER,
    "xp_por_ponto_nota" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_xp_curso_pkey" PRIMARY KEY ("curso_id")
);

-- CreateTable
CREATE TABLE "evento_xp" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "origem" "OrigemXp" NOT NULL,
    "referencia_id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "nota_referencia" DECIMAL(4,2),
    "concedido_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_xp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldo_xp" (
    "usuario_id" UUID NOT NULL,
    "xp_total" INTEGER NOT NULL DEFAULT 0,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saldo_xp_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateIndex
CREATE INDEX "evento_xp_usuario_id_concedido_em_idx" ON "evento_xp"("usuario_id", "concedido_em");

-- CreateIndex
CREATE UNIQUE INDEX "evento_xp_usuario_id_chave_key" ON "evento_xp"("usuario_id", "chave");

-- AddForeignKey
ALTER TABLE "config_xp_curso" ADD CONSTRAINT "config_xp_curso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_xp" ADD CONSTRAINT "evento_xp_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldo_xp" ADD CONSTRAINT "saldo_xp_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Faixas da SPEC D7 (R-X10, R-X12, §5.3, §5.4)
ALTER TABLE "config_xp_global" ADD CONSTRAINT "config_xp_global_faixa_check" CHECK (
  "xp_conclusao_aula" BETWEEN 0 AND 1000 AND "xp_acerto_questao" BETWEEN 0 AND 1000 AND
  "xp_entrega_avaliacao" BETWEEN 0 AND 1000 AND "xp_por_ponto_nota" BETWEEN 0 AND 1000
);
ALTER TABLE "config_xp_curso" ADD CONSTRAINT "config_xp_curso_faixa_check" CHECK (
  COALESCE("xp_conclusao_aula", 0) >= 0 AND COALESCE("xp_acerto_questao", 0) >= 0 AND
  COALESCE("xp_entrega_avaliacao", 0) >= 0 AND COALESCE("xp_por_ponto_nota", 0) >= 0
);
ALTER TABLE "evento_xp" ADD CONSTRAINT "evento_xp_xp_check" CHECK ("xp" >= 0);
ALTER TABLE "saldo_xp" ADD CONSTRAINT "saldo_xp_faixa_check" CHECK ("xp_total" >= 0 AND "nivel" >= 1);

-- §5.1: linha única da configuração global com os padrões (U-1–U-3)
INSERT INTO "config_xp_global" ("id", "atualizado_em")
VALUES ('00000000-0000-4000-8000-000000000007', CURRENT_TIMESTAMP);
