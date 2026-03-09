-- CreateEnum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecipeStatus') THEN
    CREATE TYPE "RecipeStatus" AS ENUM ('WANT_TO_TRY', 'COOKED');
  END IF;
END $$;

-- CreateEnum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InviteStatus') THEN
    CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED');
  END IF;
END $$;

-- AlterTable (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;

-- Backfill existing users
UPDATE "User"
SET "displayName" = split_part("email", '@', 1)
WHERE "displayName" IS NULL;

-- Enforce non-null displayName if nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'User'
      AND column_name = 'displayName'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "User" ALTER COLUMN "displayName" SET NOT NULL;
  END IF;
END $$;

-- AlterTable (idempotent)
ALTER TABLE "Recipe"
ADD COLUMN IF NOT EXISTS "status" "RecipeStatus" NOT NULL DEFAULT 'WANT_TO_TRY',
ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "BoardInvite" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "BoardInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "Member_boardId_userId_key" ON "Member"("boardId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "BoardInvite_token_key" ON "BoardInvite"("token");
CREATE INDEX IF NOT EXISTS "BoardInvite_boardId_status_idx" ON "BoardInvite"("boardId", "status");

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Member_boardId_fkey') THEN
    ALTER TABLE "Member"
      ADD CONSTRAINT "Member_boardId_fkey"
      FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Member_userId_fkey') THEN
    ALTER TABLE "Member"
      ADD CONSTRAINT "Member_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BoardInvite_boardId_fkey') THEN
    ALTER TABLE "BoardInvite"
      ADD CONSTRAINT "BoardInvite_boardId_fkey"
      FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BoardInvite_invitedBy_fkey') THEN
    ALTER TABLE "BoardInvite"
      ADD CONSTRAINT "BoardInvite_invitedBy_fkey"
      FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill board owners as members
INSERT INTO "Member" ("id", "boardId", "userId", "displayName", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text), b."id", b."ownerId", u."displayName", CURRENT_TIMESTAMP
FROM "Board" b
JOIN "User" u ON u."id" = b."ownerId"
ON CONFLICT ("boardId", "userId") DO NOTHING;
