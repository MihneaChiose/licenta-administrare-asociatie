"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editAnnouncementAction } from "./actions";

type EditAnnouncementFormProps = {
  announcementId: string;
  initialTitle: string;
  initialContent: string;
};

export function EditAnnouncementForm({
  announcementId,
  initialTitle,
  initialContent,
}: EditAnnouncementFormProps) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    setIsEditing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await editAnnouncementAction(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setIsEditing(false);

      router.replace(
        `/admin/avizier?success=${encodeURIComponent(result.message)}`,
      );

      router.refresh();
    });
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Editeaza
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-sm font-semibold text-gray-900">Editeaza anuntul</h4>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <input type="hidden" name="announcementId" value={announcementId} />

        <div>
          <label
            htmlFor={`title-${announcementId}`}
            className="text-sm font-medium text-gray-700"
          >
            Titlu
          </label>

          <input
            id={`title-${announcementId}`}
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={100}
            defaultValue={initialTitle}
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor={`content-${announcementId}`}
            className="text-sm font-medium text-gray-700"
          >
            Continut
          </label>

          <textarea
            id={`content-${announcementId}`}
            name="content"
            required
            minLength={10}
            maxLength={2000}
            rows={6}
            defaultValue={initialContent}
            disabled={isPending}
            className="mt-1 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isPending ? "Se salveaza..." : "Salveaza modificarile"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Renunta
          </button>
        </div>
      </form>
    </div>
  );
}
