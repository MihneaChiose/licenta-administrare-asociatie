import { ExpenseDistributionMethod } from "@/generated/prisma/client";
import {
  EXPENSE_CATEGORY_LABELS,
  getUtilityTypeForExpenseCategory,
} from "@/lib/expenses";
import { getPreviousPeriod } from "@/lib/meters";
import { calculateMonthlyConsumption } from "@/services/consumptions/monthly-consumption";
import { MaintenanceApartment, MaintenanceCalculationInput } from "./types";

export type MaintenanceValidationIssueCode =
  | "INVALID_EXPENSE_AMOUNT"
  | "INVALID_RESIDENT_COUNT"
  | "ZERO_TOTAL_RESIDENTS"
  | "INVALID_SURFACE"
  | "UNSUPPORTED_CONSUMPTION_CATEGORY"
  | "MISSING_METER"
  | "MISSING_CURRENT_READING"
  | "MISSING_PREVIOUS_READING"
  | "NEGATIVE_CONSUMPTION"
  | "ZERO_TOTAL_CONSUMPTION";

export type MaintenanceValidationIssue = {
  code: MaintenanceValidationIssueCode;
  message: string;
};

function getApartmentNumbers(apartments: MaintenanceApartment[]): string {
  return apartments
    .map((apartment) => apartment.number)
    .sort((a, b) =>
      a.localeCompare(b, "ro", {
        numeric: true,
      }),
    )
    .join(", ");
}

