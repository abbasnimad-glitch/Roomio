import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="container-app flex min-h-[50vh] flex-col items-center justify-center gap-3 py-12 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">กำลังโหลด…</p>
    </div>
  );
}
