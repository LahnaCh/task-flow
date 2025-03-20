-- CreateTable
CREATE TABLE "todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "est_faite" BOOLEAN NOT NULL DEFAULT false
);
