"use client";

import { Plus, WalletCards } from "lucide-react";
import { useState } from "react";
import { createExpenseAction } from "./actions";

type ExpenseCategoryOption = {
  value: string;
  label: string;
};

type ExpenseFormProps = {
  currentMonth: number;
  currentYear: number;
  categories: ExpenseCategoryOption[];
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

export function ExpenseForm({
  currentMonth,
  currentYear,
  categories,
}: ExpenseFormProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [totalAmount, setTotalAmount] = useState("");

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

  function handleTotalAmountChange(value: string) {
    const normalizedValue = value.replace(",", ".");

    if (/^\d*(\.\d{0,2})?$/.test(normalizedValue)) {
      setTotalAmount(normalizedValue);
    }
  }

  return (
    <form action={createExpenseAction} className="space-y-5">
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
          htmlFor="category"
          className="text-sm font-medium text-slate-300"
        >
          Categorie cheltuiala
        </label>

        <select
          id="category"
          name="category"
          className="app-input mt-2 px-3 py-3"
          defaultValue={categories[0]?.value ?? ""}
          required
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-300"
        >
          Descriere
        </label>

        <input
          id="description"
          name="description"
          type="text"
          placeholder="Ex: Factură apă rece"
          className="app-input mt-2 px-3 py-3"
        />
      </div>

      <div>
        <label
          htmlFor="totalAmount"
          className="text-sm font-medium text-slate-300"
        >
          Suma totala
        </label>

        <div className="relative mt-2">
          <WalletCards
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            id="totalAmount"
            name="totalAmount"
            type="text"
            inputMode="decimal"
            value={totalAmount}
            onChange={(event) => handleTotalAmountChange(event.target.value)}
            required
            placeholder="Ex: 1200.50"
            className="app-input py-3 pl-11 pr-16"
          />

          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600">
            RON
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor="distributionMethod"
          className="text-sm font-medium text-slate-300"
        >
          Metoda de impartire
        </label>

        <select
          id="distributionMethod"
          name="distributionMethod"
          className="app-input mt-2 px-3 py-3"
          defaultValue="PER_APARTMENT"
        >
          <option value="PER_APARTMENT">Per apartament</option>
          <option value="PER_PERSON">Per persoana</option>
          <option value="BY_CONSUMPTION">Dupa consum</option>
          <option value="BY_SURFACE">Dupa suprafata</option>
        </select>
      </div>

      <button
        type="submit"
        className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
      >
        <Plus size={17} />
        Adauga cheltuiala
      </button>
    </form>
  );
}
