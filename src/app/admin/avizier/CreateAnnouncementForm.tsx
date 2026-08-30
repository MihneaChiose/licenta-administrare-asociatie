"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="associationId"
            className="text-sm font-medium text-gray-700"
          >
            Asociatie
          </label>

          {associations.length === 1 ? (
            <>
              <input
                type="hidden"
                name="associationId"
                value={associations[0].id}
              />

              <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {associations[0].name}
              </div>
            </>
          ) : (
            <select
              id="associationId"
              name="associationId"
              required
              defaultValue=""
              disabled={isPending}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black disabled:bg-gray-100"
            >
              <option value="" disabled>
                Selecteaza asociatia
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
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
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
            placeholder="Ex: Oprire apa calda"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="text-sm font-medium text-gray-700"
          >
            Continut
          </label>

          <textarea
            id="content"
            name="content"
            required
            minLength={10}
            maxLength={2000}
            rows={8}
            disabled={isPending}
            placeholder="Scrie anuntul pentru locatari..."
            className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isPending ? "Se publica..." : "Publica anuntul"}
        </button>
      </form>
    </>
  );
}
