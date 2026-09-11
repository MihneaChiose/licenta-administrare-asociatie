"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function PasswordField() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor="password" className="text-sm font-medium text-slate-300">
        Parolă
      </label>

      <div className="relative mt-2">
        <LockKeyhole
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
        />

        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className="app-input py-3 pl-11 pr-12"
          placeholder="Minimum 8 caractere"
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Ascunde parola" : "Afișează parola"}
          title={showPassword ? "Ascunde parola" : "Afișează parola"}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-300"
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
