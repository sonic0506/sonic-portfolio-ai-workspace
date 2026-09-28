import { afterEach, describe, expect, it } from "vitest";
import { findConversation, listConversations, removeConversation, touch, upsert, visible, type StoredConversation } from "./chat-store";

const HOUR = 60 * 60 * 1000;
const at = (ms: number) => new Date(ms).toISOString();
const conv = (id: string, expiresIn: number, updated = 0): StoredConversation => ({
  id,
  key: `k-${id}`,
  title: id,
  expiresAt: at(Date.now() + expiresIn),
  updatedAt: at(Date.now() + updated),
});

describe("chat-store", () => {
  afterEach(() => window.localStorage.clear());

  it("만료된 대화는 목록에서 빠지고 최근 질문 순으로 정렬된다", () => {
    const list = visible([conv("old", HOUR, -2), conv("expired", -1), conv("new", HOUR, -1)]);
    expect(list.map((c) => c.id)).toEqual(["new", "old"]);
  });

  it("질문하면 만료가 24시간 뒤로 밀리고 맨 위로 온다", () => {
    upsert(conv("a", HOUR, -5));
    upsert(conv("b", HOUR, -1));
    touch("a");
    const list = listConversations();
    expect(list[0].id).toBe("a");
    expect(Date.parse(list[0].expiresAt) - Date.now()).toBeGreaterThan(23 * HOUR);
  });

  it("같은 저장값이면 같은 배열을 돌려주고 삭제하면 사라진다", () => {
    upsert(conv("a", HOUR));
    expect(listConversations()).toBe(listConversations());
    removeConversation("a");
    expect(findConversation("a")).toBeUndefined();
  });

  it("저장 후 만료 시각이 지나면 읽을 때 보이지 않는다", () => {
    window.localStorage.setItem("portfolio.chat.conversations.v1", JSON.stringify([conv("gone", -1000)]));
    expect(listConversations()).toEqual([]);
  });
});
