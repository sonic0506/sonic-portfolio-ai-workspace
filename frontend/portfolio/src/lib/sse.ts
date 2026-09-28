export type SseEvent = { event: string; data: string };

/**
 * text/event-stream 본문을 이벤트 단위로 읽는다.
 * Spring SseEmitter는 "event:x\ndata:{...}\n\n" 형식(콜론 뒤 공백 없음)으로 보낸다.
 */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    yield* parser.push(decoder.decode(value, { stream: true }));
  }
  yield* parser.push(decoder.decode());
  yield* parser.push("\n\n");
}

export function createSseParser() {
  let buffer = "";
  return {
    *push(chunk: string): Generator<SseEvent> {
      buffer += chunk.replace(/\r\n?/g, "\n");
      let index: number;
      while ((index = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const parsed = parseBlock(block);
        if (parsed) yield parsed;
      }
    },
  };
}

function parseBlock(block: string): SseEvent | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  return data.length ? { event, data: data.join("\n") } : null;
}
