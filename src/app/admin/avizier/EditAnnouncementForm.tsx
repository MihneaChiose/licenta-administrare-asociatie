"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Pencil, Save, X } from "lucide-react";
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
        className="app-button-secondary inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium"
      >
        <Pencil size={15} />
        Editează
      </button>
    );
  }

  return (
    <div className="basis-full w-full overflow-hidden rounded-2xl border border-violet-400/10 bg-violet-500/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.055] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
            <Pencil size={14} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-violet-400/70">
              Editare
            </p>

            <h4 className="mt-0.5 text-sm font-semibold text-slate-200">
              Modifică anunțul
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          aria-label="Închide editarea"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={15} />
        </button>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3.5 text-sm text-rose-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="announcementId" value={announcementId} />

          <div>
            <label
              htmlFor={`title-${announcementId}`}
              className="text-sm font-medium text-slate-300"
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
              className="app-input mt-2 px-3 py-3 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor={`content-${announcementId}`}
              className="text-sm font-medium text-slate-300"
            >
              Conținut
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
              className="app-input mt-2 resize-none px-3 py-3 leading-6 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="app-button-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Se salvează...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Salvează modificările
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="app-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={15} />
              Renunță
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
