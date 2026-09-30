-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('estudante', 'professor', 'administrador');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "papel" "Papel" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credencial" (
    "usuario_id" UUID NOT NULL,
    "hash_senha" TEXT NOT NULL,
    "atualizada_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credencial_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "sessao" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "revogada_em" TIMESTAMP(3),

    CONSTRAINT "sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_estudante" (
    "usuario_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfil_estudante_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "perfil_professor" (
    "usuario_id" UUID NOT NULL,
    "bio" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfil_professor_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "preferencias" (
    "usuario_id" UUID NOT NULL,
    "chave" VARCHAR(100) NOT NULL,
    "valor" JSONB NOT NULL,

    CONSTRAINT "preferencias_pkey" PRIMARY KEY ("usuario_id","chave")
);

-- CreateTable
CREATE TABLE "visibilidade" (
    "usuario_id" UUID NOT NULL,
    "chave" VARCHAR(100) NOT NULL,
    "visivel" BOOLEAN NOT NULL,

    CONSTRAINT "visibilidade_pkey" PRIMARY KEY ("usuario_id","chave")
);

-- CreateTable
CREATE TABLE "token_recuperacao" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "hash_token" VARCHAR(64) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_recuperacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "sessao_usuario_id_idx" ON "sessao"("usuario_id");

-- CreateIndex
CREATE INDEX "sessao_expira_em_idx" ON "sessao"("expira_em");

-- CreateIndex
CREATE UNIQUE INDEX "token_recuperacao_hash_token_key" ON "token_recuperacao"("hash_token");

-- CreateIndex
CREATE INDEX "token_recuperacao_usuario_id_idx" ON "token_recuperacao"("usuario_id");

-- AddForeignKey
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_estudante" ADD CONSTRAINT "perfil_estudante_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_professor" ADD CONSTRAINT "perfil_professor_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferencias" ADD CONSTRAINT "preferencias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visibilidade" ADD CONSTRAINT "visibilidade_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_recuperacao" ADD CONSTRAINT "token_recuperacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
