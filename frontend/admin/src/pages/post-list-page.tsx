import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { keys } from '@/features/content-queries'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { AdminBlogPostItem } from '@/lib/types'

export function PostListPage() {
  const posts = useQuery({ queryKey: keys.posts, queryFn: () => api<AdminBlogPostItem[]>('/api/admin/blog/posts') })
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
      <ErrorText error={posts.error} />
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
                    <Badge variant={p.published ? 'secondary' : 'outline'}>{p.published ? '공개' : '비공개'}</Badge>
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
