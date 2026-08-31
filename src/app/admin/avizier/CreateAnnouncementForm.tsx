"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Loader2, Megaphone, Send } from "lucide-react";
import { createAnnouncementAction } from "./actions";

type AssociationOption = {
  id: string;
  name: string;
};

type CreateAnnouncementFormProps = {
  associations: AssociationOption[];
};

export function CreateAnnouncementForm({
  associations,
}: CreateAnnouncementFormProps) {
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="associationId"
            className="text-sm font-medium text-slate-300"
          >
            Asociație
          </label>

          {associations.length === 1 ? (
            <>
              <input
                type="hidden"
                name="associationId"
                value={associations[0].id}
              />

              <div className="mt-2 flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] px-3.5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.08] text-cyan-300 ring-1 ring-cyan-400/10">
                  <Building2 size={15} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Destinație
                  </p>

                  <p className="mt-0.5 truncate text-sm font-medium text-slate-300">
                    {associations[0].name}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <select
              id="associationId"
              name="associationId"
              required
              defaultValue=""
              disabled={isPending}
              className="app-input mt-2 px-3 py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                Selectează asociația
              </option>

              {associations.map((association) => (
                <option key={association.id} value={association.id}>
                  {association.name}
                </option>
              ))}
            </select>
          )}
        </div>

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
            Între 3 și 100 de caractere.
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
            Mesajul poate avea maximum 2000 de caractere.
          </p>
        </div>

        <div className="rounded-xl border border-violet-400/10 bg-violet-500/[0.035] p-3.5">
          <div className="flex items-start gap-2.5">
            <Megaphone size={16} className="mt-0.5 shrink-0 text-violet-300" />

            <p className="text-xs leading-5 text-slate-500">
              După publicare, anunțul devine vizibil locatarilor din asociația
              selectată. Îl vei putea edita sau retrage ulterior.
            </p>
          </div>
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
