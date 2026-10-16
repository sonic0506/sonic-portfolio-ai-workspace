import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { keys } from '@/features/content-queries'
import { api } from '@/lib/api'
import { blogPostToForm, blogPostToRequest } from '@/features/content-schemas'
import { formatDateTime } from '@/lib/format'
import type { AdminBlogPostDetail, AdminBlogPostItem } from '@/lib/types'

const BASE = '/api/admin/blog/posts'

export function PostListPage() {
  const queryClient = useQueryClient()
  const posts = useQuery({ queryKey: keys.posts, queryFn: () => api<AdminBlogPostItem[]>(BASE) })
  // 관리 API는 전체 교체(PUT)뿐이라 최신 상세를 읽어 published만 바꿔 다시 보낸다. 저장하면 색인도 다시 만들어진다.
  const toggle = useMutation({
    mutationFn: async (p: AdminBlogPostItem) => {
      const detail = await api<AdminBlogPostDetail>(`${BASE}/${p.id}`)
      const body = { ...blogPostToRequest(blogPostToForm(detail)), published: !p.published }
      return api<AdminBlogPostDetail>(`${BASE}/${p.id}`, { method: 'PUT', body })
    },
    onSuccess: async (res) => {
      queryClient.setQueryData(keys.post(res.id), res)
      await queryClient.invalidateQueries({ queryKey: keys.posts, exact: true })
      void queryClient.invalidateQueries({ queryKey: keys.rag })
    },
  })
  return (
    <>
      <PageTitle
        actions={
          <Link to="/posts/new" className={buttonVariants()}>
            새 글
          </Link>
        }
      >
        블로그
      </PageTitle>
      <ErrorText error={posts.error ?? toggle.error} />
      {posts.isPending && <Loading />}
      {posts.data && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">발행</th>
                <th className="px-3 py-2">수정</th>
              </tr>
            </thead>
            <tbody>
              {posts.data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link to={`/posts/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.published}
                      aria-label={`${p.title} 공개 여부`}
                      title={p.published ? '클릭하면 비공개로 바꿉니다' : '클릭하면 공개로 바꿉니다'}
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate(p)}
                      className="cursor-pointer disabled:cursor-wait disabled:opacity-50"
                    >
                      <Badge variant={p.published ? 'secondary' : 'outline'}>
                        {toggle.isPending && toggle.variables?.id === p.id ? '변경 중…' : p.published ? '공개' : '비공개'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {p.publishedAt ? formatDateTime(p.publishedAt) : '초안'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.data.length === 0 && <p className="p-4 text-sm text-muted-foreground">글이 없습니다.</p>}
        </div>
      )}
    </>
  )
}
