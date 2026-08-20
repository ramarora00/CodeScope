/*
  Warnings:

  - Added the required column `userId` to the `Repo` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Repo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "localPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "understandingHash" TEXT,
    "repositorySummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Repo" ("createdAt", "id", "localPath", "name", "status", "updatedAt", "url") SELECT "createdAt", "id", "localPath", "name", "status", "updatedAt", "url" FROM "Repo";
DROP TABLE "Repo";
ALTER TABLE "new_Repo" RENAME TO "Repo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
