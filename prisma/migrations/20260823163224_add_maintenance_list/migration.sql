CREATE TYPE "MaintenanceListStatus" AS ENUM (
    'DRAFT',
    'CALCULATED',
    'PUBLISHED',
    'CLOSED'
);

CREATE TABLE "MaintenanceList" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "MaintenanceListStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "MaintenanceList_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Invoice"
ADD COLUMN "maintenanceListId" TEXT;

CREATE UNIQUE INDEX
"MaintenanceList_associationId_month_year_key"
ON "MaintenanceList"("associationId", "month", "year");

CREATE INDEX
"Invoice_maintenanceListId_idx"
ON "Invoice"("maintenanceListId");

ALTER TABLE "MaintenanceList"
ADD CONSTRAINT "MaintenanceList_associationId_fkey"
FOREIGN KEY ("associationId")
REFERENCES "Association"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

/*
 * Facturile existente erau deja vizibile locatarilor,
 * deci le migrăm în liste PUBLISHED.
 */
INSERT INTO "MaintenanceList" (
    "id",
    "associationId",
    "month",
    "year",
    "status",
    "createdAt",
    "updatedAt",
    "calculatedAt",
    "publishedAt"
)
SELECT
    CONCAT(
        'legacy_',
        md5(
            a."associationId"
            || ':'
            || i."year"::text
            || ':'
            || i."month"::text
        )
    ),
    a."associationId",
    i."month",
    i."year",
    'PUBLISHED'::"MaintenanceListStatus",
    MIN(i."generatedAt"),
    CURRENT_TIMESTAMP,
    MIN(i."generatedAt"),
    MIN(i."generatedAt")
FROM "Invoice" i
JOIN "Apartment" a
    ON a."id" = i."apartmentId"
GROUP BY
    a."associationId",
    i."month",
    i."year";

/*
 * Legăm facturile istorice de listele create mai sus.
 */
UPDATE "Invoice" AS i
SET "maintenanceListId" = ml."id"
FROM "Apartment" AS a
JOIN "MaintenanceList" AS ml
    ON ml."associationId" = a."associationId"
WHERE
    i."apartmentId" = a."id"
    AND ml."month" = i."month"
    AND ml."year" = i."year";

ALTER TABLE "Invoice"
ALTER COLUMN "maintenanceListId" SET NOT NULL;

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_maintenanceListId_fkey"
FOREIGN KEY ("maintenanceListId")
REFERENCES "MaintenanceList"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;