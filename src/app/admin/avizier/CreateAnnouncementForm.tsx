"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { createAnnouncementAction } from "./actions";

export function CreateAnnouncementForm() {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createAnnouncementAction(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      form.reset();

      const successUrl = `/admin/avizier?success=${encodeURIComponent(
        result.message,
      )}`;

      router.replace(successUrl);
      router.refresh();
    });
  }

  return (
    <>
      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-sm text-rose-300">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />

          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-300">
            Titlu
          </label>

          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={100}
            disabled={isPending}
            placeholder="Ex: Oprire apă caldă"
            className="app-input mt-2 px-3 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <p className="mt-1.5 text-xs text-slate-600">
            Maximum 100 de caractere.
          </p>
        </div>

        <div>
          <label
            htmlFor="content"
            className="text-sm font-medium text-slate-300"
          >
            Conținut
          </label>

          <textarea
            id="content"
            name="content"
            required
            minLength={10}
            maxLength={2000}
            rows={8}
            disabled={isPending}
            placeholder="Scrie anunțul pentru locatari..."
            className="app-input mt-2 resize-none px-3 py-3 leading-6 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <p className="mt-1.5 text-xs text-slate-600">
            Maximum 2000 de caractere
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Se publică...
            </>
          ) : (
            <>
              <Send size={17} />
              Publică anunțul
            </>
          )}
        </button>
      </form>
    </>
  );
}
