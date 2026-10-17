export const SCROLL_THRESHOLDS = [25, 50, 75, 90] as const;

/** 본문 스크롤 위치에서 이번에 새로 넘은 비율. 이미 보낸 값(`sent`)은 뺀다. */
export function newlyCrossed(scrollTop: number, clientHeight: number, scrollHeight: number, sent: ReadonlySet<number>) {
  if (scrollHeight <= 0) return [];
  const percent = ((scrollTop + clientHeight) / scrollHeight) * 100;
  return SCROLL_THRESHOLDS.filter((t) => percent >= t && !sent.has(t));
}
