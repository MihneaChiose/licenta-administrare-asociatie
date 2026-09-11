import { UtilityType } from "@/generated/prisma/client";

export const METER_UTILITY_CONFIG = [
  {
    utilityType: UtilityType.COLD_WATER,
    fieldName: "coldWater",
    label: "Apă rece",
    unit: "m³",
    decimals: 3,
  },
  {
    utilityType: UtilityType.HOT_WATER,
    fieldName: "hotWater",
    label: "Apă caldă",
    unit: "m³",
    decimals: 3,
  },
  {
    utilityType: UtilityType.GAS,
    fieldName: "gas",
    label: "Gaze",
    unit: "m³",
    decimals: 3,
  },
  {
    utilityType: UtilityType.ELECTRICITY,
    fieldName: "electricity",
    label: "Electricitate",
    unit: "kWh",
    decimals: 2,
  },
  {
    utilityType: UtilityType.HEATING,
    fieldName: "heating",
    label: "Căldură",
    unit: "unități",
    decimals: 3,
  },
] as const;

export const TENANT_METER_UTILITY_CONFIG = METER_UTILITY_CONFIG.filter(
  (utility) => utility.utilityType !== UtilityType.HEATING,
);

export const REQUIRED_METER_COUNT = METER_UTILITY_CONFIG.length;

export const TENANT_REQUIRED_METER_COUNT = TENANT_METER_UTILITY_CONFIG.length;

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

export function getMeterUtilityConfig(utilityType: UtilityType) {
  return (
    METER_UTILITY_CONFIG.find((config) => config.utilityType === utilityType) ??
    null
  );
}
