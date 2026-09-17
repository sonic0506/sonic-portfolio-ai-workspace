// 관리 API 호출 — 세션 쿠키 + CSRF(XSRF-TOKEN 쿠키 → X-XSRF-TOKEN 헤더), ADR-0010

export class ApiError extends Error {
  readonly status: number
  readonly detail?: string

  constructor(status: number, detail?: string) {
    super(detail ?? `요청 실패 (${status})`)
    this.status = status
    this.detail = detail
  }
}

export function readCookie(name: string, cookie = document.cookie): string | undefined {
  const found = cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return found ? decodeURIComponent(found.slice(name.length + 1)) : undefined
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown }

export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const token = readCookie('XSRF-TOKEN')
    if (token) headers['X-XSRF-TOKEN'] = token
  }
  const res = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    let detail: string | undefined
    try {
      const problem = (await res.json()) as { detail?: string; title?: string }
      detail = problem.detail ?? problem.title
    } catch {
      // 본문이 JSON이 아니면 상태 코드만 쓴다.
    }
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const LOGIN_URL: string =
  import.meta.env.VITE_LOGIN_URL ?? 'http://localhost:8080/oauth2/authorization/github'
