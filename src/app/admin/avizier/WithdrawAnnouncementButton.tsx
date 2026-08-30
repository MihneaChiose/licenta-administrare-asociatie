"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
      "Sigur doresti sa retragi acest anunt? Locatarii nu il vor mai vedea.",
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
    <div className="mt-4">
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleWithdraw}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Se retrage..." : "Retrage anuntul"}
      </button>
    </div>
  );
}
