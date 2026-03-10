-- DropForeignKey
ALTER TABLE "BoardInvite" DROP CONSTRAINT "BoardInvite_boardId_fkey";

-- DropForeignKey
ALTER TABLE "BoardInvite" DROP CONSTRAINT "BoardInvite_invitedBy_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_boardId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_userId_fkey";

-- AlterTable
ALTER TABLE "Recipe" ALTER COLUMN "tags" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Recipe_boardId_idx" ON "Recipe"("boardId");

-- CreateIndex
CREATE INDEX "Recipe_createdBy_idx" ON "Recipe"("createdBy");

-- CreateIndex
CREATE INDEX "Recipe_boardId_createdAt_idx" ON "Recipe"("boardId", "createdAt");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardInvite" ADD CONSTRAINT "BoardInvite_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardInvite" ADD CONSTRAINT "BoardInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
