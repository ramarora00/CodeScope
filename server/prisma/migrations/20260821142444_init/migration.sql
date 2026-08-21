-- CreateTable
CREATE TABLE "Repo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "localPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "indexingProgress" INTEGER NOT NULL DEFAULT 0,
    "totalChunks" INTEGER NOT NULL DEFAULT 0,
    "processedChunks" INTEGER NOT NULL DEFAULT 0,
    "indexingError" TEXT,
    "understandingHash" TEXT,
    "repositorySummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT,
    "contentHash" TEXT,
    "language" TEXT,
    "metadata" TEXT,
    "repoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symbol" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qualifiedName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "lineStart" INTEGER,
    "lineEnd" INTEGER,
    "fileId" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymbolRelationship" (
    "id" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "calleeId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "executionOrder" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "resolutionMethod" TEXT NOT NULL DEFAULT 'unknown',

    CONSTRAINT "SymbolRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_repoId_path_key" ON "File"("repoId", "path");

-- CreateIndex
CREATE INDEX "Symbol_repoId_qualifiedName_idx" ON "Symbol"("repoId", "qualifiedName");

-- CreateIndex
CREATE INDEX "Symbol_repoId_name_idx" ON "Symbol"("repoId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SymbolRelationship_callerId_calleeId_relationship_key" ON "SymbolRelationship"("callerId", "calleeId", "relationship");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symbol" ADD CONSTRAINT "Symbol_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymbolRelationship" ADD CONSTRAINT "SymbolRelationship_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymbolRelationship" ADD CONSTRAINT "SymbolRelationship_calleeId_fkey" FOREIGN KEY ("calleeId") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
