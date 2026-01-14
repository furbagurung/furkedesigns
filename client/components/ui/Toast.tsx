"use client";

export type ToastState =
  | { type: "success" | "error"; msg: string }
  | null;

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-999">
      <div
        className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
          toast.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5">{toast.type === "success" ? "✅" : "⚠️"}</span>
          <div className="max-w-[320px]">{toast.msg}</div>
        </div>
      </div>
    </div>
  );
}