export function validateMaintenanceGeneration({
  apartments,
  expenses,
  month,
  year,
}: MaintenanceCalculationInput): MaintenanceValidationIssue[] {
  const issues: MaintenanceValidationIssue[] = [];

  /*
   * Validare generală a sumelor cheltuielilor.
   */
  for (const expense of expenses) {
    const amount = Number(expense.totalAmount.toString());

    if (!Number.isFinite(amount) || amount <= 0) {
      const expenseLabel = EXPENSE_CATEGORY_LABELS[expense.category];

      issues.push({
        code: "INVALID_EXPENSE_AMOUNT",
        message: `Cheltuiala "${expenseLabel} - ${expense.description}" trebuie să aibă o sumă mai mare decât 0.`,
      });
    }
  }

  /*
   * Validări pentru cheltuielile repartizate PER_PERSON.
   */
  const hasPerPersonExpenses = expenses.some(
    (expense) =>
      expense.distributionMethod === ExpenseDistributionMethod.PER_PERSON,
  );

  if (hasPerPersonExpenses) {
    const apartmentsWithInvalidResidents = apartments.filter(
      (apartment) => apartment.numberOfResidents < 0,
    );

    if (apartmentsWithInvalidResidents.length > 0) {
      issues.push({
        code: "INVALID_RESIDENT_COUNT",
        message: `Numărul de persoane nu poate fi negativ pentru apartamentele: ${getApartmentNumbers(
          apartmentsWithInvalidResidents,
        )}.`,
      });
    }

    const totalResidents = apartments.reduce(
      (sum, apartment) => sum + apartment.numberOfResidents,
      0,
    );

    if (totalResidents <= 0) {
      issues.push({
        code: "ZERO_TOTAL_RESIDENTS",
        message:
          "Există cheltuieli repartizate per persoană, dar numărul total de persoane din asociație este 0.",
      });
    }
  }

  /*
   * Validări pentru BY_SURFACE.
   */
  const hasSurfaceExpenses = expenses.some(
    (expense) =>
      expense.distributionMethod === ExpenseDistributionMethod.BY_SURFACE,
  );

  if (hasSurfaceExpenses) {
    const apartmentsWithInvalidSurface = apartments.filter(
      (apartment) =>
        !Number.isFinite(apartment.surface) || apartment.surface <= 0,
    );

    if (apartmentsWithInvalidSurface.length > 0) {
      issues.push({
        code: "INVALID_SURFACE",
        message: `Suprafața trebuie să fie mai mare decât 0 pentru apartamentele: ${getApartmentNumbers(
          apartmentsWithInvalidSurface,
        )}.`,
      });
    }
  }

  /*
   * Pentru BY_CONSUMPTION verificăm fiecare utilitate o singură dată.
   *
   * Dacă există două facturi de apă rece în aceeași lună,
   * nu vrem să raportăm de două ori aceleași indexuri lipsă.
   */
  const consumptionExpensesByCategory = new Map(
    expenses
      .filter(
        (expense) =>
          expense.distributionMethod ===
          ExpenseDistributionMethod.BY_CONSUMPTION,
      )
      .map((expense) => [expense.category, expense]),
  );

  const previousPeriod = getPreviousPeriod(month, year);

  for (const expense of consumptionExpensesByCategory.values()) {
    const expenseLabel = EXPENSE_CATEGORY_LABELS[expense.category];

    const utilityType = getUtilityTypeForExpenseCategory(expense.category);

    if (!utilityType) {
      issues.push({
        code: "UNSUPPORTED_CONSUMPTION_CATEGORY",
        message: `Categoria "${expenseLabel}" nu poate fi repartizată după consumul contoarelor.`,
      });

      continue;
    }

    const apartmentsWithoutMeter: MaintenanceApartment[] = [];
    const apartmentsWithoutCurrentReading: MaintenanceApartment[] = [];
    const apartmentsWithoutPreviousReading: MaintenanceApartment[] = [];
    const apartmentsWithNegativeConsumption: MaintenanceApartment[] = [];

    let totalConsumption = 0;

    for (const apartment of apartments) {
      const meter = apartment.meters.find(
        (currentMeter) => currentMeter.utilityType === utilityType,
      );

      if (!meter) {
        apartmentsWithoutMeter.push(apartment);
        continue;
      }

      const calculation = calculateMonthlyConsumption(
        meter.readings,
        month,
        year,
      );

      if (calculation.currentReading === null) {
        apartmentsWithoutCurrentReading.push(apartment);
      }

      if (calculation.previousReading === null) {
        apartmentsWithoutPreviousReading.push(apartment);
      }

      if (calculation.consumption !== null && calculation.consumption < 0) {
        apartmentsWithNegativeConsumption.push(apartment);
      }

      if (calculation.consumption !== null && calculation.consumption >= 0) {
        totalConsumption += calculation.consumption;
      }
    }

    if (apartmentsWithoutMeter.length > 0) {
      issues.push({
        code: "MISSING_METER",
        message: `${expenseLabel}: lipsește contorul pentru apartamentele: ${getApartmentNumbers(
          apartmentsWithoutMeter,
        )}.`,
      });
    }

    if (apartmentsWithoutCurrentReading.length > 0) {
      issues.push({
        code: "MISSING_CURRENT_READING",
        message: `${expenseLabel}: lipsesc indexurile pentru ${month}/${year} la apartamentele: ${getApartmentNumbers(
          apartmentsWithoutCurrentReading,
        )}.`,
      });
    }

    if (apartmentsWithoutPreviousReading.length > 0) {
      issues.push({
        code: "MISSING_PREVIOUS_READING",
        message: `${expenseLabel}: lipsesc indexurile pentru ${previousPeriod.month}/${previousPeriod.year} la apartamentele: ${getApartmentNumbers(
          apartmentsWithoutPreviousReading,
        )}.`,
      });
    }

    if (apartmentsWithNegativeConsumption.length > 0) {
      issues.push({
        code: "NEGATIVE_CONSUMPTION",
        message: `${expenseLabel}: indexul curent este mai mic decât indexul lunii precedente pentru apartamentele: ${getApartmentNumbers(
          apartmentsWithNegativeConsumption,
        )}.`,
      });
    }

    /*
     * Raportăm consum total 0 numai dacă avem suficiente date
     * pentru a calcula corect consumurile.
     *
     * Altfel ar fi redundant:
     * "lipsesc indexurile" + "consum total 0".
     */
    const hasIncompleteData =
      apartmentsWithoutMeter.length > 0 ||
      apartmentsWithoutCurrentReading.length > 0 ||
      apartmentsWithoutPreviousReading.length > 0 ||
      apartmentsWithNegativeConsumption.length > 0;

    if (!hasIncompleteData && totalConsumption <= 0) {
      issues.push({
        code: "ZERO_TOTAL_CONSUMPTION",
        message: `${expenseLabel}: consumul total calculat pentru ${month}/${year} este 0.`,
      });
    }
  }

  return issues;
}

export function formatMaintenanceValidationIssues(
  issues: MaintenanceValidationIssue[],
): string {
  if (issues.length === 0) {
    return "";
  }

  return [
    "Nu se poate genera întreținerea. Corectează următoarele probleme:",
    ...issues.map((issue, index) => `${index + 1}. ${issue.message}`),
  ].join("\n");
}
