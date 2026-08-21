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
