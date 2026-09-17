import "server-only";
import { notFound } from "next/navigation";
import type { BlogPostDetail, BlogPostPage, ProjectDetail, ProjectList, Profile } from "./types";

// 백엔드(local 프로필)는 127.0.0.1에만 바인딩한다. Node는 localhost를 ::1(IPv6)로 먼저 찾을 수 있어 IPv4 주소를 쓴다.
const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" } });
  } catch (e) {
    throw new Error(`백엔드(${API_BASE_URL}) 연결 실패: ${path}`, { cause: e });
  }
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API ${path} 실패: ${res.status}`);
  return res.json() as Promise<T>;
}

export const getProjects = () => get<ProjectList>("/api/projects");
export const getProject = (slug: string) => get<ProjectDetail>(`/api/projects/${encodeURIComponent(slug)}`);
export const getProfile = () => get<Profile>("/api/profile");
export const getPost = (slug: string) => get<BlogPostDetail>(`/api/blog/posts/${encodeURIComponent(slug)}`);

export function getPosts(params: { page?: number; category?: string; tag?: string }) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.category) q.set("category", params.category);
  if (params.tag) q.set("tag", params.tag);
  const qs = q.toString();
  return get<BlogPostPage>(`/api/blog/posts${qs ? `?${qs}` : ""}`);
}

/** 프로필이 아직 없을 수 있는 화면(홈)에서 쓴다. */
export async function getProfileOrNull(): Promise<Profile | null> {
  const res = await fetch(`${API_BASE_URL}/api/profile`, { headers: { Accept: "application/json" } }).catch((e) => {
    throw new Error(`백엔드(${API_BASE_URL}) 연결 실패: /api/profile`, { cause: e });
  });
  if (!res.ok) return null;
  return res.json() as Promise<Profile>;
}
