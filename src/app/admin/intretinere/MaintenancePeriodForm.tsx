"use client";

import { Calculator } from "lucide-react";
import { useState } from "react";
import { calculateMaintenanceListAction } from "./actions";

type MaintenancePeriodFormProps = {
  currentMonth: number;
  currentYear: number;
};

const monthNames: Record<number, string> = {
  1: "Ianuarie",
  2: "Februarie",
  3: "Martie",
  4: "Aprilie",
  5: "Mai",
  6: "Iunie",
  7: "Iulie",
  8: "August",
  9: "Septembrie",
  10: "Octombrie",
  11: "Noiembrie",
  12: "Decembrie",
};

export function MaintenancePeriodForm({
  currentMonth,
  currentYear,
}: MaintenancePeriodFormProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = Array.from(
    { length: currentYear - 2024 + 1 },
    (_, index) => currentYear - index,
  );

  const availableMonths = Object.entries(monthNames).filter(
    ([month]) => selectedYear < currentYear || Number(month) <= currentMonth,
  );

  function handleYearChange(year: number) {
    setSelectedYear(year);

    if (year === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }

  return (
    <form action={calculateMaintenanceListAction} className="space-y-5">
      <div>
        <label htmlFor="month" className="text-sm font-medium text-slate-300">
          Luna
        </label>

        <select
          id="month"
          name="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(Number(event.target.value))}
          className="app-input mt-2 px-3 py-3"
        >
          {availableMonths.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="year" className="text-sm font-medium text-slate-300">
          An
        </label>

        <select
          id="year"
          name="year"
          value={selectedYear}
          onChange={(event) => handleYearChange(Number(event.target.value))}
          className="app-input mt-2 px-3 py-3"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
      >
        <Calculator size={17} />
        Calculează lista
      </button>
    </form>
  );
}
