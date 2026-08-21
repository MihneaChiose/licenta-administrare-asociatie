import { UtilityType } from "@/generated/prisma/client";

export const METER_UTILITY_CONFIG = [
  {
    utilityType: UtilityType.COLD_WATER,
    fieldName: "coldWater",
    label: "Apă rece",
    unit: "m³",
  },
  {
    utilityType: UtilityType.HOT_WATER,
    fieldName: "hotWater",
    label: "Apă caldă",
    unit: "m³",
  },
  {
    utilityType: UtilityType.GAS,
    fieldName: "gas",
    label: "Gaze",
    unit: "m³",
  },
  {
    utilityType: UtilityType.ELECTRICITY,
    fieldName: "electricity",
    label: "Electricitate",
    unit: "kWh",
  },
  {
    utilityType: UtilityType.HEATING,
    fieldName: "heating",
    label: "Căldură",
    unit: "unități",
  },
] as const;

export const REQUIRED_METER_COUNT = METER_UTILITY_CONFIG.length;

export type MonthPeriod = {
  month: number;
  year: number;
};

export function getPreviousPeriod(month: number, year: number): MonthPeriod {
  if (month === 1) {
    return {
      month: 12,
      year: year - 1,
    };
  }

  return {
    month: month - 1,
    year,
  };
}

export function getNextPeriod(month: number, year: number): MonthPeriod {
  if (month === 12) {
    return {
      month: 1,
      year: year + 1,
    };
  }

  return {
    month: month + 1,
    year,
  };
}
