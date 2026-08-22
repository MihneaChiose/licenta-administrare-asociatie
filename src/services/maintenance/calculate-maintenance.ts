import { ExpenseDistributionMethod } from "@/generated/prisma/client";
import { distributeByConsumption } from "./distribution/by-consumption";
import { distributeBySurface } from "./distribution/by-surface";
import { distributeCustom } from "./distribution/custom";
import { distributePerApartment } from "./distribution/per-apartment";
import { distributePerPerson } from "./distribution/per-person";
import { MaintenanceCalculationError } from "./errors";
import {
  DistributionContext,
  ExpenseAllocation,
  InvoiceDraft,
  MaintenanceCalculationInput,
} from "./types";
import { roundToTwoDecimals } from "./utils";

function distributeExpense(context: DistributionContext): ExpenseAllocation[] {
  switch (context.expense.distributionMethod) {
    case ExpenseDistributionMethod.PER_APARTMENT:
      return distributePerApartment(context);

    case ExpenseDistributionMethod.PER_PERSON:
      return distributePerPerson(context);

    case ExpenseDistributionMethod.BY_SURFACE:
      return distributeBySurface(context);

    case ExpenseDistributionMethod.BY_CONSUMPTION:
      return distributeByConsumption(context);

    case ExpenseDistributionMethod.CUSTOM:
      return distributeCustom(context);

    default:
      throw new MaintenanceCalculationError(
        `Metoda de repartizare "${context.expense.distributionMethod}" nu este suportată.`,
      );
  }
}

export function calculateMaintenance({
  apartments,
  expenses,
  month,
  year,
}: MaintenanceCalculationInput): InvoiceDraft[] {
  const invoices = new Map<string, InvoiceDraft>(
    apartments.map((apartment) => [
      apartment.id,
      {
        apartmentId: apartment.id,
        totalAmount: 0,
        items: [],
      },
    ]),
  );

  for (const expense of expenses) {
    const allocations = distributeExpense({
      apartments,
      expense,
      month,
      year,
    });

    for (const allocation of allocations) {
      const invoice = invoices.get(allocation.apartmentId);

      if (!invoice) {
        throw new MaintenanceCalculationError(
          `Nu a fost găsită factura temporară pentru apartamentul ${allocation.apartmentId}.`,
        );
      }

      invoice.items.push({
        description: allocation.description,
        amount: allocation.amount,
        sourceType: "EXPENSE",
        sourceId: expense.id,
      });

      invoice.totalAmount = roundToTwoDecimals(
        invoice.totalAmount + allocation.amount,
      );
    }
  }

  return Array.from(invoices.values());
}
