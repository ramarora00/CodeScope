/*
  Warnings:

  - Added the required column `updatedAt` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Symbol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "qualifiedName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "lineStart" INTEGER,
    "lineEnd" INTEGER,
    "fileId" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Symbol_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SymbolRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callerId" TEXT NOT NULL,
    "calleeId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "executionOrder" INTEGER,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "resolutionMethod" TEXT NOT NULL DEFAULT 'unknown',
    CONSTRAINT "SymbolRelationship_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SymbolRelationship_calleeId_fkey" FOREIGN KEY ("calleeId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "content" TEXT,
    "contentHash" TEXT,
    "language" TEXT,
    "metadata" TEXT,
    "repoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "File_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_File" ("content", "createdAt", "id", "language", "metadata", "path", "repoId") SELECT "content", "createdAt", "id", "language", "metadata", "path", "repoId" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_repoId_path_key" ON "File"("repoId", "path");
CREATE TABLE "new_Repo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "localPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Repo" ("createdAt", "id", "localPath", "name", "updatedAt", "url") SELECT "createdAt", "id", "localPath", "name", "updatedAt", "url" FROM "Repo";
DROP TABLE "Repo";
ALTER TABLE "new_Repo" RENAME TO "Repo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Symbol_repoId_qualifiedName_idx" ON "Symbol"("repoId", "qualifiedName");

-- CreateIndex
CREATE INDEX "Symbol_repoId_name_idx" ON "Symbol"("repoId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SymbolRelationship_callerId_calleeId_relationship_key" ON "SymbolRelationship"("callerId", "calleeId", "relationship");
