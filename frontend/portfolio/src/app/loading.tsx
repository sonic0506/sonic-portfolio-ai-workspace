import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      불러오는 중…
    </div>
  );
}
