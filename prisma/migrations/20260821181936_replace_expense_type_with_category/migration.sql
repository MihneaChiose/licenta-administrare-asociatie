CREATE TYPE "ExpenseCategory" AS ENUM (
    'COLD_WATER',
    'HOT_WATER',
    'GAS',
    'ELECTRICITY',
    'HEATING',
    'CLEANING',
    'ELEVATOR',
    'GARBAGE',
    'ROLLING_FUND',
    'REPAIR_FUND',
    'ADMINISTRATION',
    'OTHER'
);

ALTER TABLE "Expense"
ADD COLUMN "category" "ExpenseCategory";

UPDATE "Expense"
SET "category" =
    CASE
        WHEN LOWER(TRIM("type")) IN ('apa rece', 'apă rece')
            THEN 'COLD_WATER'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) IN ('apa calda', 'apă caldă')
            THEN 'HOT_WATER'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) IN ('gaze', 'gaz')
            THEN 'GAS'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) = 'electricitate'
            THEN 'ELECTRICITY'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) IN ('caldura', 'căldură')
            THEN 'HEATING'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) IN ('curatenie', 'curățenie')
            THEN 'CLEANING'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) = 'lift'
            THEN 'ELEVATOR'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) IN ('salubritate', 'gunoi')
            THEN 'GARBAGE'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) = 'fond rulment'
            THEN 'ROLLING_FUND'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) IN ('fond reparatii', 'fond reparații')
            THEN 'REPAIR_FUND'::"ExpenseCategory"

        WHEN LOWER(TRIM("type")) = 'administrare'
            THEN 'ADMINISTRATION'::"ExpenseCategory"

        ELSE 'OTHER'::"ExpenseCategory"
    END;

ALTER TABLE "Expense"
ALTER COLUMN "category" SET NOT NULL;

ALTER TABLE "Expense"
DROP COLUMN "type";