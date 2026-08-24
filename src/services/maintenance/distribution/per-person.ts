import { MaintenanceCalculationError } from "../errors";
import { DistributionContext, ExpenseAllocation } from "../types";
import { allocateByWeight, calculateSharePercentage } from "../utils";

export function distributePerPerson({
  apartments,
  expense,
}: DistributionContext): ExpenseAllocation[] {
  const totalResidents = apartments.reduce(
    (sum, apartment) => sum + apartment.numberOfResidents,
    0,
  );

  if (totalResidents <= 0) {
    throw new MaintenanceCalculationError(
      "Nu se poate împărți per persoană: numărul total de persoane este 0.",
    );
  }

  const totalAmount = Number(expense.totalAmount.toString());

  const allocations = allocateByWeight(
    apartments.map((apartment) => ({
      id: apartment.id,
      weight: apartment.numberOfResidents,
    })),
    totalAmount,
  );

  return apartments.map((apartment) => ({
    apartmentId: apartment.id,

    amount: allocations.get(apartment.id) ?? 0,

    description: expense.description,

    expenseCategory: expense.category,

    distributionMethod: expense.distributionMethod,

    sourceAmount: totalAmount,

    basisValue: apartment.numberOfResidents,

    basisTotal: totalResidents,

    basisUnit: "persoane",

    sharePercentage: calculateSharePercentage(
      apartment.numberOfResidents,
      totalResidents,
    ),
  }));
}
