import { describe, expect, it } from "vitest";
import { createSseParser } from "./sse";

describe("createSseParser", () => {
  it("나뉘어 도착한 Spring 형식 이벤트를 합친다", () => {
    const parser = createSseParser();
    const first = [...parser.push('event:status\ndata:{"stage":"SEAR')];
    const rest = [...parser.push('CHING"}\n\nevent:answer_delta\ndata:{"text":"안녕"}\n\n')];
    expect(first).toEqual([]);
    expect(rest).toEqual([
      { event: "status", data: '{"stage":"SEARCHING"}' },
      { event: "answer_delta", data: '{"text":"안녕"}' },
    ]);
  });

  it("공백이 있는 표준 형식, CRLF, 여러 줄 data, 주석을 처리한다", () => {
    const parser = createSseParser();
    const events = [...parser.push(": ping\r\n\r\nevent: done\r\ndata: a\r\ndata: b\r\n\r\n")];
    expect(events).toEqual([{ event: "done", data: "a\nb" }]);
  });
});
