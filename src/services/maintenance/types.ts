import {
  ExpenseCategory,
  ExpenseDistributionMethod,
  UtilityType,
} from "@/generated/prisma/client";

export type DecimalLike = {
  toString(): string;
};

export type MaintenanceMeterReading = {
  month: number;
  year: number;
  readingValue: DecimalLike;
};

export type MaintenanceMeter = {
  utilityType: UtilityType;
  readings: MaintenanceMeterReading[];
};

export type MaintenanceApartment = {
  id: string;
  number: string;
  surface: number;
  numberOfResidents: number;
  meters: MaintenanceMeter[];
};

export type MaintenanceExpense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  totalAmount: DecimalLike;
  distributionMethod: ExpenseDistributionMethod;
};

export type ExpenseAllocation = {
  apartmentId: string;
  amount: number;
  description: string;
};

export type InvoiceItemDraft = {
  description: string;
  amount: number;
  sourceType: string;
  sourceId: string;
};

export type InvoiceDraft = {
  apartmentId: string;
  totalAmount: number;
  items: InvoiceItemDraft[];
};

export type DistributionContext = {
  apartments: MaintenanceApartment[];
  expense: MaintenanceExpense;
  month: number;
  year: number;
};

export type MaintenanceCalculationInput = {
  apartments: MaintenanceApartment[];
  expenses: MaintenanceExpense[];
  month: number;
  year: number;
};
