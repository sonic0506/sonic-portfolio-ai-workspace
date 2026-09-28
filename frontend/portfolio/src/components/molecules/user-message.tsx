/** 사용자 메시지만 버블을 쓴다. 답변은 전폭 텍스트다. */
export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[75%] rounded-lg border border-border bg-surface-hi px-3.5 py-2.5 font-body text-md leading-[1.6] whitespace-pre-wrap text-text-1">
        {text}
      </p>
    </div>
  );
}
