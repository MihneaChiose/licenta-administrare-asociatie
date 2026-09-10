"use client";

import { Droplets, Send } from "lucide-react";
import { useState } from "react";
import { submitMeterReadingAction } from "./actions";

type UtilityOption = {
  utilityType: string;
  label: string;
  unit: string;
  decimals: number;
};

type MeterReadingFormProps = {
  currentMonth: number;
  currentYear: number;
  utilities: UtilityOption[];
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

export function MeterReadingForm({
  currentMonth,
  currentYear,
  utilities,
}: MeterReadingFormProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedUtilityType, setSelectedUtilityType] = useState("");

  const years = Array.from(
    { length: currentYear - 2024 + 1 },
    (_, index) => currentYear - index,
  );

  const availableMonths = Object.entries(monthNames).filter(
    ([month]) => selectedYear < currentYear || Number(month) <= currentMonth,
  );

  const selectedUtility = utilities.find(
    (utility) => utility.utilityType === selectedUtilityType,
  );

  const decimals = selectedUtility?.decimals ?? 3;

  const step = decimals === 2 ? "0.01" : "0.001";
  const placeholder = decimals === 2 ? "0.00" : "0.000";

  function handleYearChange(year: number) {
    setSelectedYear(year);

    if (year === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }

  return (
    <form action={submitMeterReadingAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div>
        <label
          htmlFor="utilityType"
          className="text-sm font-medium text-slate-300"
        >
          Utilitate
        </label>

        <select
          id="utilityType"
          name="utilityType"
          required
          value={selectedUtilityType}
          onChange={(event) => setSelectedUtilityType(event.target.value)}
          className="app-input mt-2 px-3 py-3"
        >
          <option value="" disabled>
            Selectează utilitatea
          </option>

          {utilities.map((utility) => (
            <option key={utility.utilityType} value={utility.utilityType}>
              {utility.label} ({utility.unit})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="readingValue"
          className="text-sm font-medium text-slate-300"
        >
          Index curent
        </label>

        <div className="relative mt-2">
          <Droplets
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            id="readingValue"
            name="readingValue"
            type="number"
            step={step}
            min="0"
            required
            placeholder={placeholder}
            className="app-input py-3 pl-11 pr-4 font-medium tabular-nums"
          />
        </div>
      </div>

      <button
        type="submit"
        className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
      >
        <Send size={17} />
        Trimite indexul
      </button>
    </form>
  );
}
