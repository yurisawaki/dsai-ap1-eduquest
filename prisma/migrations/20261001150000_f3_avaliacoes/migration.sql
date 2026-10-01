-- DP-09 (SPEC/2026-10-01-avaliacoes.md §5)
-- CreateEnum
CREATE TYPE "StatusTentativaAvaliacao" AS ENUM ('aguardando_correcao', 'corrigida');

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "tentativas_max" INTEGER NOT NULL,
    "abre_em" TIMESTAMP(3) NOT NULL,
    "fecha_em" TIMESTAMP(3) NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao_questao" (
    "avaliacao_id" UUID NOT NULL,
    "questao_id" UUID NOT NULL,
    "peso" DECIMAL(7,2) NOT NULL,
    "posicao" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacao_questao_pkey" PRIMARY KEY ("avaliacao_id","questao_id")
);

-- CreateTable
CREATE TABLE "tentativa_avaliacao" (
    "id" UUID NOT NULL,
    "avaliacao_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "status" "StatusTentativaAvaliacao" NOT NULL,
    "nota" DECIMAL(4,2),
    "enviada_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tentativa_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resposta_avaliacao" (
    "id" UUID NOT NULL,
    "tentativa_id" UUID NOT NULL,
    "questao_id" UUID NOT NULL,
    "resposta" JSONB NOT NULL,
    "acerto" BOOLEAN,
    "pontos" DECIMAL(7,2),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resposta_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avaliacao_curso_id_idx" ON "avaliacao"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_questao_avaliacao_id_posicao_key" ON "avaliacao_questao"("avaliacao_id", "posicao");

-- CreateIndex
CREATE INDEX "avaliacao_questao_questao_id_idx" ON "avaliacao_questao"("questao_id");

-- CreateIndex
CREATE INDEX "tentativa_avaliacao_avaliacao_id_idx" ON "tentativa_avaliacao"("avaliacao_id");

-- CreateIndex
CREATE INDEX "tentativa_avaliacao_usuario_id_idx" ON "tentativa_avaliacao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "resposta_avaliacao_tentativa_id_questao_id_key" ON "resposta_avaliacao"("tentativa_id", "questao_id");

-- CreateIndex
CREATE INDEX "resposta_avaliacao_questao_id_idx" ON "resposta_avaliacao"("questao_id");

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_questao" ADD CONSTRAINT "avaliacao_questao_avaliacao_id_fkey" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_questao" ADD CONSTRAINT "avaliacao_questao_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativa_avaliacao" ADD CONSTRAINT "tentativa_avaliacao_avaliacao_id_fkey" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativa_avaliacao" ADD CONSTRAINT "tentativa_avaliacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta_avaliacao" ADD CONSTRAINT "resposta_avaliacao_tentativa_id_fkey" FOREIGN KEY ("tentativa_id") REFERENCES "tentativa_avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta_avaliacao" ADD CONSTRAINT "resposta_avaliacao_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
