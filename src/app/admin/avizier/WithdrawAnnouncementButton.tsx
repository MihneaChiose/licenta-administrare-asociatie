"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Ban, Loader2, TriangleAlert, X } from "lucide-react";
import { withdrawAnnouncementAction } from "./actions";
import { createPortal } from "react-dom";

type WithdrawAnnouncementButtonProps = {
  announcementId: string;
};

export function WithdrawAnnouncementButton({
  announcementId,
}: WithdrawAnnouncementButtonProps) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleWithdraw() {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();

      formData.set("announcementId", announcementId);

      const result = await withdrawAnnouncementAction(formData);

      if (!result.success) {
        setError(result.message);
        setIsConfirmOpen(false);
        return;
      }

      setIsConfirmOpen(false);

      router.replace(
        `/admin/avizier?success=${encodeURIComponent(result.message)}`,
      );

      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-3">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3.5 text-sm text-rose-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsConfirmOpen(true);
          }}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[0.035] px-3.5 py-2 text-sm font-medium text-rose-300 transition hover:border-rose-400/25 hover:bg-rose-500/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Ban size={15} />
          Retrage anunțul
        </button>
      </div>

      {isConfirmOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isPending) {
                setIsConfirmOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="withdraw-announcement-title"
              className="relative w-full max-w-md overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#10182a] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-rose-500/[0.08] blur-3xl" />

              <div className="relative p-6">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isPending}
                  aria-label="Închide"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={17} />
                </button>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-rose-500/[0.08] text-rose-300 ring-1 ring-rose-400/15">
                    <TriangleAlert size={20} />
                  </div>

                  <div className="min-w-0 pr-8">
                    <h2
                      id="withdraw-announcement-title"
                      className="text-lg font-semibold text-slate-100"
                    >
                      Retragi anunțul?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Anunțul nu va mai fi vizibil locatarilor, dar va rămâne
                      păstrat în istoricul avizierului.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsConfirmOpen(false)}
                    disabled={isPending}
                    className="app-button-secondary inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anulează
                  </button>

                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.1] px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/[0.16] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Se retrage...
                      </>
                    ) : (
                      <>
                        <Ban size={16} />
                        Retrage anunțul
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
