import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { keys } from '@/features/content-queries'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { AdminProjectItem } from '@/lib/types'

export function ProjectListPage() {
  const projects = useQuery({ queryKey: keys.projects, queryFn: () => api<AdminProjectItem[]>('/api/admin/projects') })
  return (
    <>
      <PageTitle
        actions={
          <Link to="/projects/new" className={buttonVariants()}>
            새 프로젝트
          </Link>
        }
      >
        프로젝트
      </PageTitle>
      <ErrorText error={projects.error} />
      {projects.isPending && <Loading />}
      {projects.data && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">순서</th>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">기간</th>
                <th className="px-3 py-2">수정</th>
              </tr>
            </thead>
            <tbody>
              {projects.data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.displayOrder}</td>
                  <td className="px-3 py-2">
                    <Link to={`/projects/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </td>
                  <td className="space-x-1 px-3 py-2">
                    <Badge variant={p.published ? 'secondary' : 'outline'}>{p.published ? '공개' : '비공개'}</Badge>
                    {p.featured && <Badge variant="outline">대표</Badge>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {p.periodStart} ~ {p.periodEnd ?? '진행 중'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.data.length === 0 && <p className="p-4 text-sm text-muted-foreground">프로젝트가 없습니다.</p>}
        </div>
      )}
    </>
  )
}
