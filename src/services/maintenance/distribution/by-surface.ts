import { MaintenanceCalculationError } from "../errors";
import { ExpenseAllocation, DistributionContext } from "../types";
import { allocateByWeight } from "../utils";

export function distributeBySurface({
  apartments,
  expense,
}: DistributionContext): ExpenseAllocation[] {
  const totalSurface = apartments.reduce(
    (sum, apartment) => sum + apartment.surface,
    0,
  );

  if (totalSurface <= 0) {
    throw new MaintenanceCalculationError(
      "Nu se poate împărți după suprafață: suprafața totală este 0.",
    );
  }

  const totalAmount = Number(expense.totalAmount.toString());

  const allocations = allocateByWeight(
    apartments.map((apartment) => ({
      id: apartment.id,
      weight: apartment.surface,
    })),
    totalAmount,
  );

  return apartments.map((apartment) => ({
    apartmentId: apartment.id,
    amount: allocations.get(apartment.id) ?? 0,
    description: expense.description,
  }));
}
