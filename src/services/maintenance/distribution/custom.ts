import { ExpenseAllocation, DistributionContext } from "../types";
import { allocateByWeight } from "../utils";

export function distributeCustom({
  apartments,
  expense,
}: DistributionContext): ExpenseAllocation[] {
  const totalAmount = Number(expense.totalAmount.toString());

  const allocations = allocateByWeight(
    apartments.map((apartment) => ({
      id: apartment.id,
      weight: 1,
    })),
    totalAmount,
  );

  return apartments.map((apartment) => ({
    apartmentId: apartment.id,
    amount: allocations.get(apartment.id) ?? 0,
    description: `${expense.description} (custom)`,
  }));
}
