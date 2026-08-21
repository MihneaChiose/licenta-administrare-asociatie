import { getPreviousPeriod } from "@/lib/meters";

type ReadingLike = {
  month: number;
  year: number;
  readingValue: {
    toString(): string;
  };
};

export type MonthlyConsumptionResult = {
  currentReading: number | null;
  previousReading: number | null;
  consumption: number | null;
};

function roundToThreeDecimals(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function calculateMonthlyConsumption(
  readings: readonly ReadingLike[],
  month: number,
  year: number,
): MonthlyConsumptionResult {
  const previousPeriod = getPreviousPeriod(month, year);

  const currentReading = readings.find(
    (reading) => reading.month === month && reading.year === year,
  );

  const previousReading = readings.find(
    (reading) =>
      reading.month === previousPeriod.month &&
      reading.year === previousPeriod.year,
  );

  const currentValue = currentReading
    ? Number(currentReading.readingValue.toString())
    : null;

  const previousValue = previousReading
    ? Number(previousReading.readingValue.toString())
    : null;

  if (currentValue === null || previousValue === null) {
    return {
      currentReading: currentValue,
      previousReading: previousValue,
      consumption: null,
    };
  }

  return {
    currentReading: currentValue,
    previousReading: previousValue,
    consumption: roundToThreeDecimals(currentValue - previousValue),
  };
}
