-- CreateEnum
CREATE TYPE "TipoConteudo" AS ENUM ('texto', 'midia_embedada', 'material_anexo');

-- CreateTable
CREATE TABLE "curso" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "dono_id" UUID NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulo" (
    "id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aula" (
    "id" UUID NOT NULL,
    "modulo_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudo_aula" (
    "id" UUID NOT NULL,
    "aula_id" UUID NOT NULL,
    "tipo" "TipoConteudo" NOT NULL,
    "dados" JSONB NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteudo_aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conclusao_aula" (
    "id" UUID NOT NULL,
    "aula_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "concluida_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conclusao_aula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curso_dono_id_idx" ON "curso"("dono_id");

-- CreateIndex
CREATE INDEX "modulo_curso_id_idx" ON "modulo"("curso_id");

-- CreateIndex
CREATE INDEX "aula_modulo_id_idx" ON "aula"("modulo_id");

-- CreateIndex
CREATE INDEX "conteudo_aula_aula_id_idx" ON "conteudo_aula"("aula_id");

-- CreateIndex
CREATE INDEX "conclusao_aula_aula_id_idx" ON "conclusao_aula"("aula_id");

-- CreateIndex
CREATE INDEX "conclusao_aula_usuario_id_idx" ON "conclusao_aula"("usuario_id");

-- CreateIndex
CREATE INDEX "conclusao_aula_aula_id_usuario_id_idx" ON "conclusao_aula"("aula_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_dono_id_fkey" FOREIGN KEY ("dono_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulo" ADD CONSTRAINT "modulo_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudo_aula" ADD CONSTRAINT "conteudo_aula_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conclusao_aula" ADD CONSTRAINT "conclusao_aula_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conclusao_aula" ADD CONSTRAINT "conclusao_aula_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
