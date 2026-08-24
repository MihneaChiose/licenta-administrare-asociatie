import {
  ExpenseCategory,
  ExpenseDistributionMethod,
  UtilityType,
} from "@/generated/prisma/client";

export const EXPENSE_DISTRIBUTION_METHOD_LABELS: Record<
  ExpenseDistributionMethod,
  string
> = {
  [ExpenseDistributionMethod.PER_APARTMENT]: "Per apartament",

  [ExpenseDistributionMethod.PER_PERSON]: "Per persoană",

  [ExpenseDistributionMethod.BY_CONSUMPTION]: "După consum",

  [ExpenseDistributionMethod.BY_SURFACE]: "După suprafață",

  [ExpenseDistributionMethod.CUSTOM]:
    "Personalizat (repartizare egală momentan)",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.COLD_WATER]: "Apă rece",
  [ExpenseCategory.HOT_WATER]: "Apă caldă",
  [ExpenseCategory.GAS]: "Gaze",
  [ExpenseCategory.ELECTRICITY]: "Electricitate",
  [ExpenseCategory.HEATING]: "Căldură",
  [ExpenseCategory.CLEANING]: "Curățenie",
  [ExpenseCategory.ELEVATOR]: "Lift",
  [ExpenseCategory.GARBAGE]: "Salubritate",
  [ExpenseCategory.ROLLING_FUND]: "Fond rulment",
  [ExpenseCategory.REPAIR_FUND]: "Fond reparații",
  [ExpenseCategory.ADMINISTRATION]: "Administrare",
  [ExpenseCategory.OTHER]: "Altele",
};

export const EXPENSE_CATEGORY_OPTIONS = Object.entries(
  EXPENSE_CATEGORY_LABELS,
).map(([value, label]) => ({
  value: value as ExpenseCategory,
  label,
}));

const EXPENSE_CATEGORY_UTILITY_TYPES: Partial<
  Record<ExpenseCategory, UtilityType>
> = {
  [ExpenseCategory.COLD_WATER]: UtilityType.COLD_WATER,
  [ExpenseCategory.HOT_WATER]: UtilityType.HOT_WATER,
  [ExpenseCategory.GAS]: UtilityType.GAS,
  [ExpenseCategory.ELECTRICITY]: UtilityType.ELECTRICITY,
  [ExpenseCategory.HEATING]: UtilityType.HEATING,
};

export function getUtilityTypeForExpenseCategory(
  category: ExpenseCategory,
): UtilityType | null {
  return EXPENSE_CATEGORY_UTILITY_TYPES[category] ?? null;
}
