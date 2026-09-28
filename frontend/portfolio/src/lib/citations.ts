/** 답변의 근거 번호([1] 등)는 서버가 출처를 고르는 데만 쓰고 화면에서는 뺀다. 출처는 답변 아래에 따로 표시한다. */
export function stripCitations(text: string): string {
  return text.replace(/[ \t]*\[\d+\](?!\()/g, "");
}
