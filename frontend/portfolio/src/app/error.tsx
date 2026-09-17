"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-3 py-20 text-center">
      <h1 className="text-2xl font-bold">내용을 불러오지 못했습니다</h1>
      <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
      {process.env.NODE_ENV === "development" && (
        <p className="font-mono text-xs text-destructive">{error.message}</p>
      )}
      <button type="button" onClick={reset} className="text-sm underline underline-offset-4">
        다시 시도
      </button>
    </div>
  );
}
