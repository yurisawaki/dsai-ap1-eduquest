-- DP-08 (SPEC/2026-10-01-questoes-exercicios.md §5)
-- CreateEnum
CREATE TYPE "TipoQuestao" AS ENUM ('multipla_escolha', 'verdadeiro_falso', 'numerica', 'dissertativa');

-- CreateTable
CREATE TABLE "questao" (
    "id" UUID NOT NULL,
    "modulo_id" UUID NOT NULL,
    "tipo" "TipoQuestao" NOT NULL,
    "enunciado" TEXT NOT NULL,
    "explicacao" TEXT,
    "gabarito" JSONB,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alternativa" (
    "id" UUID NOT NULL,
    "questao_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,
    "posicao" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentativa" (
    "id" UUID NOT NULL,
    "questao_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "resposta" JSONB NOT NULL,
    "acerto" BOOLEAN,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tentativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questao_modulo_id_idx" ON "questao"("modulo_id");

-- CreateIndex
CREATE UNIQUE INDEX "alternativa_questao_id_posicao_key" ON "alternativa"("questao_id", "posicao");

-- CreateIndex
CREATE INDEX "tentativa_questao_id_idx" ON "tentativa"("questao_id");

-- CreateIndex
CREATE INDEX "tentativa_usuario_id_idx" ON "tentativa"("usuario_id");

-- AddForeignKey
ALTER TABLE "questao" ADD CONSTRAINT "questao_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternativa" ADD CONSTRAINT "alternativa_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativa" ADD CONSTRAINT "tentativa_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativa" ADD CONSTRAINT "tentativa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
