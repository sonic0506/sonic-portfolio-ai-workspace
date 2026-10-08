import { QueryClient, useQuery } from "@tanstack/react-query";

import { postsPath, type PostsParams } from "./blog";
import type { BlogPostPage, ProjectList } from "./types";

/**
 * 브라우저 목록 캐시 정책(ADR-0021).
 * - 5분 안에 목록에 다시 오면 요청 없이 캐시를 그린다(서버 ISR revalidate와 같은 값).
 * - 5분이 지나면 캐시를 먼저 그리고 뒤에서 새로 받는다.
 * - 쓰지 않는 목록은 30분 뒤 메모리에서 지운다. 창 포커스로는 다시 받지 않는다.
 */
export const LIST_STALE_MS = 5 * 60_000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: LIST_STALE_MS, gcTime: 30 * 60_000, refetchOnWindowFocus: false, retry: 1 },
    },
  });
}

// 같은 출처의 /api/*는 next.config rewrites가 백엔드로 넘긴다(블로그 검색과 같은 경로).
async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json" }, signal });
  if (!res.ok) throw new Error(`API ${path} 실패: ${res.status}`);
  return res.json() as Promise<T>;
}

export const useProjects = () =>
  useQuery({ queryKey: ["projects"], queryFn: ({ signal }) => getJson<ProjectList>("/api/projects", signal) });

export const usePosts = (params: PostsParams) =>
  useQuery({ queryKey: ["posts", params], queryFn: ({ signal }) => getJson<BlogPostPage>(postsPath(params), signal) });
