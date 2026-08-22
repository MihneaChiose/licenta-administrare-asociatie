import {
  EXPENSE_CATEGORY_LABELS,
  getUtilityTypeForExpenseCategory,
} from "@/lib/expenses";
import { getPreviousPeriod } from "@/lib/meters";
import { calculateMonthlyConsumption } from "@/services/consumptions/monthly-consumption";
import { MaintenanceCalculationError } from "../errors";
import { DistributionContext, ExpenseAllocation } from "../types";
import { allocateByWeight } from "../utils";

export function distributeByConsumption({
  apartments,
  expense,
  month,
  year,
}: DistributionContext): ExpenseAllocation[] {
  const utilityType = getUtilityTypeForExpenseCategory(expense.category);

  const expenseLabel = EXPENSE_CATEGORY_LABELS[expense.category];

  if (!utilityType) {
    throw new MaintenanceCalculationError(
      `Cheltuiala "${expenseLabel}" nu poate fi împărțită după consum.`,
    );
  }

  const previousPeriod = getPreviousPeriod(month, year);

  const calculatedConsumptions = apartments.map((apartment) => {
    const meter = apartment.meters.find(
      (currentMeter) => currentMeter.utilityType === utilityType,
    );

    if (!meter) {
      return {
        apartment,
        hasMeter: false,
        currentReading: null,
        previousReading: null,
        consumption: null,
      };
    }

    const calculation = calculateMonthlyConsumption(
      meter.readings,
      month,
      year,
    );

    return {
      apartment,
      hasMeter: true,
      ...calculation,
    };
  });

  const apartmentsWithoutMeter = calculatedConsumptions.filter(
    (item) => !item.hasMeter,
  );

  if (apartmentsWithoutMeter.length > 0) {
    const apartmentNumbers = apartmentsWithoutMeter
      .map((item) => item.apartment.number)
      .join(", ");

    throw new MaintenanceCalculationError(
      `Nu se poate calcula "${expenseLabel}". Lipsește contorul pentru apartamentele: ${apartmentNumbers}.`,
    );
  }

  const apartmentsWithoutCurrentReading = calculatedConsumptions.filter(
    (item) => item.currentReading === null,
  );

  if (apartmentsWithoutCurrentReading.length > 0) {
    const apartmentNumbers = apartmentsWithoutCurrentReading
      .map((item) => item.apartment.number)
      .join(", ");

    throw new MaintenanceCalculationError(
      `Nu se poate calcula "${expenseLabel}". Lipsesc indexurile pentru ${month}/${year} la apartamentele: ${apartmentNumbers}.`,
    );
  }

  const apartmentsWithoutPreviousReading = calculatedConsumptions.filter(
    (item) => item.previousReading === null,
  );

  if (apartmentsWithoutPreviousReading.length > 0) {
    const apartmentNumbers = apartmentsWithoutPreviousReading
      .map((item) => item.apartment.number)
      .join(", ");

    throw new MaintenanceCalculationError(
      `Nu se poate calcula "${expenseLabel}". Lipsesc indexurile pentru ${previousPeriod.month}/${previousPeriod.year} la apartamentele: ${apartmentNumbers}.`,
    );
  }

  const invalidConsumptions = calculatedConsumptions.filter(
    (item) => item.consumption !== null && item.consumption < 0,
  );

  if (invalidConsumptions.length > 0) {
    const apartmentNumbers = invalidConsumptions
      .map((item) => item.apartment.number)
      .join(", ");

    throw new MaintenanceCalculationError(
      `Nu se poate calcula "${expenseLabel}". Există indexuri mai mici decât luna precedentă la apartamentele: ${apartmentNumbers}.`,
    );
  }

  const totalConsumption = calculatedConsumptions.reduce(
    (sum, item) => sum + (item.consumption ?? 0),
    0,
  );

  if (totalConsumption <= 0) {
    throw new MaintenanceCalculationError(
      `Nu se poate calcula "${expenseLabel}": consumul total este 0.`,
    );
  }

  const totalAmount = Number(expense.totalAmount.toString());

  const allocations = allocateByWeight(
    calculatedConsumptions.map((item) => ({
      id: item.apartment.id,
      weight: item.consumption ?? 0,
    })),
    totalAmount,
    {
      remainderToLastPositive: true,
    },
  );

  return calculatedConsumptions.map((item) => ({
    apartmentId: item.apartment.id,
    amount: allocations.get(item.apartment.id) ?? 0,
    description: `${expense.description} - consum ${(
      item.consumption ?? 0
    ).toFixed(3)}`,
  }));
}
