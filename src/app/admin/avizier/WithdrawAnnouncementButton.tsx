"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Ban, Loader2 } from "lucide-react";
import { withdrawAnnouncementAction } from "./actions";

type WithdrawAnnouncementButtonProps = {
  announcementId: string;
};

export function WithdrawAnnouncementButton({
  announcementId,
}: WithdrawAnnouncementButtonProps) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleWithdraw() {
    const confirmed = window.confirm(
      "Sigur dorești să retragi acest anunț? Locatarii nu îl vor mai vedea.",
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const formData = new FormData();

      formData.set("announcementId", announcementId);

      const result = await withdrawAnnouncementAction(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.replace(
        `/admin/avizier?success=${encodeURIComponent(result.message)}`,
      );

      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3.5 text-sm text-rose-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />

          <p>{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleWithdraw}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[0.035] px-3.5 py-2 text-sm font-medium text-rose-300 transition hover:border-rose-400/25 hover:bg-rose-500/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Se retrage...
          </>
        ) : (
          <>
            <Ban size={15} />
            Retrage anunțul
          </>
        )}
      </button>
    </div>
  );
}
